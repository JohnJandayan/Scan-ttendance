'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import styles from '@/styles/responsive.module.css'
import { qrPerformanceOptimizer } from '@/lib/qr-performance'
import { useOffline } from '@/hooks/useOffline'

interface QRScannerProps {
  onScan: (result: string) => void
  onError: (error: string) => void
  isActive: boolean
  onClose: () => void
}

export default function QRScanner({ onScan, onError, isActive, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanPerformance, setScanPerformance] = useState<{
    averageTime: number
    scanCount: number
    lastScanTime: number
  }>({ averageTime: 0, scanCount: 0, lastScanTime: 0 })
  
  // Use offline hook
  const { isOnline, offlineScansCount, showOfflineScanNotification } = useOffline()

  // Detect mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(mobile)
    }

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkMobile()
    checkOrientation()

    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Prevent body scroll when scanner is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden'
      // Prevent zoom on iOS
      document.addEventListener('touchmove', preventZoom, { passive: false })
    } else {
      document.body.style.overflow = 'unset'
      document.removeEventListener('touchmove', preventZoom)
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('touchmove', preventZoom)
    }
  }, [isActive])

  const preventZoom = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  }

  useEffect(() => {
    if (isActive) {
      initializeScanner()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const initializeScanner = async () => {
    try {
      // Get optimized camera constraints based on device and network
      const optimizedConstraints = qrPerformanceOptimizer.getOptimizedCameraConstraints()
      
      const constraints = {
        video: optimizedConstraints
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setHasPermission(true)
      setStream(mediaStream)
      
      // Stop the test stream
      mediaStream.getTracks().forEach(track => track.stop())

      // Initialize code reader
      const reader = new BrowserMultiFormatReader()
      setCodeReader(reader)

      // Get available video devices
      const devices = await reader.listVideoInputDevices()
      setVideoDevices(devices)
      
      if (devices.length > 0) {
        // Prefer back camera on mobile devices
        let preferredDevice = devices[0]
        if (isMobile) {
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          )
          if (backCamera) {
            preferredDevice = backCamera
          }
        }
        
        setSelectedDeviceId(preferredDevice.deviceId)
        startScanning(reader, preferredDevice.deviceId)
      } else {
        onError('No camera devices found')
      }
    } catch (error) {
      console.error('Camera initialization error:', error)
      setHasPermission(false)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Camera permission denied. Please allow camera access and try again.')
        } else if (error.name === 'NotFoundError') {
          onError('No camera found on this device.')
        } else if (error.name === 'NotReadableError') {
          onError('Camera is being used by another application. Please close other camera apps and try again.')
        } else {
          onError('Failed to access camera: ' + error.message)
        }
      } else {
        onError('Failed to access camera')
      }
    }
  }

  const startScanning = async (reader: BrowserMultiFormatReader, deviceId: string) => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      
      // Get optimized constraints with device ID
      const optimizedConstraints = qrPerformanceOptimizer.getOptimizedCameraConstraints()
      const constraints = {
        video: {
          ...optimizedConstraints,
          deviceId: { exact: deviceId }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      // Track scan performance
      let scanStartTime = Date.now()
      
      await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, error) => {
        if (result) {
          const scannedText = result.getText()
          const scanEndTime = Date.now()
          const scanDuration = scanEndTime - scanStartTime
          
          // Update performance metrics
          setScanPerformance(prev => {
            const newScanCount = prev.scanCount + 1
            const newAverageTime = ((prev.averageTime * prev.scanCount) + scanDuration) / newScanCount
            return {
              averageTime: newAverageTime,
              scanCount: newScanCount,
              lastScanTime: scanDuration
            }
          })
          
          console.log('QR Code scanned:', scannedText, `(${scanDuration}ms)`)
          
          // Provide haptic feedback on mobile
          if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate(200)
          }
          
          // Show offline notification if not online
          if (!isOnline) {
            showOfflineScanNotification(scannedText)
          }
          
          onScan(scannedText)
          
          // Reset scan timer for next scan
          scanStartTime = Date.now()
        }
        
        if (error && !(error instanceof NotFoundException)) {
          console.error('Scanning error:', error)
          // Don't show NotFoundException errors as they're normal when no QR code is visible
        }
      })
    } catch (error) {
      console.error('Start scanning error:', error)
      setIsScanning(false)
      onError('Failed to start scanning: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const stopScanning = useCallback(() => {
    if (codeReader) {
      codeReader.reset()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }, [codeReader, stream])

  const switchCamera = async (deviceId: string) => {
    if (!codeReader) return
    
    stopScanning()
    setSelectedDeviceId(deviceId)
    await startScanning(codeReader, deviceId)
  }

  const toggleFlash = async () => {
    if (!stream) return

    try {
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities() as any
      
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        })
        setIsFlashOn(!isFlashOn)
      }
    } catch (error) {
      console.error('Flash toggle error:', error)
    }
  }

  if (!isActive) {
    return null
  }

  if (hasPermission === false) {
    return (
      <div className={`${styles.mobileModal} bg-black bg-opacity-75`}>
        <div className={`${styles.mobileModalContent} flex items-center justify-center`}>
          <div className={`${styles.mobileModalPanel} ${styles.mobileCard} max-w-md mx-4`}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`${styles.responsiveSubheading} text-gray-900 mb-4`}>
                Camera Permission Required
              </h3>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                This app needs camera access to scan QR codes. Please allow camera permission and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={initializeScanner}
                  className={`${styles.touchButton} bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex-1`}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className={`${styles.touchButton} bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 flex-1`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.cameraContainer} safe-area-top safe-area-bottom`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center p-4 safe-area-top">
          <h3 className="text-white text-lg md:text-xl font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className={`${styles.touchTarget} text-white hover:text-gray-300 transition-colors duration-200 flex items-center justify-center rounded-full bg-black/30`}
            aria-label="Close scanner"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera controls */}
      <div className="absolute top-20 left-4 right-4 z-20 flex justify-between items-center">
        {/* Camera selector */}
        {videoDevices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => switchCamera(e.target.value)}
            className={`${styles.touchTarget} bg-black/50 text-white border border-white/30 rounded-lg px-3 py-2 text-sm backdrop-blur-sm`}
          >
            {videoDevices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-black text-white">
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        {/* Flash toggle for mobile */}
        {isMobile && (
          <button
            onClick={toggleFlash}
            className={`${styles.touchTarget} text-white hover:text-gray-300 transition-colors duration-200 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ${
              isFlashOn ? 'bg-yellow-500/30' : ''
            }`}
            aria-label="Toggle flash"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        className={`${styles.cameraVideo}`}
        playsInline
        muted
        autoPlay
      />

      {/* Scanning overlay */}
      <div className={`${styles.cameraOverlay} pointer-events-none`}>
        <div className={`${styles.cameraFrame} ${isMobile && orientation === 'portrait' ? 'w-72 h-72' : 'w-80 h-80'} relative`}>
          {/* Corner indicators */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-sm md:text-base mb-2">Position QR code within frame</div>
              {isScanning && (
                <div className="animate-pulse text-xs md:text-sm">Scanning...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions and Status */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="text-center p-4 safe-area-bottom">
          {/* Offline indicator */}
          {!isOnline && (
            <div className="mb-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Offline Mode - Scans will sync when online
              {offlineScansCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/30 rounded-full text-xs">
                  {offlineScansCount} cached
                </span>
              )}
            </div>
          )}
          
          <p className="text-white text-sm md:text-base mb-2">
            {isMobile ? 'Hold steady and center the QR code' : 'Hold your device steady and point the camera at the QR code'}
          </p>
          
          {isMobile && (
            <p className="text-white/80 text-xs mb-2">
              Tap the flash button if you need more light
            </p>
          )}
          
          {/* Performance indicator for development */}
          {process.env.NODE_ENV === 'development' && scanPerformance.scanCount > 0 && (
            <p className="text-white/60 text-xs">
              Avg scan time: {Math.round(scanPerformance.averageTime)}ms | 
              Last: {Math.round(scanPerformance.lastScanTime)}ms | 
              Count: {scanPerformance.scanCount}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}