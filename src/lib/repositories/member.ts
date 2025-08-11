import { BaseRepository } from './base'
import { Member, MemberCreate, DatabaseResult, PaginatedResult, MemberCreateSchema, MemberSchema } from '../../types'
import { validateData } from '../validation'

export class MemberRepository extends BaseRepository {
  /**
   * Creates a new member in the organization schema
   */
  async create(schemaName: string, memberData: MemberCreate & { orgId: string }): Promise<DatabaseResult<Member>> {
    try {
      // Validate input data
      const validation = validateData(MemberCreateSchema, memberData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const { name, email, role } = validation.data!

      // Check if member already exists in this organization
      const existingMember = await this.findByEmail(schemaName, email)
      if (existingMember.success && existingMember.data) {
        return {
          success: false,
          error: 'Member with this email already exists in the organization'
        }
      }

      // Create member record
      const memberRecord = {
        id: this.generateUUID(),
        org_id: memberData.orgId,
        name,
        email: email.toLowerCase(),
        role,
        created_at: new Date()
      }

      const { query, params } = this.buildInsertQuery('members', memberRecord, schemaName)
      const result = await this.executeQuery<any>(query, params)

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to create member'
        }
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          orgId: result.data.org_id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role as 'admin' | 'manager' | 'viewer',
          createdAt: new Date(result.data.created_at)
        } as Member
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create member'
      }
    }
  }

  /**
   * Finds member by ID
   */
  async findById(schemaName: string, id: string): Promise<DatabaseResult<Member | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.members WHERE id = $1`
      const result = await this.executeQuery<any[]>(query, { param1: id })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const member = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: member ? {
          id: member.id,
          orgId: member.org_id,
          name: member.name,
          email: member.email,
          role: member.role as 'admin' | 'manager' | 'viewer',
          createdAt: new Date(member.created_at)
        } as Member : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find member'
      }
    }
  }

  /**
   * Finds member by email
   */
  async findByEmail(schemaName: string, email: string): Promise<DatabaseResult<Member | null>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.members WHERE email = $1`
      const result = await this.executeQuery<any[]>(query, { param1: email.toLowerCase() })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const member = result.data && result.data.length > 0 ? result.data[0] : null
      
      return {
        success: true,
        data: member ? {
          id: member.id,
          orgId: member.org_id,
          name: member.name,
          email: member.email,
          role: member.role as 'admin' | 'manager' | 'viewer',
          createdAt: new Date(member.created_at)
        } as Member : null
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find member'
      }
    }
  }

  /**
   * Updates member data
   */
  async update(schemaName: string, id: string, updateData: Partial<MemberCreate>): Promise<DatabaseResult<Member>> {
    try {
      // Validate update data
      const validation = validateData(MemberSchema.partial(), updateData)
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`
        }
      }

      const data = validation.data!

      const { query, params } = this.buildUpdateQuery('members', data, { id }, schemaName)
      const result = await this.executeQuery<any>(query, params)

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to update member'
        }
      }

      return {
        success: true,
        data: {
          id: result.data.id,
          orgId: result.data.org_id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role as 'admin' | 'manager' | 'viewer',
          createdAt: new Date(result.data.created_at)
        } as Member
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update member'
      }
    }
  }

  /**
   * Deletes member
   */
  async delete(schemaName: string, id: string): Promise<DatabaseResult<boolean>> {
    try {
      const query = `DELETE FROM ${this.sanitizeIdentifier(schemaName)}.members WHERE id = $1`
      const result = await this.executeQuery(query, { param1: id })

      return {
        success: result.success,
        data: result.success
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete member'
      }
    }
  }

  /**
   * Lists members with pagination
   */
  async list(schemaName: string, page: number = 1, limit: number = 50): Promise<DatabaseResult<PaginatedResult<Member>>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.members ORDER BY created_at DESC`
      const countQuery = `SELECT COUNT(*) as count FROM ${this.sanitizeIdentifier(schemaName)}.members`

      const result = await this.executePaginatedQuery<any>(query, countQuery, page, limit)

      if (!result.success) {
        return result
      }

      // Transform dates
      const transformedData = {
        ...result.data!,
        data: result.data!.data.map((member: any) => ({
          id: member.id,
          orgId: member.org_id,
          name: member.name,
          email: member.email,
          role: member.role as 'admin' | 'manager' | 'viewer',
          createdAt: new Date(member.created_at)
        })) as Member[]
      }

      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list members'
      }
    }
  }

  /**
   * Lists members by role
   */
  async listByRole(schemaName: string, role: 'admin' | 'manager' | 'viewer'): Promise<DatabaseResult<Member[]>> {
    try {
      const query = `SELECT * FROM ${this.sanitizeIdentifier(schemaName)}.members WHERE role = $1 ORDER BY created_at DESC`
      const result = await this.executeQuery<any[]>(query, { param1: role })

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const members = result.data?.map((member: any) => ({
        id: member.id,
        orgId: member.org_id,
        name: member.name,
        email: member.email,
        role: member.role as 'admin' | 'manager' | 'viewer',
        createdAt: new Date(member.created_at)
      })) as Member[] || []

      return {
        success: true,
        data: members
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list members by role'
      }
    }
  }

  /**
   * Updates member role
   */
  async updateRole(schemaName: string, id: string, role: 'admin' | 'manager' | 'viewer'): Promise<DatabaseResult<Member>> {
    try {
      return await this.update(schemaName, id, { role })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update member role'
      }
    }
  }

  /**
   * Finds members by organization (using organization ID)
   */
  async findByOrganization(organizationId: string): Promise<DatabaseResult<Member[]>> {
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
        error: error instanceof Error ? error.message : 'Failed to find members by organization'
      }
    }
  }

  /**
   * Counts members by role
   */
  async countByRole(schemaName: string): Promise<DatabaseResult<Record<string, number>>> {
    try {
      const query = `
        SELECT role, COUNT(*) as count 
        FROM ${this.sanitizeIdentifier(schemaName)}.members 
        GROUP BY role
      `
      const result = await this.executeQuery<{ role: string; count: number }[]>(query)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const counts = {
        admin: 0,
        manager: 0,
        viewer: 0
      }

      result.data?.forEach(row => {
        counts[row.role as keyof typeof counts] = row.count
      })

      return {
        success: true,
        data: counts
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count members by role'
      }
    }
  }
}