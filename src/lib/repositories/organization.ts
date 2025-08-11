import { BaseRepository } from './base'
import { Organization, OrganizationCreate, DatabaseResult, PaginatedResult, OrganizationCreateSchema, OrganizationSchema } from '../../types'
import { validateData } from '../validation'
import { DatabaseService } from '../database'
import bcrypt from 'bcryptjs'

export class OrganizationRepository extends BaseRepository {
  /**
   * Creates a new organization with schema
   */
  async create(organizationData: OrganizationCreate): Promise<DatabaseResult<Organization>> {
    try {
      // Validate input data
      const validation = validateData(OrganizationCreateSchema, organizationData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const { name, email, password } = validation.data!

      // Check if organization already exists
      const existingOrg = await this.findByEmail(email)
      if (existingOrg.success && existingOrg.data) {
        return {
          success: false,
          error: 'Organization with this email already exists'
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12)

      // Generate schema name
      const schemaName = DatabaseService.sanitizeSchemaName(name)

      // Create organization record
      const orgData = {
        id: this.generateUUID(),
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        schema: schemaName,
        created_at: new Date(),
        updated_at: new Date()
      }

      const { query, params } = this.buildInsertQuery('organizations', orgData)
      const result = await this.executeQuery<any>(query, params)

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to create organization'
        }
      }

      // Create organization schema
      const schemaResult = await DatabaseService.createOrganizationSchema(name)
      if (!schemaResult.success) {
        // Rollback organization creation if schema creation fails
        await this.delete(orgData.id)
        return {
          success: false,
          error: `Failed to create organization schema: ${schemaResult.error}`
        }
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          passwordHash: result.data.password_hash,
          schema: result.data.schema,
          createdAt: new Date(result.data.created_at),
          updatedAt: new Date(result.data.updated_at)
        } as Organization
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create organization'
      }
    }
  }

  /**
   * Finds organization by ID
   */
  async findById(id: string): Promise<DatabaseResult<Organization | null>> {
    try {
      const query = 'SELECT * FROM organizations WHERE id = $1'
      const result = await this.executeQuery<any[]>(query, { param1: id })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const org = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: org ? {
          id: org.id,
          name: org.name,
          email: org.email,
          passwordHash: org.password_hash,
          schema: org.schema,
          createdAt: new Date(org.created_at),
          updatedAt: new Date(org.updated_at)
        } as Organization : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find organization'
      }
    }
  }

  /**
   * Finds organization by email
   */
  async findByEmail(email: string): Promise<DatabaseResult<Organization | null>> {
    try {
      const query = 'SELECT * FROM organizations WHERE email = $1'
      const result = await this.executeQuery<any[]>(query, { param1: email.toLowerCase() })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const org = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: org ? {
          id: org.id,
          name: org.name,
          email: org.email,
          passwordHash: org.password_hash,
          schema: org.schema,
          createdAt: new Date(org.created_at),
          updatedAt: new Date(org.updated_at)
        } as Organization : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find organization'
      }
    }
  }

  /**
   * Updates organization data
   */
  async update(id: string, updateData: Partial<OrganizationCreate>): Promise<DatabaseResult<Organization>> {
    try {
      // Validate update data
      const validation = validateData(OrganizationSchema.partial(), updateData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const data = { ...validation.data!, updated_at: new Date() }

      // Hash password if provided
      if (updateData.password) {
        (data as any).password_hash = await bcrypt.hash(updateData.password, 12)
        delete (data as any).password
      }

      const { query, params } = this.buildUpdateQuery('organizations', data, { id })
      const result = await this.executeQuery<any>(query, params)

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to update organization'
        }
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          passwordHash: result.data.password_hash,
          schema: result.data.schema,
          createdAt: new Date(result.data.created_at),
          updatedAt: new Date(result.data.updated_at)
        } as Organization
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update organization'
      }
    }
  }

  /**
   * Deletes organization and its schema
   */
  async delete(id: string): Promise<DatabaseResult<boolean>> {
    try {
      // Get organization to find schema name
      const org = await this.findById(id)
      if (!org.success || !org.data) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      // Delete organization schema first
      const schemaResult = await DatabaseService.dropOrganizationSchema(org.data.schema)
      if (!schemaResult.success) {
        console.warn(`Failed to drop schema ${org.data.schema}: ${schemaResult.error}`)
      }

      // Delete organization record
      const query = 'DELETE FROM organizations WHERE id = $1'
      const result = await this.executeQuery(query, { param1: id })

      return {
        success: result.success,
        data: result.success
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete organization'
      }
    }
  }

  /**
   * Lists organizations with pagination
   */
  async list(page: number = 1, limit: number = 50): Promise<DatabaseResult<PaginatedResult<Organization>>> {
    try {
      const query = 'SELECT * FROM organizations ORDER BY created_at DESC'
      const countQuery = 'SELECT COUNT(*) as count FROM organizations'

      const result = await this.executePaginatedQuery<any>(query, countQuery, page, limit)

      if (!result.success) {
        return result
      }

      // Transform dates
      const transformedData = {
        ...result.data!,
        data: result.data!.data.map((org: any) => ({
          id: org.id,
          name: org.name,
          email: org.email,
          passwordHash: org.password_hash,
          schema: org.schema,
          createdAt: new Date(org.created_at),
          updatedAt: new Date(org.updated_at)
        })) as Organization[]
      }

      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list organizations'
      }
    }
  }

  /**
   * Verifies organization password
   */
  async verifyPassword(email: string, password: string): Promise<DatabaseResult<Organization | null>> {
    try {
      const org = await this.findByEmail(email)
      if (!org.success || !org.data) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      const isValid = await bcrypt.compare(password, org.data.passwordHash)
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid password'
        }
      }

      return {
        success: true,
        data: org.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify password'
      }
    }
  }
}