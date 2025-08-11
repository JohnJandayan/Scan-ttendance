import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventCreation from '@/components/events/EventCreation'

// Mock the CSV utils
vi.mock('@/lib/csv-utils', () => ({
  parseCSV: vi.fn(),
  validateCSVFile: vi.fn(),
  readFileAsText: vi.fn()
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EventCreation', () => {
  const mockProps = {
    organizationId: 'org-123',
    onEventCreated: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render event creation form', () => {
    render(<EventCreation {...mockProps} />)

    expect(screen.getByText('Create New Event')).toBeInTheDocument()
    expect(screen.getByLabelText(/Event Name/)).toBeInTheDocument()
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
    expect(screen.getByText('CSV Import')).toBeInTheDocument()
  })

  it('should show manual entry form by default', () => {
    render(<EventCreation {...mockProps} />)

    expect(screen.getByLabelText(/Attendee Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Participant ID/)).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('should switch to CSV import mode', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const csvRadio = screen.getByLabelText('CSV Import')
    await user.click(csvRadio)

    expect(screen.getByText('Upload CSV File')).toBeInTheDocument()
    expect(screen.getByText(/CSV should have columns/)).toBeInTheDocument()
  })

  it('should add manual attendees', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    expect(screen.getByText('Added Attendees (1)')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
  })

  it('should prevent duplicate participant IDs', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    // Add first attendee
    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    // Try to add duplicate ID
    await user.clear(nameInput)
    await user.clear(idInput)
    await user.type(nameInput, 'Jane Smith')
    await user.type(idInput, '12345')
    await user.click(addButton)

    expect(screen.getByText('Participant ID already exists')).toBeInTheDocument()
  })

  it('should remove manual attendees', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    // Add attendee
    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    expect(screen.getByText('John Doe')).toBeInTheDocument()

    // Remove attendee
    const removeButton = screen.getByText('Remove')
    await user.click(removeButton)

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    // Add an attendee first to enable the button
    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    // Now try to submit without event name
    const createButton = screen.getByText('Create Event')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Event name is required')).toBeInTheDocument()
    })
  })

  it('should require at least one attendee', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const eventNameInput = screen.getByLabelText(/Event Name/)
    await user.type(eventNameInput, 'Test Event')

    const createButton = screen.getByText('Create Event')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('At least one attendee is required')).toBeInTheDocument()
    })
  })

  it('should handle CSV file upload', async () => {
    const user = userEvent.setup()
    const { parseCSV, validateCSVFile, readFileAsText } = await import('@/lib/csv-utils')
    
    // Mock CSV utilities
    vi.mocked(validateCSVFile).mockReturnValue({
      success: true,
      data: new File(['test'], 'test.csv')
    })
    vi.mocked(readFileAsText).mockResolvedValue('Name,ID\nJohn Doe,12345')
    vi.mocked(parseCSV).mockReturnValue({
      success: true,
      data: [{ name: 'John Doe', participantId: '12345' }],
      totalRows: 1,
      validRows: 1
    })

    render(<EventCreation {...mockProps} />)

    // Switch to CSV mode
    const csvRadio = screen.getByLabelText('CSV Import')
    await user.click(csvRadio)

    // Upload file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['Name,ID\nJohn Doe,12345'], 'test.csv', { type: 'text/csv' })
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('✓ Success')).toBeInTheDocument()
      expect(screen.getByText('Successfully imported 1 attendees')).toBeInTheDocument()
    })
  })

  it('should handle CSV parsing errors', async () => {
    const user = userEvent.setup()
    const { parseCSV, validateCSVFile, readFileAsText } = await import('@/lib/csv-utils')
    
    // Mock CSV utilities with error
    vi.mocked(validateCSVFile).mockReturnValue({
      success: true,
      data: new File(['test'], 'test.csv')
    })
    vi.mocked(readFileAsText).mockResolvedValue('invalid,csv')
    vi.mocked(parseCSV).mockReturnValue({
      success: false,
      errors: ['Row 1: Name is required'],
      totalRows: 1,
      validRows: 0
    })

    render(<EventCreation {...mockProps} />)

    // Switch to CSV mode
    const csvRadio = screen.getByLabelText('CSV Import')
    await user.click(csvRadio)

    // Upload file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['invalid,csv'], 'test.csv', { type: 'text/csv' })
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('⚠ Errors Found')).toBeInTheDocument()
      expect(screen.getByText('• Row 1: Name is required')).toBeInTheDocument()
    })
  })

  it('should create event successfully', async () => {
    const user = userEvent.setup()
    
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'event-123', name: 'Test Event' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { added: 1 }
        })
      })

    render(<EventCreation {...mockProps} />)

    // Fill in event name
    const eventNameInput = screen.getByLabelText(/Event Name/)
    await user.type(eventNameInput, 'Test Event')

    // Add attendee
    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    // Submit form
    const createButton = screen.getByText('Create Event')
    await user.click(createButton)

    await waitFor(() => {
      expect(mockProps.onEventCreated).toHaveBeenCalledWith('event-123')
    })

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledWith('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Event',
        creatorId: 'org-123'
      })
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/events/event-123/attendees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendees: [{ name: 'John Doe', participantId: '12345' }]
      })
    })
  })

  it('should handle event creation errors', async () => {
    const user = userEvent.setup()
    
    // Mock failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: 'Event name already exists' }
      })
    })

    render(<EventCreation {...mockProps} />)

    // Fill in event name
    const eventNameInput = screen.getByLabelText(/Event Name/)
    await user.type(eventNameInput, 'Test Event')

    // Add attendee
    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    // Submit form
    const createButton = screen.getByText('Create Event')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Event name already exists')).toBeInTheDocument()
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('should disable create button when loading', async () => {
    const user = userEvent.setup()
    
    // Mock slow API response
    mockFetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { id: 'event-123' } })
      }), 1000)
    }))

    render(<EventCreation {...mockProps} />)

    // Fill in required fields
    const eventNameInput = screen.getByLabelText(/Event Name/)
    await user.type(eventNameInput, 'Test Event')

    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    // Submit form
    const createButton = screen.getByText('Create Event')
    await user.click(createButton)

    // Button should be disabled and show loading text
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
  })

  it('should show attendee summary', async () => {
    const user = userEvent.setup()
    render(<EventCreation {...mockProps} />)

    // Add manual attendee
    const nameInput = screen.getByLabelText(/Attendee Name/)
    const idInput = screen.getByLabelText(/Participant ID/)
    const addButton = screen.getByText('Add')

    await user.type(nameInput, 'John Doe')
    await user.type(idInput, '12345')
    await user.click(addButton)

    expect(screen.getByText('Ready to create event with 1 attendee')).toBeInTheDocument()
  })
})