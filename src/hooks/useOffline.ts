import { useState, useEffect, useCallback } from 'react'
import { serviceWorkerManager } from '@/lib/service-worker'

export interface UseOfflineReturn {
  isOnline: boolean
  offlineScansCount: number
  syncOfflineScans: () => Promise<void>
  clearOfflineScans: () => Promise<void>
  showOfflineScanNotification: (participantId: string) => void
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineScansCount, setOfflineScansCount] = useState(0)

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    const online = navigator.onLine
    setIsOnline(online)
    
    if (online) {
      // When coming back online, sync offline scans
      syncOfflineScans()
    }
  }, [])

  // Update offline scans count
  const updateOfflineScansCount = useCallback(async () => {
    try {
      const count = await serviceWorkerManager.getOfflineScansCount()
      setOfflineScansCount(count)
    } catch (error) {
      console.error('Failed to update offline scans count:', error)
    }
  }, [])

  // Sync offline scans
  const syncOfflineScans = useCallback(async () => {
    try {
      const countBefore = await serviceWorkerManager.getOfflineScansCount()
      await serviceWorkerManager.syncOfflineScans()
      
      // Wait a bit for sync to complete, then update count
      setTimeout(async () => {
        const countAfter = await serviceWorkerManager.getOfflineScansCount()
        setOfflineScansCount(countAfter)
        
        // Show notification if scans were synced
        const syncedCount = countBefore - countAfter
        if (syncedCount > 0) {
          serviceWorkerManager.showSyncCompleteNotification(syncedCount)
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to sync offline scans:', error)
    }
  }, [])

  // Clear offline scans
  const clearOfflineScans = useCallback(async () => {
    try {
      await serviceWorkerManager.clearOfflineScans()
      setOfflineScansCount(0)
    } catch (error) {
      console.error('Failed to clear offline scans:', error)
    }
  }, [])

  // Show offline scan notification
  const showOfflineScanNotification = useCallback((participantId: string) => {
    serviceWorkerManager.showOfflineScanNotification(participantId)
    updateOfflineScansCount()
  }, [updateOfflineScansCount])

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => updateOnlineStatus()
    const handleOffline = () => updateOnlineStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial setup
    updateOnlineStatus()
    updateOfflineScansCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateOnlineStatus, updateOfflineScansCount])

  // Periodically update offline scans count
  useEffect(() => {
    const interval = setInterval(updateOfflineScansCount, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [updateOfflineScansCount])

  return {
    isOnline,
    offlineScansCount,
    syncOfflineScans,
    clearOfflineScans,
    showOfflineScanNotification
  }
}