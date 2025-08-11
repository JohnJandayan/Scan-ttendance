// Service Worker for Offline QR Scanning
const CACHE_NAME = 'scan-ttendance-v1'
const OFFLINE_CACHE_NAME = 'scan-ttendance-offline-v1'

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/manifest.json',
  '/offline.html'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_FILES))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  // Handle QR scan verification requests
  if (event.request.url.includes('/api/events/') && event.request.url.includes('/verify')) {
    event.respondWith(handleScanVerification(event.request))
    return
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If offline and no cache, return offline page
        if (event.request.destination === 'document') {
          return caches.match('/offline.html')
        }
      })
  )
})

// Handle QR scan verification with offline caching
async function handleScanVerification(request) {
  try {
    // Try to make the request
    const response = await fetch(request)
    
    if (response.ok) {
      // If successful, clear any cached offline scans for this event
      const url = new URL(request.url)
      const eventId = url.pathname.split('/')[3] // Extract event ID from path
      await clearOfflineScans(eventId)
      return response
    } else {
      throw new Error('Network request failed')
    }
  } catch (error) {
    // If offline or network error, cache the scan for later
    return handleOfflineScan(request)
  }
}

// Handle offline scan caching
async function handleOfflineScan(request) {
  try {
    const requestData = await request.clone().json()
    const url = new URL(request.url)
    const eventId = url.pathname.split('/')[3]
    
    // Store scan in offline cache
    const offlineCache = await caches.open(OFFLINE_CACHE_NAME)
    const offlineKey = `offline-scan-${eventId}-${Date.now()}`
    
    const offlineResponse = new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Scan cached for when connection is restored',
      data: {
        id: offlineKey,
        participantId: requestData.participantId,
        status: 'cached',
        verifiedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
    await offlineCache.put(offlineKey, offlineResponse.clone())
    
    // Store scan data for sync later
    await storeOfflineScan(eventId, requestData)
    
    return offlineResponse
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: { message: 'Failed to cache scan offline' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Store offline scan data for later sync
async function storeOfflineScan(eventId, scanData) {
  const offlineScans = await getOfflineScans()
  const scanId = `${eventId}-${Date.now()}`
  
  offlineScans[scanId] = {
    eventId,
    participantId: scanData.participantId,
    timestamp: new Date().toISOString(),
    synced: false
  }
  
  await setOfflineScans(offlineScans)
}

// Get offline scans from IndexedDB
async function getOfflineScans() {
  return new Promise((resolve) => {
    const request = indexedDB.open('ScanTtendanceOffline', 1)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offlineScans')) {
        db.createObjectStore('offlineScans')
      }
    }
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['offlineScans'], 'readonly')
      const store = transaction.objectStore('offlineScans')
      const getRequest = store.get('scans')
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result || {})
      }
      
      getRequest.onerror = () => {
        resolve({})
      }
    }
    
    request.onerror = () => {
      resolve({})
    }
  })
}

// Set offline scans in IndexedDB
async function setOfflineScans(scans) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ScanTtendanceOffline', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['offlineScans'], 'readwrite')
      const store = transaction.objectStore('offlineScans')
      
      store.put(scans, 'scans')
      
      transaction.oncomplete = () => {
        resolve()
      }
    }
  })
}

// Clear offline scans for a specific event
async function clearOfflineScans(eventId) {
  const offlineScans = await getOfflineScans()
  const updatedScans = {}
  
  for (const [scanId, scanData] of Object.entries(offlineScans)) {
    if (scanData.eventId !== eventId) {
      updatedScans[scanId] = scanData
    }
  }
  
  await setOfflineScans(updatedScans)
}

// Background sync for offline scans
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-scans') {
    event.waitUntil(syncOfflineScans())
  }
})

// Sync offline scans when connection is restored
async function syncOfflineScans() {
  const offlineScans = await getOfflineScans()
  const syncPromises = []
  
  for (const [scanId, scanData] of Object.entries(offlineScans)) {
    if (!scanData.synced) {
      const syncPromise = syncSingleScan(scanData)
        .then(() => {
          // Mark as synced
          scanData.synced = true
        })
        .catch((error) => {
          console.error('Failed to sync scan:', error)
        })
      
      syncPromises.push(syncPromise)
    }
  }
  
  await Promise.all(syncPromises)
  await setOfflineScans(offlineScans)
}

// Sync a single offline scan
async function syncSingleScan(scanData) {
  const response = await fetch(`/api/events/${scanData.eventId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      participantId: scanData.participantId
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to sync scan')
  }
  
  return response.json()
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_OFFLINE_SCANS') {
    syncOfflineScans()
  }
})