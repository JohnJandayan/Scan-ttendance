import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock RealtimeService before importing the hook
const mockUnsubscribe = vi.fn()
const mockSubscribeToEventUpdates = vi.fn(() => mockUnsubscribe)
const mockSubscribeToOrganizationUpdates = vi.fn(() => mockUnsubscribe)

vi.mock('@/lib/realtime', () => ({
  RealtimeService: {
    subscribeToEventUpdates: mockSubscribeToEventUpdates,
    subscribeToOrganizationUpdates: mockSubscribeToOrganizationUpdates,
    unsubscribe: vi.fn(),
    unsubscribeAll: vi.fn()
  }
}))

// Import after mocking
const { useRealtime, useOrganizationRealtime } = await import('@/hooks/useRealtime')

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscribeToEventUpdates.mockReturnValue(mockUnsubscribe)
    mockSubscribeToOrganizationUpdates.mockReturnValue(mockUnsubscribe)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: false
    }))

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.reconnect).toBe('function')
    expect(typeof result.current.disconnect).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('should create subscription when enabled', () => {
    const onVerificationUpdate = vi.fn()
    const onStatsUpdate = vi.fn()
    const onError = vi.fn()

    renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true,
      onVerificationUpdate,
      onStatsUpdate,
      onError
    }))

    expect(mockSubscribeToEventUpdates).toHaveBeenCalledWith({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      onVerificationUpdate: expect.any(Function),
      onStatsUpdate: expect.any(Function),
      onError: expect.any(Function)
    })
  })

  it('should not create subscription when disabled', () => {
    renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: false
    }))

    expect(mockSubscribeToEventUpdates).not.toHaveBeenCalled()
  })

  it('should not create subscription when required props are missing', () => {
    renderHook(() => useRealtime({
      eventId: '',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true
    }))

    expect(mockSubscribeToEventUpdates).not.toHaveBeenCalled()
  })

  it('should handle verification updates', () => {
    const onVerificationUpdate = vi.fn()
    let capturedCallback: any

    mockSubscribeToEventUpdates.mockImplementation((options: any) => {
      capturedCallback = options.onVerificationUpdate
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true,
      onVerificationUpdate
    }))

    const mockVerification = {
      id: 'test-id',
      name: 'John Doe',
      participantId: 'participant-123',
      status: 'verified' as const,
      verifiedAt: new Date()
    }

    act(() => {
      capturedCallback(mockVerification)
    })

    expect(onVerificationUpdate).toHaveBeenCalledWith(mockVerification)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should handle stats updates', () => {
    const onStatsUpdate = vi.fn()
    let capturedCallback: any

    mockSubscribeToEventUpdates.mockImplementation((options: any) => {
      capturedCallback = options.onStatsUpdate
      return mockUnsubscribe
    })

    renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true,
      onStatsUpdate
    }))

    const mockStats = {
      totalAttendees: 100,
      verifiedAttendees: 50,
      verificationRate: 50
    }

    act(() => {
      capturedCallback(mockStats)
    })

    expect(onStatsUpdate).toHaveBeenCalledWith(mockStats)
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useRealtime({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true
    }))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})

describe('useOrganizationRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscribeToOrganizationUpdates.mockReturnValue(mockUnsubscribe)
  })

  it('should create organization subscription when enabled', () => {
    const onEventUpdate = vi.fn()
    const onError = vi.fn()

    renderHook(() => useOrganizationRealtime({
      schemaName: 'org_test',
      enabled: true,
      onEventUpdate,
      onError
    }))

    expect(mockSubscribeToOrganizationUpdates).toHaveBeenCalledWith(
      'org_test',
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('should handle event updates', () => {
    const onEventUpdate = vi.fn()
    let capturedCallback: any

    mockSubscribeToOrganizationUpdates.mockImplementation(
      (schemaName: string, callback: any) => {
        capturedCallback = callback
        return mockUnsubscribe
      }
    )

    const { result } = renderHook(() => useOrganizationRealtime({
      schemaName: 'org_test',
      enabled: true,
      onEventUpdate
    }))

    const mockEvent = {
      id: 'event-id',
      name: 'Test Event',
      creatorId: 'creator-id',
      createdAt: new Date(),
      isActive: true,
      attendanceTableName: 'test_attendance',
      verificationTableName: 'test_verification'
    }

    act(() => {
      capturedCallback(mockEvent)
    })

    expect(onEventUpdate).toHaveBeenCalledWith(mockEvent)
    expect(result.current.isConnected).toBe(true)
  })

  it('should not create subscription when disabled', () => {
    renderHook(() => useOrganizationRealtime({
      schemaName: 'org_test',
      enabled: false
    }))

    expect(mockSubscribeToOrganizationUpdates).not.toHaveBeenCalled()
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useOrganizationRealtime({
      schemaName: 'org_test',
      enabled: true
    }))

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})