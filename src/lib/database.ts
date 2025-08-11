import { createClient } from '@supabase/supabase-js'

interface SchemaCreationResult {
  success: boolean
  schemaName: string
  error?: string
}

interface TableCreationResult {
  success: boolean
  attendanceTable: string
  verificationTable: string
  error?: string
}

interface MigrationResult {
  success: boolean
  operation: string
  error?: string
}

export class DatabaseService {
  private static getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }

    return createClient(supabaseUrl, serviceRoleKey)
  }

  /**
   * Creates an organization-specific schema in the database
   */
  static async createOrganizationSchema(orgName: string): Promise<SchemaCreationResult> {
    try {
      const schemaName = this.sanitizeSchemaName(orgName)
      const supabase = this.getSupabaseClient()

      // Create the schema
      const { error: schemaError } = await supabase.rpc('create_organization_schema', {
        schema_name: schemaName
      })

      if (schemaError) {
        return {
          success: false,
          schemaName,
          error: `Failed to create schema: ${schemaError.message}`
        }
      }

      // Create core tables in the new schema
      await this.createCoreOrganizationTables(schemaName)

      return {
        success: true,
        schemaName
      }
    } catch (error) {
      return {
        success: false,
        schemaName: this.sanitizeSchemaName(orgName),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Creates core organization tables (events, members) in the specified schema
   */
  private static async createCoreOrganizationTables(schemaName: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    // Create events table
    const eventsTableSQL = `
      CREATE TABLE IF NOT EXISTS ${schemaName}.events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        creator_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        attendance_table_name VARCHAR(255) NOT NULL,
        verification_table_name VARCHAR(255) NOT NULL
      );
    `

    // Create members table
    const membersTableSQL = `
      CREATE TABLE IF NOT EXISTS ${schemaName}.members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await supabase.rpc('execute_sql', { sql: eventsTableSQL })
    await supabase.rpc('execute_sql', { sql: membersTableSQL })
  }

  /**
   * Creates event-specific attendance and verification tables
   */
  static async createEventTables(
    schemaName: string,
    eventName: string
  ): Promise<TableCreationResult> {
    try {
      const attendanceTable = `${this.sanitizeTableName(eventName)}_attendance`
      const verificationTable = `${this.sanitizeTableName(eventName)}_verification`
      const supabase = this.getSupabaseClient()

      // Create attendance table
      const attendanceTableSQL = `
        CREATE TABLE IF NOT EXISTS ${schemaName}.${attendanceTable} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          participant_id VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Create verification table
      const verificationTableSQL = `
        CREATE TABLE IF NOT EXISTS ${schemaName}.${verificationTable} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          participant_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'verified' CHECK (status IN ('verified', 'duplicate', 'invalid')),
          verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (participant_id) REFERENCES ${schemaName}.${attendanceTable}(participant_id)
        );
      `

      // Create indexes for performance
      const attendanceIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_${attendanceTable}_participant_id 
        ON ${schemaName}.${attendanceTable}(participant_id);
      `

      const verificationIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_${verificationTable}_participant_id 
        ON ${schemaName}.${verificationTable}(participant_id);
      `

      // Execute table creation
      await supabase.rpc('execute_sql', { sql: attendanceTableSQL })
      await supabase.rpc('execute_sql', { sql: verificationTableSQL })
      await supabase.rpc('execute_sql', { sql: attendanceIndexSQL })
      await supabase.rpc('execute_sql', { sql: verificationIndexSQL })

      return {
        success: true,
        attendanceTable,
        verificationTable
      }
    } catch (error) {
      return {
        success: false,
        attendanceTable: `${this.sanitizeTableName(eventName)}_attendance`,
        verificationTable: `${this.sanitizeTableName(eventName)}_verification`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Drops an organization schema and all its tables
   */
  static async dropOrganizationSchema(schemaName: string): Promise<MigrationResult> {
    try {
      const supabase = this.getSupabaseClient()
      
      const { error } = await supabase.rpc('drop_organization_schema', {
        schema_name: schemaName
      })

      if (error) {
        return {
          success: false,
          operation: 'drop_schema',
          error: error.message
        }
      }

      return {
        success: true,
        operation: 'drop_schema'
      }
    } catch (error) {
      return {
        success: false,
        operation: 'drop_schema',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Drops event-specific tables
   */
  static async dropEventTables(
    schemaName: string,
    eventName: string
  ): Promise<MigrationResult> {
    try {
      const attendanceTable = `${this.sanitizeTableName(eventName)}_attendance`
      const verificationTable = `${this.sanitizeTableName(eventName)}_verification`
      const supabase = this.getSupabaseClient()

      // Drop tables in correct order (verification first due to foreign key)
      const dropVerificationSQL = `DROP TABLE IF EXISTS ${schemaName}.${verificationTable} CASCADE;`
      const dropAttendanceSQL = `DROP TABLE IF EXISTS ${schemaName}.${attendanceTable} CASCADE;`

      await supabase.rpc('execute_sql', { sql: dropVerificationSQL })
      await supabase.rpc('execute_sql', { sql: dropAttendanceSQL })

      return {
        success: true,
        operation: 'drop_event_tables'
      }
    } catch (error) {
      return {
        success: false,
        operation: 'drop_event_tables',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Checks if a schema exists
   */
  static async schemaExists(schemaName: string): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient()
      
      const { data, error } = await supabase.rpc('check_schema_exists', {
        schema_name: schemaName
      })

      if (error) {
        throw new Error(error.message)
      }

      return data === true
    } catch (error) {
      console.error('Error checking schema existence:', error)
      return false
    }
  }

  /**
   * Checks if event tables exist
   */
  static async eventTablesExist(schemaName: string, eventName: string): Promise<boolean> {
    try {
      const attendanceTable = `${this.sanitizeTableName(eventName)}_attendance`
      const verificationTable = `${this.sanitizeTableName(eventName)}_verification`
      const supabase = this.getSupabaseClient()

      const { data, error } = await supabase.rpc('check_tables_exist', {
        schema_name: schemaName,
        table_names: [attendanceTable, verificationTable]
      })

      if (error) {
        throw new Error(error.message)
      }

      return data === true
    } catch (error) {
      console.error('Error checking table existence:', error)
      return false
    }
  }

  /**
   * Migrates schema to add new columns or modify existing structure
   */
  static async migrateSchema(
    schemaName: string,
    migrationSQL: string
  ): Promise<MigrationResult> {
    try {
      const supabase = this.getSupabaseClient()

      const { error } = await supabase.rpc('execute_sql', { sql: migrationSQL })

      if (error) {
        return {
          success: false,
          operation: 'migrate_schema',
          error: error.message
        }
      }

      return {
        success: true,
        operation: 'migrate_schema'
      }
    } catch (error) {
      return {
        success: false,
        operation: 'migrate_schema',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static sanitizeSchemaName(name: string): string {
    return `org_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}`
  }

  static sanitizeTableName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
  }
}

// Export individual functions for backward compatibility
export const createOrganizationSchema = DatabaseService.createOrganizationSchema.bind(DatabaseService)
export const createEventTables = DatabaseService.createEventTables.bind(DatabaseService)
export const dropOrganizationSchema = DatabaseService.dropOrganizationSchema.bind(DatabaseService)
export const dropEventTables = DatabaseService.dropEventTables.bind(DatabaseService)
export const schemaExists = DatabaseService.schemaExists.bind(DatabaseService)
export const eventTablesExist = DatabaseService.eventTablesExist.bind(DatabaseService)
export const migrateSchema = DatabaseService.migrateSchema.bind(DatabaseService)
