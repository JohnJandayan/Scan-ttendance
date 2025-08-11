import { createClient } from '@supabase/supabase-js'
import { DatabaseResult, PaginatedResult } from '../../types'

export abstract class BaseRepository {
  protected supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey)
  }

  /**
   * Executes a SQL query with error handling
   */
  protected async executeQuery<T>(
    query: string,
    params?: Record<string, unknown>
  ): Promise<DatabaseResult<T>> {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        sql: query,
        params: params || {}
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  /**
   * Executes a parameterized query with pagination
   */
  protected async executePaginatedQuery<T>(
    query: string,
    countQuery: string,
    page: number = 1,
    limit: number = 50,
    params?: Record<string, unknown>
  ): Promise<DatabaseResult<PaginatedResult<T>>> {
    try {
      const offset = (page - 1) * limit
      const paginatedQuery = `${query} LIMIT ${limit} OFFSET ${offset}`

      // Execute both queries
      const [dataResult, countResult] = await Promise.all([
        this.executeQuery<T[]>(paginatedQuery, params),
        this.executeQuery<{ count: number }>(countQuery, params)
      ])

      if (!dataResult.success) {
        return {
          success: false,
          error: dataResult.error
        }
      }

      if (!countResult.success) {
        return {
          success: false,
          error: countResult.error
        }
      }

      const data = dataResult.data || []
      const total = Array.isArray(countResult.data) && countResult.data.length > 0 
        ? countResult.data[0].count 
        : 0

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          hasMore: offset + data.length < total
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }

  /**
   * Sanitizes table/schema names to prevent SQL injection
   */
  protected sanitizeIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_]/g, '_')
  }

  /**
   * Formats a date for SQL insertion
   */
  protected formatDate(date: Date): string {
    return date.toISOString()
  }

  /**
   * Generates a UUID (fallback if database doesn't support gen_random_uuid)
   */
  protected generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Builds WHERE clause from conditions
   */
  protected buildWhereClause(conditions: Record<string, unknown>): { clause: string; params: Record<string, unknown> } {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}
    let paramIndex = 1

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        const paramName = `param${paramIndex}`
        clauses.push(`${this.sanitizeIdentifier(key)} = $${paramIndex}`)
        params[paramName] = value
        paramIndex++
      }
    }

    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params
    }
  }

  /**
   * Builds INSERT query with values
   */
  protected buildInsertQuery(
    tableName: string,
    data: Record<string, unknown>,
    schemaName?: string
  ): { query: string; params: Record<string, unknown> } {
    const fullTableName = schemaName 
      ? `${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(tableName)}`
      : this.sanitizeIdentifier(tableName)

    const columns = Object.keys(data).map(key => this.sanitizeIdentifier(key))
    const placeholders = columns.map((_, index) => `$${index + 1}`)
    const params: Record<string, unknown> = {}

    columns.forEach((_, index) => {
      params[`param${index + 1}`] = data[Object.keys(data)[index]]
    })

    const query = `
      INSERT INTO ${fullTableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    return { query, params }
  }

  /**
   * Builds UPDATE query with conditions
   */
  protected buildUpdateQuery(
    tableName: string,
    data: Record<string, unknown>,
    conditions: Record<string, unknown>,
    schemaName?: string
  ): { query: string; params: Record<string, unknown> } {
    const fullTableName = schemaName 
      ? `${this.sanitizeIdentifier(schemaName)}.${this.sanitizeIdentifier(tableName)}`
      : this.sanitizeIdentifier(tableName)

    const setClauses: string[] = []
    const params: Record<string, unknown> = {}
    let paramIndex = 1

    // Build SET clause
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        setClauses.push(`${this.sanitizeIdentifier(key)} = $${paramIndex}`)
        params[`param${paramIndex}`] = value
        paramIndex++
      }
    }

    // Build WHERE clause
    const whereClauses: string[] = []
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        whereClauses.push(`${this.sanitizeIdentifier(key)} = $${paramIndex}`)
        params[`param${paramIndex}`] = value
        paramIndex++
      }
    }

    const query = `
      UPDATE ${fullTableName}
      SET ${setClauses.join(', ')}
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      RETURNING *
    `

    return { query, params }
  }
}