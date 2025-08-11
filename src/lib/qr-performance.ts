// QR Scanner Performance Optimization Utilities

export interface NetworkCondition {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  downlink: number
  rtt: number
  saveData: boolean
}

export interface CameraConstraints {
  width: { ideal: number }
  height: { ideal: number }
  frameRate: { ideal: number; max: number }
  facingMode?: string
  focusMode?: string
  exposureMode?: string
  whiteBalanceMode?: string
}

export class QRPerformanceOptimizer {
  private static instance: QRPerformanceOptimizer
  private networkInfo: NetworkCondition | null = null
  private deviceInfo: {
    isMobile: boolean
    isLowEnd: boolean
    hasTouch: boolean
    pixelRatio: number
  }

  private constructor() {
    this.deviceInfo = this.detectDeviceCapabilities()
    this.detectNetworkConditions()
  }

  public static getInstance(): QRPerformanceOptimizer {
    if (!QRPerformanceOptimizer.instance) {
      QRPerformanceOptimizer.instance = new QRPerformanceOptimizer()
    }
    return QRPerformanceOptimizer.instance
  }

  // Detect device capabilities
  private detectDeviceCapabilities() {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    // Estimate if device is low-end based on various factors
    const isLowEnd = this.isLowEndDevice()
    
    return {
      isMobile,
      isLowEnd,
      hasTouch: 'ontouchstart' in window,
      pixelRatio: window.devicePixelRatio || 1
    }
  }

  // Detect if device is low-end
  private isLowEndDevice(): boolean {
    // Check for low-end indicators
    const hardwareConcurrency = navigator.hardwareConcurrency || 1
    const memory = (navigator as any).deviceMemory || 1
    const pixelRatio = window.devicePixelRatio || 1
    
    // Consider low-end if:
    // - Less than 2 CPU cores
    // - Less than 2GB RAM
    // - Low pixel ratio (older devices)
    return hardwareConcurrency < 2 || memory < 2 || pixelRatio < 1.5
  }

