import { z } from 'zod'
import { ValidationResult } from '../types'

/**
 * Generic validation function that validates data against a Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues?.map(err => `${err.path.join('.')}: ${err.message}`) || ['Validation failed']
      }
    }
    return {
      success: false,
      errors: ['Validation failed with unknown error']
    }
  }
}

/**
 * Safe validation function that returns partial results for valid fields
 */
export function validateDataSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<Partial<T>> {
  try {
    const result = schema.parse(data)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Try to extract valid fields
      const validData: Partial<T> = {}
      const errors: string[] = []
      
      for (const err of error.issues) {
        errors.push(`${err.path.join('.')}: ${err.message}`)
      }
      
      return {
        success: false,
        data: validData,
        errors
      }
    }
    return {
      success: false,
      errors: ['Validation failed with unknown error']
    }
  }
}

/**
 * Validates an array of data against a schema
 */
export function validateArray<T>(
  schema: z.ZodSchema<T>,
  dataArray: unknown[]
): ValidationResult<T[]> {
  const results: T[] = []
  const errors: string[] = []
  
  for (let i = 0; i < dataArray.length; i++) {
    const validation = validateData(schema, dataArray[i])
    if (validation.success && validation.data) {
      results.push(validation.data)
    } else {
      errors.push(`Item ${i + 1}: ${validation.errors?.join(', ') || 'Unknown error'}`)
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      data: results,
      errors
    }
  }
  
  return {
    success: true,
    data: results
  }
}

/**
 * Validates CSV data for attendee import
 */
export function validateCSVData(csvData: unknown[]): ValidationResult<Array<{ name: string; participantId: string }>> {
  const results: Array<{ name: string; participantId: string }> = []
  const errors: string[] = []
  
  if (!Array.isArray(csvData) || csvData.length === 0) {
    return {
      success: false,
      errors: ['CSV data must be a non-empty array']
    }
  }
  
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    
    if (!row || typeof row !== 'object') {
      errors.push(`Row ${i + 1}: Invalid row format`)
      continue
    }
    
    const rowData = row as Record<string, unknown>
    
    // Check for required fields (flexible field names)
    const name = rowData.name || rowData.Name || rowData.NAME || 
                 rowData.participant_name || rowData['Participant Name']
    const participantId = rowData.participantId || rowData.participant_id || 
                         rowData.id || rowData.ID || rowData.Id ||
                         rowData['Participant ID'] || rowData['participant id']
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push(`Row ${i + 1}: Name is required and must be a non-empty string`)
      continue
    }
    
    if (!participantId || typeof participantId !== 'string' || participantId.trim().length === 0) {
      errors.push(`Row ${i + 1}: Participant ID is required and must be a non-empty string`)
      continue
    }
    
    // Check for duplicates
    const existingId = results.find(r => r.participantId === participantId.trim())
    if (existingId) {
      errors.push(`Row ${i + 1}: Duplicate participant ID "${participantId.trim()}"`)
      continue
    }
    
    results.push({
      name: name.trim(),
      participantId: participantId.trim()
    })
  }
  
  if (errors.length > 0 && results.length === 0) {
    return {
      success: false,
      errors
    }
  }
  
  return {
    success: results.length > 0,
    data: results,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Sanitizes input data by removing potentially harmful content
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/["']/g, '') // Remove quotes that could cause SQL issues
    .substring(0, 1000) // Limit length
}

/**
 * Validates email format with additional checks
 */
export function validateEmail(email: string): ValidationResult<string> {
  const emailSchema = z.string().email().max(255)
  const validation = validateData(emailSchema, email)
  
  if (!validation.success) {
    return validation
  }
  
  // Additional checks
  const sanitizedEmail = sanitizeInput(email.toLowerCase())
  
  // Check for common invalid patterns
  if (sanitizedEmail.includes('..') || 
      sanitizedEmail.startsWith('.') || 
      sanitizedEmail.endsWith('.')) {
    return {
      success: false,
      errors: ['Invalid email format']
    }
  }
  
  return {
    success: true,
    data: sanitizedEmail
  }
}

/**
 * Validates participant ID format
 */
export function validateParticipantId(participantId: string): ValidationResult<string> {
  if (typeof participantId !== 'string') {
    return {
      success: false,
      errors: ['Participant ID must be a string']
    }
  }
  
  const sanitized = sanitizeInput(participantId)
  
  if (sanitized.length === 0) {
    return {
      success: false,
      errors: ['Participant ID cannot be empty']
    }
  }
  
  if (sanitized.length > 255) {
    return {
      success: false,
      errors: ['Participant ID too long (max 255 characters)']
    }
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return {
      success: false,
      errors: ['Participant ID can only contain letters, numbers, hyphens, and underscores']
    }
  }
  
  return {
    success: true,
    data: sanitized
  }
}