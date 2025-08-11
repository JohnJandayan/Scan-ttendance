import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  parseCSV, 
  validateCSVData, 
  attendeesToCSV, 
  validateCSVFile,
  readFileAsText
} from '@/lib/csv-utils'
import { CSVAttendee } from '@/types'

describe('CSV Utils', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV with header', () => {
      const csvContent = `Name,Participant ID
John Doe,12345
Jane Smith,67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        name: 'John Doe',
        participantId: '12345'
      })
      expect(result.data?.[1]).toEqual({
        name: 'Jane Smith',
        participantId: '67890'
      })
      expect(result.totalRows).toBe(2)
      expect(result.validRows).toBe(2)
    })

    it('should parse valid CSV without header', () => {
      const csvContent = `John Doe,12345
Jane Smith,67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2)
      expect(result.validRows).toBe(2)
    })

    it('should handle quoted values with commas', () => {
      const csvContent = `"Doe, John",12345
"Smith, Jane",67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(true)
      expect(result.data?.[0]).toEqual({
        name: 'Doe, John',
        participantId: '12345'
      })
    })

    it('should handle escaped quotes', () => {
      const csvContent = `"John ""Johnny"" Doe",12345`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(true)
      expect(result.data?.[0]).toEqual({
        name: 'John "Johnny" Doe',
        participantId: '12345'
      })
    })

    it('should skip empty lines', () => {
      const csvContent = `John Doe,12345

Jane Smith,67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2) // Empty line not counted
    })

    it('should detect duplicate participant IDs', () => {
      const csvContent = `John Doe,12345
Jane Smith,12345`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Row 2: Duplicate participant ID "12345"')
    })

    it('should validate required fields', () => {
      const csvContent = `John Doe,
,67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Row 1: Participant ID is required')
      expect(result.errors).toContain('Row 2: Name is required')
    })

    it('should handle insufficient columns', () => {
      const csvContent = `John Doe
Jane Smith,67890`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Row 1: Expected at least 2 columns (name, id), found 1')
    })

    it('should handle empty CSV', () => {
      const result = parseCSV('')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('CSV file is empty')
    })

    it('should handle CSV with only header', () => {
      const csvContent = `Name,Participant ID`

      const result = parseCSV(csvContent)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('No data rows found in CSV')
    })
  })

  describe('validateCSVData', () => {
    it('should validate correct attendee data', () => {
      const data: CSVAttendee[] = [
        { name: 'John Doe', participantId: '12345' },
        { name: 'Jane Smith', participantId: '67890' }
      ]

      const result = validateCSVData(data)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })

    it('should reject empty array', () => {
      const result = validateCSVData([])

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should reject invalid data structure', () => {
      const data = [
        { name: '', participantId: '12345' }, // Empty name
        { name: 'Jane Smith', participantId: '' } // Empty ID
      ]

      const result = validateCSVData(data)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('attendeesToCSV', () => {
    it('should convert attendees to CSV format', () => {
      const attendees: CSVAttendee[] = [
        { name: 'John Doe', participantId: '12345' },
        { name: 'Jane Smith', participantId: '67890' }
      ]

      const csv = attendeesToCSV(attendees)

      expect(csv).toBe(`Name,Participant ID
"John Doe","12345"
"Jane Smith","67890"`)
    })

    it('should escape quotes in data', () => {
      const attendees: CSVAttendee[] = [
        { name: 'John "Johnny" Doe', participantId: '12345' }
      ]

      const csv = attendeesToCSV(attendees)

      expect(csv).toBe(`Name,Participant ID
"John ""Johnny"" Doe","12345"`)
    })

    it('should handle empty array', () => {
      const csv = attendeesToCSV([])

      expect(csv).toBe('Name,Participant ID')
    })
  })

  describe('validateCSVFile', () => {
    it('should accept valid CSV file', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })

      const result = validateCSVFile(file)

      expect(result.success).toBe(true)
      expect(result.data).toBe(file)
    })

    it('should accept text file with CSV extension', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/plain' })

      const result = validateCSVFile(file)

      expect(result.success).toBe(true)
    })

    it('should reject files that are too large', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' })

      const result = validateCSVFile(file)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('File size must be less than 5MB')
    })

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      const result = validateCSVFile(file)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('File must be a CSV file (.csv or .txt)')
    })
  })

  describe('readFileAsText', () => {
    it('should read file content as text', async () => {
      const content = 'test content'
      const file = new File([content], 'test.csv', { type: 'text/csv' })

      const result = await readFileAsText(file)

      expect(result).toBe(content)
    })

    it('should handle file read errors', async () => {
      // Create a mock file that will cause FileReader to fail
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsText: vi.fn().mockImplementation(function() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'))
            }
          }, 0)
        })
      })) as any

      await expect(readFileAsText(file)).rejects.toThrow('Error reading file')

      // Restore original FileReader
      global.FileReader = originalFileReader
    })
  })
})

// Integration test for complete CSV processing workflow
describe('CSV Processing Integration', () => {
  it('should process a complete CSV workflow', async () => {
    const csvContent = `Name,Participant ID
John Doe,12345
Jane Smith,67890
Bob Johnson,11111`

    // Parse CSV
    const parseResult = parseCSV(csvContent)
    expect(parseResult.success).toBe(true)
    expect(parseResult.data).toHaveLength(3)

    // Validate parsed data
    const validationResult = validateCSVData(parseResult.data!)
    expect(validationResult.success).toBe(true)

    // Convert back to CSV
    const csvOutput = attendeesToCSV(parseResult.data!)
    expect(csvOutput).toContain('John Doe')
    expect(csvOutput).toContain('Jane Smith')
    expect(csvOutput).toContain('Bob Johnson')

    // Parse the generated CSV to verify round-trip
    const roundTripResult = parseCSV(csvOutput)
    expect(roundTripResult.success).toBe(true)
    expect(roundTripResult.data).toEqual(parseResult.data)
  })
})