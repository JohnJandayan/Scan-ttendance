import { BaseRepository } from './base'
import { Event, EventCreate, DatabaseResult, PaginatedResult, EventCreateSchema, EventSchema } from '../../types'
import { validateData } from '../validation'
import { DatabaseService } from '../database'

export class EventRepository extends BaseRepository {
  /**
   * Creates a new event with attendance and verification tables
   */
  async create(schemaName: string, eventData: EventCreate): Promise<DatabaseResult<Event>> {
    try {
      // Validate input data
      const validation = validateData(EventCreateSchema, eventData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const { name, creatorId } = validation.data!

      // Generate table names
      const attendanceTableName = `${DatabaseService.sanitizeTableName(name)}_attendance`
      const verificationTableName = `${DatabaseService.sanitizeTableName(name)}_verification`

      // Check if event with same name already exists
      const existingEvent = await this.findByName(schemaName, name)
      if (existingEvent.success && existingEvent.data) {
        return {
          success: false,
          error: 'Event with this name already exists'
        }
      }

      // Create event record
      const eventRecord = {
        id: this.generateUUID(),
        name,
        creator_id: creatorId,
        created_at: new Date(),
        ended_at: null,
        is_active: true,
        attendance_table_name: attendanceTableName,
        verification_table_name: verificationTableName
      }

      const { query, params } = this.buildInsertQuery('events', eventRecord, schemaName)
      const result = await this.executeQuery<Event>(query, params)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      // Create event tables
      const tablesResult = await DatabaseService.createEventTables(schemaName, name)
      if (!tablesResult.success) {
        // Rollback event creation if table creation fails
        await this.delete(schemaName, eventRecord.id)
        return {
          success: false,
          error: `Failed to create event tables: ${tablesResult.error}`
        }
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at),
          endedAt: (result.data! as any).ended_at ? new Date((result.data! as any).ended_at) : undefined
        } as Event
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event'
      }
    }
  }

  /**
   * Finds event by ID
   */
  async findById(schemaName: string, id: string): Promise<DatabaseResult<Event | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.events WHERE id = $1`
      const result = await this.executeQuery<Event[]>(query, { param1: id })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const event = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: event ? {
          ...event,
          createdAt: new Date((event as any).created_at),
          endedAt: (event as any).ended_at ? new Date((event as any).ended_at) : undefined
        } as Event : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find event'
      }
    }
  }

  /**
   * Finds event by name
   */
  async findByName(schemaName: string, name: string): Promise<DatabaseResult<Event | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.events WHERE name = $1`
      const result = await this.executeQuery<Event[]>(query, { param1: name })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const event = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: event ? {
          ...event,
          createdAt: new Date((event as any).created_at),
          endedAt: (event as any).ended_at ? new Date((event as any).ended_at) : undefined
        } as Event : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find event'
      }
    }
  }

  /**
   * Updates event data
   */
  async update(schemaName: string, id: string, updateData: Partial<EventCreate>): Promise<DatabaseResult<Event>> {
    try {
      // Validate update data
      const validation = validateData(EventSchema.partial(), updateData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const data = validation.data!

      const { query, params } = this.buildUpdateQuery('events', data, { id }, schemaName)
      const result = await this.executeQuery<Event>(query, params)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at),
          endedAt: (result.data! as any).ended_at ? new Date((result.data! as any).ended_at) : undefined
        } as Event
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event'
      }
    }
  }

  /**
   * Ends an event (marks as inactive and sets end date)
   */
  async endEvent(schemaName: string, id: string): Promise<DatabaseResult<Event>> {
    try {
      const query = `UPDATE ${this.sanitizeIdentifier(schemaName)}.events SET is_active = false, ended_at = NOW() WHERE id = $1 RETURNING *`
      const result = await this.executeQuery<Event>(query, { param1: id })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at),
          endedAt: (result.data! as any).ended_at ? new Date((result.data! as any).ended_at) : undefined
        } as Event
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end event'
      }
    }
  }

  /**
   * Reactivates an event
   */
  async reactivateEvent(schemaName: string, id: string): Promise<DatabaseResult<Event>> {
    try {
      const query = `UPDATE ${this.sanitizeIdentifier(schemaName)}.events SET is_active = true, ended_at = NULL WHERE id = $1 RETURNING *`
      const result = await this.executeQuery<Event>(query, { param1: id })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: {
          ...result.data!,
          createdAt: new Date((result.data! as any).created_at),
          endedAt: (result.data! as any).ended_at ? new Date((result.data! as any).ended_at) : undefined
        } as Event
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reactivate event'
      }
    }
  }

  /**
   * Deletes event and its tables
   */
  async delete(schemaName: string, id: string): Promise<DatabaseResult<boolean>> {
    try {
      // Get event to find table names
      const event = await this.findById(schemaName, id)
      if (!event.success || !event.data) {
        return {
          success: false,
          error: 'Event not found'
        }
      }

      // Drop event tables first
      const tablesResult = await DatabaseService.dropEventTables(schemaName, event.data.name)
      if (!tablesResult.success) {
        console.warn(`Failed to drop event tables: ${tablesResult.error}`)
      }

      // Delete event record
      const query = `DELETE FROM ${this.sanitizeIdentifier(schemaName)}.events WHERE id = $1`
      const result = await this.executeQuery(query, { param1: id })

      return {
        success: result.success,
        data: result.success
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }
    }
  }

  /**
   * Lists events with pagination
   */
  async list(schemaName: string, page: number = 1, limit: number = 50): Promise<DatabaseResult<PaginatedResult<Event>>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.events ORDER BY created_at DESC`
      const countQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.events`

      const result = await this.executePaginatedQuery<Event>(query, countQuery, page, limit)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      // Transform dates
      const transformedData = {
        ...result.data!,
        data: result.data!.data.map(event => ({
          ...event,
          createdAt: new Date((event as any).created_at),
          endedAt: (event as any).ended_at ? new Date((event as any).ended_at) : undefined
        })) as Event[]
      }

      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list events'
      }
    }
  }

  /**
   * Lists active events
   */
  async listActive(schemaName: string): Promise<DatabaseResult<Event[]>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.events WHERE is_active = true ORDER BY created_at DESC`
      const result = await this.executeQuery<Event[]>(query)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const events = result.data?.map(event => ({
        ...event,
        createdAt: new Date((event as any).created_at),
        endedAt: (event as any).ended_at ? new Date((event as any).ended_at) : undefined
      })) as Event[] || []

      return {
        success: true,
        data: events
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list active events'
      }
    }
  }

  /**
   * Lists archived events
   */
  async listArchived(schemaName: string): Promise<DatabaseResult<Event[]>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.events WHERE is_active = false ORDER BY ended_at DESC`
      const result = await this.executeQuery<Event[]>(query)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const events = result.data?.map(event => ({
        ...event,
        createdAt: new Date((event as any).created_at),
        endedAt: (event as any).ended_at ? new Date((event as any).ended_at) : undefined
      })) as Event[] || []

      return {
        success: true,
        data: events
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list archived events'
      }
    }
  }

  /**
   * Finds events by organization (using schema name)
   */
  async findByOrganization(organizationId: string): Promise<DatabaseResult<Event[]>> {
    try {
      // For now, we'll use a placeholder implementation
      // In a real implementation, we'd need to map organizationId to schema name
      // This will be properly implemented when we have the organization-schema mapping
      
      // Return empty array for now - this will be implemented in later tasks
      return {
        success: true,
        data: []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find events by organization'
      }
    }
  }

  /**
   * Gets event statistics
   */
  async getEventStats(schemaName: string, eventId: string): Promise<DatabaseResult<{
    totalAttendees: number
    verifiedAttendees: number
    verificationRate: number
  }>> {
    try {
      const event = await this.findById(schemaName, eventId)
      if (!event.success || !event.data) {
        return {
          success: false,
          error: 'Event not found'
        }
      }

      const attendanceTable = event.data.attendanceTableName
      const verificationTable = event.data.verificationTableName

      // Get total attendees
      const totalQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(attendanceTable)}`
      const totalResult = await this.executeQuery<{ count: number }[]>(totalQuery)

      // Get verified attendees
      const verifiedQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(verificationTable)} WHERE status = 'verified'`
      const verifiedResult = await this.executeQuery<{ count: number }[]>(verifiedQuery)

      if (!totalResult.success || !verifiedResult.success) {
        return {
          success: false,
          error: 'Failed to get event statistics'
        }
      }

      const totalAttendees = totalResult.data?.[0]?.count || 0
      const verifiedAttendees = verifiedResult.data?.[0]?.count || 0
      const verificationRate = totalAttendees > 0 ? (verifiedAttendees / totalAttendees) * 100 : 0

      return {
        success: true,
        data: {
          totalAttendees,
          verifiedAttendees,
          verificationRate: Math.round(verificationRate * 100) / 100
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get event statistics'
      }
    }
  }
}