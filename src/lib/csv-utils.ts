import { CSVAttendee, CSVImport, CSVImportSchema, ValidationResult } from '@/types'

export interface CSVParseResult {
  success: boolean
  data?: CSVAttendee[]
  errors?: string[]
  totalRows?: number
  validRows?: number
}

/**
 * Parses CSV content and validates attendee data
 */
export function parseCSV(csvContent: string): CSVParseResult {
  try {
    if (!csvContent || csvContent.trim() === '') {
      return {
        success: false,
        errors: ['CSV file is empty']
      }
    }

    const lines = csvContent.trim().split('\n')
    
    if (lines.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty']
      }
    }

    // Check if first line is header
    const firstLine = lines[0].toLowerCase()
    const hasHeader = firstLine.includes('name') || firstLine.includes('id') || firstLine.includes('participant')
    
    const dataLines = hasHeader ? lines.slice(1) : lines
    
    // Filter out empty lines for counting
    const nonEmptyDataLines = dataLines.filter(line => line.trim() !== '')
    
    if (nonEmptyDataLines.length === 0) {
      return {
        success: false,
        errors: ['No data rows found in CSV']
      }
    }

    const attendees: CSVAttendee[] = []
    const errors: string[] = []
    let validRows = 0
    let processedRows = 0

    dataLines.forEach((line, index) => {
      const rowNumber = hasHeader ? index + 2 : index + 1
      
      if (line.trim() === '') {
        return // Skip empty lines
      }

      processedRows++

      const columns = parseCSVLine(line)
      
      if (columns.length < 2) {
        errors.push(`Row ${rowNumber}: Expected at least 2 columns (name, id), found ${columns.length}`)
        return
      }

      const [name, participantId] = columns
      
      if (!name?.trim()) {
        errors.push(`Row ${rowNumber}: Name is required`)
        return
      }

      if (!participantId?.trim()) {
        errors.push(`Row ${rowNumber}: Participant ID is required`)
        return
      }

      // Check for duplicate IDs within the CSV
      const existingAttendee = attendees.find(a => a.participantId === participantId.trim())
      if (existingAttendee) {
        errors.push(`Row ${rowNumber}: Duplicate participant ID "${participantId.trim()}"`)
        return
      }

      attendees.push({
        name: name.trim(),
        participantId: participantId.trim()
      })
      
      validRows++
    })

    // Validate the entire dataset
    const validation = validateCSVData(attendees)
    if (!validation.success && validation.errors) {
      errors.push(...validation.errors)
    }

    return {
      success: errors.length === 0,
      data: attendees,
      errors: errors.length > 0 ? errors : undefined,
      totalRows: processedRows,
      validRows
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV']
    }
  }
}

/**
 * Parses a single CSV line handling quoted values and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current)
  
  return result
}

/**
 * Validates CSV attendee data using Zod schema
 */
export function validateCSVData(data: CSVAttendee[]): ValidationResult<CSVImport> {
  try {
    const validatedData = CSVImportSchema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        errors: [error.message]
      }
    }
    return {
      success: false,
      errors: ['Validation failed']
    }
  }
}

/**
 * Converts attendee data to CSV format
 */
export function attendeesToCSV(attendees: CSVAttendee[]): string {
  const header = 'Name,Participant ID'
  const rows = attendees.map(attendee => 
    `"${attendee.name.replace(/"/g, '""')}","${attendee.participantId.replace(/"/g, '""')}"`
  )
  
  return [header, ...rows].join('\n')
}

/**
 * Downloads CSV data as a file
 */
export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Validates file type and size
 */
export function validateCSVFile(file: File): ValidationResult<File> {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
  const allowedExtensions = ['.csv', '.txt']
  
  if (file.size > maxSize) {
    return {
      success: false,
      errors: ['File size must be less than 5MB']
    }
  }
  
  const hasValidType = allowedTypes.includes(file.type)
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  )
  
  if (!hasValidType && !hasValidExtension) {
    return {
      success: false,
      errors: ['File must be a CSV file (.csv or .txt)']
    }
  }
  
  return {
    success: true,
    data: file
  }
}