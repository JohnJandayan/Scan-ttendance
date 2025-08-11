import { vi, expect } from 'vitest'

/**
 * Test utilities and helpers for the Scan-ttendance application
 */

// Mock data generators
export const generateMockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

export const generateMockEvent = (overrides = {}) => ({
  id: 'event-123',
  name: 'Test Event',
  description: 'Test event description',
  creatorId: 'user-123',
  organizationId: 'org-123',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  endedAt: null,
  ...overrides
})

export const generateMockAttendee = (overrides = {}) => ({
  id: 'attendee-123',
  name: 'John Doe',
  participantId: 'ID001',
  eventId: 'event-123',
  createdAt: new Date('2024-01-01'),
  ...overrides
})

export const generateMockVerification = (overrides = {}) => ({
  id: 'verification-123',
  participantId: 'ID001',
  name: 'John Doe',
  eventId: 'event-123',
  status: 'verified' as const,
  verifiedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides
})

export const generateMockMember = (overrides = {}) => ({
  id: 'member-123',
  name: 'Test Member',
  email: 'member@example.com',
  role: 'manager' as const,
  organizationId: 'org-123',
  createdAt: new Date('2024-01-01'),
  ...overrides
})

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  timestamp: new Date().toISOString()
})

export const mockApiError = (code: string, message: string, details?: any) => ({
  success: false,
  error: {
    code,
    message,
    details
  },
  timestamp: new Date().toISOString()
})

// Database mocks
export const createMockDatabase = () => ({
  query: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
  createSchema: vi.fn(),
  createTable: vi.fn(),
  dropTable: vi.fn()
})

// Authentication mocks
export const createMockAuthContext = (user = null) => ({
  user,
  isAuthenticated: !!user,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  loading: false,
  error: null
})

// QR Scanner mocks
export const createMockQRScanner = () => ({
  initialize: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  decode: vi.fn(),
  cleanup: vi.fn(),
  onScan: vi.fn(),
  onError: vi.fn()
})

// Real-time mocks
export const createMockRealtime = () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  connected: true
})

// Form validation helpers
export const expectFormValidation = async (
  form: HTMLFormElement,
  expectedErrors: Record<string, string>
) => {
  const errors: Record<string, string> = {}
  
  // Simulate form validation
  const inputs = form.querySelectorAll('input, textarea, select')
  inputs.forEach((input) => {
    const element = input as HTMLInputElement
    if (!element.checkValidity()) {
      errors[element.name] = element.validationMessage
    }
  })
  
  Object.entries(expectedErrors).forEach(([field, message]) => {
    expect(errors[field]).toContain(message)
  })
}

// Performance testing helpers
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  maxDuration: number
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now()
  const result = await operation()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  expect(duration).toBeLessThan(maxDuration)
  
  return { result, duration }
}

// Memory usage helpers
export const measureMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage()
  }
  
  // Browser environment fallback
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory
  }
  
  return null
}

// CSV testing helpers
export const createMockCSVFile = (data: Array<Record<string, string>>) => {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n')
  
  return new File([csvContent], 'test.csv', { type: 'text/csv' })
}

// Date/time helpers
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString)
  vi.setSystemTime(mockDate)
  return mockDate
}

export const resetDate = () => {
  vi.useRealTimers()
}

// Local storage mocks
export const createMockLocalStorage = () => {
  const storage: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    length: 0,
    key: vi.fn()
  }
}

// Camera API mocks
export const createMockMediaDevices = () => ({
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn(),
  getSupportedConstraints: vi.fn()
})

// WebSocket mocks
export const createMockWebSocket = () => {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  }
  
  return mockWS
}

// Test data cleanup
export const cleanupTestData = async (database: any, organizationId: string) => {
  // Clean up test data in reverse dependency order
  await database.query('DELETE FROM event_verification WHERE event_id IN (SELECT id FROM events WHERE organization_id = $1)', [organizationId])
  await database.query('DELETE FROM event_attendance WHERE event_id IN (SELECT id FROM events WHERE organization_id = $1)', [organizationId])
  await database.query('DELETE FROM events WHERE organization_id = $1', [organizationId])
  await database.query('DELETE FROM organization_members WHERE organization_id = $1', [organizationId])
  await database.query('DELETE FROM organizations WHERE id = $1', [organizationId])
}

// Async testing helpers
export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`))
      } else {
        setTimeout(check, 100)
      }
    }
    
    check()
  })
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}