  // Detect network conditions
  private detectNetworkConditions(): void {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      this.networkInfo = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      }

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.networkInfo = {
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        }
      })
    }
  }

  // Get optimized camera constraints based on device and network
  public getOptimizedCameraConstraints(): CameraConstraints {
    const baseConstraints: CameraConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 }
    }

    // Adjust for mobile devices
    if (this.deviceInfo.isMobile) {
      baseConstraints.facingMode = 'environment' // Use back camera
      baseConstraints.focusMode = 'continuous'
      baseConstraints.exposureMode = 'continuous'
      baseConstraints.whiteBalanceMode = 'continuous'
    }

    // Adjust for low-end devices
    if (this.deviceInfo.isLowEnd) {
      baseConstraints.width = { ideal: 640 }
      baseConstraints.height = { ideal: 480 }
      baseConstraints.frameRate = { ideal: 15, max: 20 }
    }

    // Adjust for poor network conditions
    if (this.networkInfo) {
      if (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g') {
        baseConstraints.width = { ideal: 480 }
        baseConstraints.height = { ideal: 360 }
        baseConstraints.frameRate = { ideal: 10, max: 15 }
      } else if (this.networkInfo.effectiveType === '3g') {
        baseConstraints.width = { ideal: 640 }
        baseConstraints.height = { ideal: 480 }
        baseConstraints.frameRate = { ideal: 20, max: 25 }
      }

      // Reduce quality if save data is enabled
      if (this.networkInfo.saveData) {
        baseConstraints.width = { ideal: 480 }
        baseConstraints.height = { ideal: 360 }
        baseConstraints.frameRate = { ideal: 15, max: 20 }
      }
    }

    return baseConstraints
  }

  // Get scan timeout based on network conditions
  public getScanTimeout(): number {
    if (!this.networkInfo) return 10000 // Default 10 seconds

    switch (this.networkInfo.effectiveType) {
      case 'slow-2g':
        return 30000 // 30 seconds
      case '2g':
        return 20000 // 20 seconds
      case '3g':
        return 15000 // 15 seconds
      case '4g':
      default:
        return 10000 // 10 seconds
    }
  }

  // Get retry delay based on network conditions
  public getRetryDelay(): number {
    if (!this.networkInfo) return 1000 // Default 1 second

    switch (this.networkInfo.effectiveType) {
      case 'slow-2g':
        return 5000 // 5 seconds
      case '2g':
        return 3000 // 3 seconds
      case '3g':
        return 2000 // 2 seconds
      case '4g':
      default:
        return 1000 // 1 second
    }
  }

  // Check if should use offline mode
  public shouldUseOfflineMode(): boolean {
    if (!navigator.onLine) return true
    
    if (this.networkInfo) {
      // Use offline mode for very poor connections
      return this.networkInfo.effectiveType === 'slow-2g' || 
             (this.networkInfo.effectiveType === '2g' && this.networkInfo.rtt > 2000)
    }
    
    return false
  }

  // Get debounce delay for scan processing
  public getScanDebounceDelay(): number {
    if (this.deviceInfo.isLowEnd) {
      return 500 // 500ms for low-end devices
    }
    
    return 200 // 200ms for normal devices
  }

  // Get optimal video element size
  public getOptimalVideoSize(): { width: number; height: number } {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const pixelRatio = this.deviceInfo.pixelRatio

    let width = Math.min(screenWidth, 640)
    let height = Math.min(screenHeight, 480)

    // Adjust for high DPI displays
    if (pixelRatio > 1.5 && !this.deviceInfo.isLowEnd) {
      width = Math.min(screenWidth * 0.8, 800)
      height = Math.min(screenHeight * 0.8, 600)
    }

    // Ensure aspect ratio is maintained
    const aspectRatio = 4 / 3
    if (width / height > aspectRatio) {
      width = height * aspectRatio
    } else {
      height = width / aspectRatio
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  // Check if device supports advanced camera features
  public supportsAdvancedCamera(): boolean {
    return this.deviceInfo.isMobile && !this.deviceInfo.isLowEnd
  }

  // Get device info
  public getDeviceInfo() {
    return { ...this.deviceInfo }
  }

  // Get network info
  public getNetworkInfo() {
    return this.networkInfo ? { ...this.networkInfo } : null
  }

  // Performance monitoring
  public measureScanPerformance(startTime: number): {
    duration: number
    fps: number
    isOptimal: boolean
  } {
    const duration = Date.now() - startTime
    const fps = 1000 / duration
    
    // Consider optimal if scan completes quickly
    const isOptimal = duration < 2000 && fps > 10
    
    return { duration, fps, isOptimal }
  }

  // Adaptive quality adjustment
  public adjustQualityBasedOnPerformance(
    averageScanTime: number,
    currentConstraints: CameraConstraints
  ): CameraConstraints {
    const newConstraints = { ...currentConstraints }
    
    // If scans are taking too long, reduce quality
    if (averageScanTime > 3000) {
      newConstraints.width = { ideal: Math.max(320, newConstraints.width.ideal * 0.8) }
      newConstraints.height = { ideal: Math.max(240, newConstraints.height.ideal * 0.8) }
      newConstraints.frameRate = { 
        ideal: Math.max(10, newConstraints.frameRate.ideal * 0.8),
        max: Math.max(15, newConstraints.frameRate.max * 0.8)
      }
    }
    // If scans are very fast, we can increase quality
    else if (averageScanTime < 1000 && !this.deviceInfo.isLowEnd) {
      newConstraints.width = { ideal: Math.min(1920, newConstraints.width.ideal * 1.2) }
      newConstraints.height = { ideal: Math.min(1080, newConstraints.height.ideal * 1.2) }
      newConstraints.frameRate = { 
        ideal: Math.min(30, newConstraints.frameRate.ideal * 1.1),
        max: Math.min(60, newConstraints.frameRate.max * 1.1)
      }
    }
    
    return newConstraints
  }
}

// Export singleton instance
export const qrPerformanceOptimizer = QRPerformanceOptimizer.getInstance()