// Service Worker Registration and Management

export interface OfflineScan {
  eventId: string
  participantId: string
  timestamp: string
  synced: boolean
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  private constructor() {
    // Only add event listeners on the client side
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  public static getInstance(): ServiceWorkerManager {
    // Only create instance on client side
    if (typeof window === 'undefined') {
      return {} as ServiceWorkerManager
    }
    
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  // Register service worker
  public async register(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('Service Worker registered successfully')

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate()
              }
            })
          }
        })

        // Register for background sync
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          await (this.registration as any).sync.register('sync-offline-scans')
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // Unregister service worker
  public async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister()
      this.registration = null
    }
  }

  // Handle online event
  private handleOnline(): void {
    this.isOnline = true
    console.log('Connection restored - syncing offline scans')
    this.syncOfflineScans()
  }

  // Handle offline event
  private handleOffline(): void {
    this.isOnline = false
    console.log('Connection lost - enabling offline mode')
  }

  // Check if online
  public getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Sync offline scans
  public async syncOfflineScans(): Promise<void> {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'SYNC_OFFLINE_SCANS'
      })
    }
  }

  // Get offline scans count
  public async getOfflineScansCount(): Promise<number> {
    try {
      const offlineScans = await this.getOfflineScans()
      return Object.keys(offlineScans).filter(key => !offlineScans[key].synced).length
    } catch (error) {
      console.error('Failed to get offline scans count:', error)
      return 0
    }
  }

  // Get offline scans from IndexedDB
  private async getOfflineScans(): Promise<Record<string, OfflineScan>> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScanTtendanceOffline', 1)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('offlineScans')) {
          db.createObjectStore('offlineScans')
        }
      }
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['offlineScans'], 'readonly')
        const store = transaction.objectStore('offlineScans')
        const getRequest = store.get('scans')
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || {})
        }
        
        getRequest.onerror = () => {
          reject(new Error('Failed to get offline scans'))
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }
    })
  }

  // Clear all offline scans
  public async clearOfflineScans(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScanTtendanceOffline', 1)
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['offlineScans'], 'readwrite')
        const store = transaction.objectStore('offlineScans')
        
        store.delete('scans')
        
        transaction.oncomplete = () => {
          resolve()
        }
        
        transaction.onerror = () => {
          reject(new Error('Failed to clear offline scans'))
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }
    })
  }

  // Notify about service worker update
  private notifyUpdate(): void {
    // You can implement a toast notification or modal here
    console.log('New version available - please refresh the page')
    
    // Optionally show a notification to the user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scan-ttendance Update Available', {
        body: 'A new version is available. Please refresh the page.',
        icon: '/icon-192x192.png'
      })
    }
  }

  // Request notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission()
    }
    return 'denied'
  }

  // Show offline scan notification
  public showOfflineScanNotification(participantId: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scan Cached Offline', {
        body: `Scan for ${participantId} has been cached and will sync when online.`,
        icon: '/icon-192x192.png',
        tag: 'offline-scan'
      })
    }
  }

  // Show sync complete notification
  public showSyncCompleteNotification(count: number): void {
    if ('Notification' in window && Notification.permission === 'granted' && count > 0) {
      new Notification('Offline Scans Synced', {
        body: `${count} offline scan${count > 1 ? 's' : ''} have been synced successfully.`,
        icon: '/icon-192x192.png',
        tag: 'sync-complete'
      })
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance()