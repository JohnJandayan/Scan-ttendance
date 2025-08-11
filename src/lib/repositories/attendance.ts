import { BaseRepository } from './base'
import { AttendanceRecord, AttendanceRecordCreate, VerificationRecord, VerificationRecordCreate, DatabaseResult, PaginatedResult, CSVAttendee, AttendanceRecordCreateSchema, VerificationRecordCreateSchema } from '../../types'
import { validateData, validateCSVData } from '../validation'
import { EventRepository } from './event'

export class AttendanceRepository extends BaseRepository {
  private orgId: string
  private eventName: string

  constructor(orgId: string, eventName: string) {
    super()
    this.orgId = orgId
    this.eventName = eventName
  }

  private get schemaName(): string {
    return `org_${this.orgId.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  private get attendanceTableName(): string {
    return `${this.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_attendance`
  }

  private get verificationTableName(): string {
    return `${this.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_verification`
  }

  /**
   * Finds attendee by participant ID for the current event
   */
  async findAttendeeById(participantId: string): Promise<AttendanceRecord | null> {
    try {
      const result = await this.findByParticipantId(this.schemaName, this.attendanceTableName, participantId)
      return result.success ? (result.data || null) : null
    } catch (error) {
      console.error('Error finding attendee:', error)
      return null
    }
  }

  /**
   * Finds verification record by participant ID for the current event
   */
  async findVerificationById(participantId: string): Promise<VerificationRecord | null> {
    try {
      const result = await this.findVerificationByParticipantId(this.schemaName, this.verificationTableName, participantId)
      return result.success ? (result.data || null) : null
    } catch (error) {
      console.error('Error finding verification:', error)
      return null
    }
  }

  /**
   * Creates a verification record for the current event
   */
  async createVerification(verificationData: VerificationRecordCreate): Promise<VerificationRecord> {
    try {
      // Validate input data
      const validation = validateData(VerificationRecordCreateSchema, verificationData)
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`)
      }

      const { name, participantId, status } = validation.data!

      // Create verification record
      const verificationRecord = {
        id: this.generateUUID(),
        name,
        participant_id: participantId,
        status,
        verified_at: new Date()
      }

      const { query, params } = this.buildInsertQuery(this.verificationTableName, verificationRecord, this.schemaName)
      const result = await this.executeQuery<VerificationRecord>(query, params)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create verification record')
      }

