import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DatabaseService } from '../lib/database'

// Mock Supabase client
const mockSupabaseClient = {
  rpc: vi.fn()
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('DatabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
    process.env = originalEnv
  })

  describe('sanitizeSchemaName', () => {
    it('should create valid schema name from organization name', () => {
      expect(DatabaseService.sanitizeSchemaName('Test Company')).toBe('org_test_company')
      expect(DatabaseService.sanitizeSchemaName('Company-123')).toBe('org_company_123')
      expect(DatabaseService.sanitizeSchemaName('Special@#$%Characters')).toBe('org_special_characters')
    })
  })

  describe('sanitizeTableName', () => {
    it('should create valid table name from event name', () => {
      expect(DatabaseService.sanitizeTableName('Annual Meeting')).toBe('annual_meeting')
      expect(DatabaseService.sanitizeTableName('Event-2024')).toBe('event_2024')
      expect(DatabaseService.sanitizeTableName('Special@#$%Event')).toBe('special_event')
    })
  })

  describe('createOrganizationSchema', () => {
    it('should successfully create organization schema', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null })

      const result = await DatabaseService.createOrganizationSchema('Test Company')

      expect(result.success).toBe(true)
      expect(result.schemaName).toBe('org_test_company')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('create_organization_schema', {
        schema_name: 'org_test_company'
      })
    })

    it('should handle schema creation errors', async () => {
      const error = { message: 'Schema already exists' }
      mockSupabaseClient.rpc.mockResolvedValue({ error })

      const result = await DatabaseService.createOrganizationSchema('Test Company')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create schema: Schema already exists')
    })

    it('should handle exceptions during schema creation', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Connection failed'))

      const result = await DatabaseService.createOrganizationSchema('Test Company')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('createEventTables', () => {
    it('should successfully create event tables', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null })

      const result = await DatabaseService.createEventTables('org_test_company', 'Annual Meeting')

      expect(result.success).toBe(true)
      expect(result.attendanceTable).toBe('annual_meeting_attendance')
      expect(result.verificationTable).toBe('annual_meeting_verification')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(4) // 2 tables + 2 indexes
    })

    it('should handle table creation errors', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Table creation failed'))

      const result = await DatabaseService.createEventTables('org_test_company', 'Annual Meeting')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Table creation failed')
    })
  })

  describe('dropOrganizationSchema', () => {
    it('should successfully drop organization schema', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null })

      const result = await DatabaseService.dropOrganizationSchema('org_test_company')

      expect(result.success).toBe(true)
      expect(result.operation).toBe('drop_schema')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('drop_organization_schema', {
        schema_name: 'org_test_company'
      })
    })

    it('should handle schema drop errors', async () => {
      const error = { message: 'Schema not found' }
      mockSupabaseClient.rpc.mockResolvedValue({ error })

      const result = await DatabaseService.dropOrganizationSchema('org_test_company')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Schema not found')
    })
  })

  describe('dropEventTables', () => {
    it('should successfully drop event tables', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null })

      const result = await DatabaseService.dropEventTables('org_test_company', 'Annual Meeting')

      expect(result.success).toBe(true)
      expect(result.operation).toBe('drop_event_tables')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2) // verification table + attendance table
    })

    it('should handle table drop errors', async () => {
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Table drop failed'))

      const result = await DatabaseService.dropEventTables('org_test_company', 'Annual Meeting')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Table drop failed')
    })
  })

  describe('schemaExists', () => {
    it('should return true when schema exists', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null })

      const result = await DatabaseService.schemaExists('org_test_company')

      expect(result).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_schema_exists', {
        schema_name: 'org_test_company'
      })
    })

    it('should return false when schema does not exist', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: false, error: null })

      const result = await DatabaseService.schemaExists('org_test_company')

      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      const result = await DatabaseService.schemaExists('org_test_company')

      expect(result).toBe(false)
    })
  })

  describe('eventTablesExist', () => {
    it('should return true when event tables exist', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null })

      const result = await DatabaseService.eventTablesExist('org_test_company', 'Annual Meeting')

      expect(result).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_tables_exist', {
        schema_name: 'org_test_company',
        table_names: ['annual_meeting_attendance', 'annual_meeting_verification']
      })
    })

    it('should return false when event tables do not exist', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: false, error: null })

      const result = await DatabaseService.eventTablesExist('org_test_company', 'Annual Meeting')

      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      const result = await DatabaseService.eventTablesExist('org_test_company', 'Annual Meeting')

      expect(result).toBe(false)
    })
  })

  describe('migrateSchema', () => {
    it('should successfully execute migration SQL', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ error: null })

      const migrationSQL = 'ALTER TABLE org_test.events ADD COLUMN new_field VARCHAR(255);'
      const result = await DatabaseService.migrateSchema('org_test_company', migrationSQL)

      expect(result.success).toBe(true)
      expect(result.operation).toBe('migrate_schema')
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('execute_sql', { sql: migrationSQL })
    })

    it('should handle migration errors', async () => {
      const error = { message: 'Migration failed' }
      mockSupabaseClient.rpc.mockResolvedValue({ error })

      const migrationSQL = 'INVALID SQL;'
      const result = await DatabaseService.migrateSchema('org_test_company', migrationSQL)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Migration failed')
    })
  })
})