      return {
        ...result.data!,
        verifiedAt: new Date((result.data! as any).verified_at)
      } as VerificationRecord
    } catch (error) {
      console.error('Error creating verification:', error)
      throw error instanceof Error ? error : new Error('Failed to create verification record')
    }
  }
  /**
   * Adds a single attendee to the attendance table
   */
  async addAttendee(
    schemaName: string,
    attendanceTableName: string,
    attendeeData: AttendanceRecordCreate
  ): Promise<DatabaseResult<AttendanceRecord>> {
    try {
      // Validate input data
      const validation = validateData(AttendanceRecordCreateSchema, attendeeData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const { name, participantId } = validation.data!

      // Check if participant ID already exists
      const existing = await this.findByParticipantId(schemaName, attendanceTableName, participantId)
      if (existing.success && existing.data) {
        return {
          success: false,
          error: 'Participant ID already exists'
        }
      }

      // Create attendance record
      const attendanceRecord = {
        id: this.generateUUID(),
        name,
        participant_id: participantId,
        created_at: new Date()
      }

      const { query, params } = this.buildInsertQuery(attendanceTableName, attendanceRecord, schemaName)
      const result = await this.executeQuery<AttendanceRecord>(query, params)

      if (!result.success) {
        return result
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at)
        } as AttendanceRecord
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add attendee'
      }
    }
  }

  /**
   * Bulk import attendees from CSV data
   */
  async bulkImportAttendees(
    schemaName: string,
    attendanceTableName: string,
    csvData: unknown[]
  ): Promise<DatabaseResult<{
    imported: AttendanceRecord[]
    errors: string[]
    duplicates: string[]
  }>> {
    try {
      // Validate CSV data
      const validation = validateCSVData(csvData)
      if (!validation.success) {
        return {
          success: false,
          error: `CSV validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const attendees = validation.data!
      const imported: AttendanceRecord[] = []
      const errors: string[] = []
      const duplicates: string[] = []

      // Process each attendee
      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i]
        
        try {
          const result = await this.addAttendee(schemaName, attendanceTableName, attendee)
          
          if (result.success && result.data) {
            imported.push(result.data)
          } else {
            if (result.error?.includes('already exists')) {
              duplicates.push(`${attendee.name} (${attendee.participantId})`)
            } else {
              errors.push(`Row ${i + 1}: ${result.error}`)
            }
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        success: true,
        data: {
          imported,
          errors,
          duplicates
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk import attendees'
      }
    }
  }

  /**
   * Finds attendee by participant ID
   */
  async findByParticipantId(
    schemaName: string,
    attendanceTableName: string,
    participantId: string
  ): Promise<DatabaseResult<AttendanceRecord | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTableName)} WHERE participant_id = $1`
      const result = await this.executeQuery<AttendanceRecord[]>(query, { param1: participantId })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const attendee = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: attendee ? {
          ...attendee,
          createdAt: new Date((attendee as any).created_at)
        } as AttendanceRecord : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find attendee'
      }
    }
  }

  /**
   * Lists all attendees with pagination
   */
  async listAttendees(
    schemaName: string,
    attendanceTableName: string,
    page: number = 1,
    limit: number = 50
  ): Promise<DatabaseResult<PaginatedResult<AttendanceRecord>>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTableName)} ORDER BY created_at DESC`
      const countQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTableName)}`

      const result = await this.executePaginatedQuery<AttendanceRecord>(query, countQuery, page, limit)

      if (!result.success) {
        return result
      }

      // Transform dates
      const transformedData = {
        ...result.data!,
        data: result.data!.data.map(attendee => ({
          ...attendee,
          createdAt: new Date((attendee as any).created_at)
        })) as AttendanceRecord[]
      }

      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list attendees'
      }
    }
  }

  /**
   * Verifies attendance (creates verification record)
   */
  async verifyAttendance(
    schemaName: string,
    attendanceTableName: string,
    verificationTableName: string,
    participantId: string
  ): Promise<DatabaseResult<{
    verification: VerificationRecord
    attendee: AttendanceRecord
    status: 'verified' | 'duplicate' | 'invalid'
  }>> {
    try {
      // Find attendee
      const attendee = await this.findByParticipantId(schemaName, attendanceTableName, participantId)
      if (!attendee.success || !attendee.data) {
        return {
          success: false,
          error: 'Participant not found in attendance list'
        }
      }

      // Check if already verified
      const existingVerification = await this.findVerificationByParticipantId(
        schemaName,
        verificationTableName,
        participantId
      )

      let status: 'verified' | 'duplicate' | 'invalid' = 'verified'
      if (existingVerification.success && existingVerification.data) {
        status = 'duplicate'
      }

      // Create verification record
      const verificationRecord = {
        id: this.generateUUID(),
        name: attendee.data.name,
        participant_id: participantId,
        status,
        verified_at: new Date()
      }

      const { query, params } = this.buildInsertQuery(verificationTableName, verificationRecord, schemaName)
      const result = await this.executeQuery<VerificationRecord>(query, params)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: {
          verification: {
            ...result.data!,
            verifiedAt: new Date((result.data! as any).verified_at)
          } as VerificationRecord,
          attendee: attendee.data,
          status
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify attendance'
      }
    }
  }

  /**
   * Finds verification record by participant ID
   */
  async findVerificationByParticipantId(
    schemaName: string,
    verificationTableName: string,
    participantId: string
  ): Promise<DatabaseResult<VerificationRecord | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTableName)} WHERE participant_id = $1 ORDER BY verified_at DESC LIMIT 1`
      const result = await this.executeQuery<VerificationRecord[]>(query, { param1: participantId })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const verification = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: verification ? {
          ...verification,
          verifiedAt: new Date((verification as any).verified_at)
        } as VerificationRecord : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find verification'
      }
    }
  }

  /**
   * Lists verification records with pagination
   */
  async listVerifications(
    schemaName: string,
    verificationTableName: string,
    page: number = 1,
    limit: number = 50
  ): Promise<DatabaseResult<PaginatedResult<VerificationRecord>>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTableName)} ORDER BY verified_at DESC`
      const countQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTableName)}`

      const result = await this.executePaginatedQuery<VerificationRecord>(query, countQuery, page, limit)

      if (!result.success) {
        return result
      }

      // Transform dates
      const transformedData = {
        ...result.data!,
        data: result.data!.data.map(verification => ({
          ...verification,
          verifiedAt: new Date((verification as any).verified_at)
        })) as VerificationRecord[]
      }

      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list verifications'
      }
    }
  }

  /**
   * Gets attendance statistics
   */
  async getAttendanceStats(
    schemaName: string,
    attendanceTableName: string,
    verificationTableName: string
  ): Promise<DatabaseResult<{
    totalAttendees: number
    verifiedCount: number
    duplicateCount: number
    verificationRate: number
    recentVerifications: VerificationRecord[]
  }>> {
    try {
      // Get total attendees
      const totalQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTableName)}`
      const totalResult = await this.executeQuery<{ count: number }[]>(totalQuery)

      // Get verification counts by status
      const verificationStatsQuery = `
        SELECT status, COUNT(*) as count 
        FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTableName)} 
        GROUP BY status
      `
      const verificationStatsResult = await this.executeQuery<{ status: string; count: number }[]>(verificationStatsQuery)

      // Get recent verifications
      const recentQuery = `
        SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTableName)} 
        ORDER BY verified_at DESC 
        LIMIT 10
      `
      const recentResult = await this.executeQuery<VerificationRecord[]>(recentQuery)

      if (!totalResult.success || !verificationStatsResult.success || !recentResult.success) {
        return {
          success: false,
          error: 'Failed to get attendance statistics'
        }
      }

      const totalAttendees = totalResult.data?.[0]?.count || 0
      
      let verifiedCount = 0
      let duplicateCount = 0
      
      verificationStatsResult.data?.forEach(stat => {
        if (stat.status === 'verified') {
          verifiedCount = stat.count
        } else if (stat.status === 'duplicate') {
          duplicateCount = stat.count
        }
      })

      const verificationRate = totalAttendees > 0 ? (verifiedCount / totalAttendees) * 100 : 0

      const recentVerifications = recentResult.data?.map(verification => ({
        ...verification,
        verifiedAt: new Date((verification as any).verified_at)
      })) as VerificationRecord[] || []

      return {
        success: true,
        data: {
          totalAttendees,
          verifiedCount,
          duplicateCount,
          verificationRate: Math.round(verificationRate * 100) / 100,
          recentVerifications
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get attendance statistics'
      }
    }
  }

  /**
   * Deletes attendee from attendance table
   */
  async deleteAttendee(
    schemaName: string,
    attendanceTableName: string,
    participantId: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      const query = `DELETE FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTableName)} WHERE participant_id = $1`
      const result = await this.executeQuery(query, { param1: participantId })

      return {
        success: result.success,
        data: result.success
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete attendee'
      }
    }
  }

  /**
   * Updates attendee information
   */
  async updateAttendee(
    schemaName: string,
    attendanceTableName: string,
    participantId: string,
    updateData: Partial<AttendanceRecordCreate>
  ): Promise<DatabaseResult<AttendanceRecord>> {
    try {
      // Validate update data
      const validation = validateData(AttendanceRecordCreateSchema.partial(), updateData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const data = validation.data!

      const { query, params } = this.buildUpdateQuery(
        attendanceTableName,
        data,
        { participant_id: participantId },
        schemaName
      )
      const result = await this.executeQuery<AttendanceRecord>(query, params)

      if (!result.success) {
        return result
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at)
        } as AttendanceRecord
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update attendee'
      }
    }
  }

  /**
   * Creates an attendee record for a specific event
   */
  async create(
    schemaName: string,
    eventId: string,
    attendeeData: CSVAttendee
  ): Promise<DatabaseResult<AttendanceRecord>> {
    try {
      // Get event to find table names
      const eventRepo = new EventRepository()
      const event = await eventRepo.findById(schemaName, eventId)
      
      if (!event.success || !event.data) {
        return {
          success: false,
          error: 'Event not found'
        }
      }

      // Add attendee to the event's attendance table
      return await this.addAttendee(schemaName, event.data.attendanceTableName, attendeeData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create attendee'
      }
    }
  }

  /**
   * Lists attendees for a specific event
   */
  async listByEvent(
    schemaName: string,
    eventId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<DatabaseResult<PaginatedResult<AttendanceRecord>>> {
    try {
      // Get event to find table names
      const eventRepo = new EventRepository()
      const event = await eventRepo.findById(schemaName, eventId)
      
      if (!event.success || !event.data) {
        return {
          success: false,
          error: 'Event not found'
        }
      }

      // List attendees from the event's attendance table
      return await this.listAttendees(schemaName, event.data.attendanceTableName, page, limit)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list attendees'
      }
    }
  }

  /**
   * Bulk imports attendees for a specific event
   */
  async bulkImportForEvent(
    schemaName: string,
    eventId: string,
    csvData: unknown[]
  ): Promise<DatabaseResult<{
    imported: AttendanceRecord[]
    errors: string[]
    duplicates: string[]
  }>> {
    try {
      // Get event to find table names
      const eventRepo = new EventRepository()
      const event = await eventRepo.findById(schemaName, eventId)
      
      if (!event.success || !event.data) {
        return {
          success: false,
          error: 'Event not found'
        }
      }

      // Bulk import to the event's attendance table
      return await this.bulkImportAttendees(schemaName, event.data.attendanceTableName, csvData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk import attendees'
      }
    }
  }
}