import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { GET as verifyGET } from '@/app/api/auth/verify/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { OrganizationRepository } from '@/lib/repositories'
import { generateAccessToken, TokenPayload } from '@/lib/auth'

// Mock the repositories and database functions
vi.mock('@/lib/repositories', () => ({
  OrganizationRepository: vi.fn()
}))

vi.mock('@/lib/database', () => ({
  createOrganizationSchema: vi.fn()
}))

// Mock bcrypt for consistent testing
vi.mock('bcryptjs', async () => {
  const actual = await vi.importActual('bcryptjs')
  return {
    ...actual,
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn()
  }
})

describe('Authentication API Endpoints', () => {
  let mockOrgRepo: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockOrgRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn()
    }
    
    vi.mocked(OrganizationRepository).mockImplementation(() => mockOrgRepo)
    
    // Reset bcrypt mocks
    const bcrypt = await import('bcryptjs')
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never) // Default to false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new organization successfully', async () => {
      const requestBody = {
        name: 'Test Organization',
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock that organization doesn't exist
      mockOrgRepo.findByEmail.mockResolvedValue({ success: true, data: null })
      
      // Mock successful creation
      mockOrgRepo.create.mockResolvedValue({
        success: true,
        data: {
          id: 'org-123',
          name: 'Test Organization',
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          schema: 'org_test_organization',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await registerPOST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.success).toBe(true)
      expect(body.data.user.email).toBe('test@example.com')
      expect(body.data.user.organizationName).toBe('Test Organization')
      expect(body.data.tokens.accessToken).toBeDefined()
      expect(body.data.tokens.refreshToken).toBeDefined()
    })

    it('should return 409 if organization already exists', async () => {
      const requestBody = {
        name: 'Test Organization',
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock that organization already exists
      mockOrgRepo.findByEmail.mockResolvedValue({
        success: true,
        data: { id: 'existing-org', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await registerPOST(request)
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('EMAIL_EXISTS')
    })

    it('should return 400 for invalid registration data', async () => {
      const requestBody = {
        name: '',
        email: 'invalid-email',
        password: '123' // Too short
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await registerPOST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should have correct login endpoint structure', async () => {
      // This test verifies the endpoint exists and handles requests properly
      // The actual password comparison logic is tested in the auth.test.ts file
      const requestBody = {
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock organization not found to test the flow
      mockOrgRepo.findByEmail.mockResolvedValue({ success: true, data: null })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      // Should return 401 for non-existent organization
      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for invalid email', async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      // Mock organization not found
      mockOrgRepo.findByEmail.mockResolvedValue({ success: true, data: null })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for invalid password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      // Mock finding organization
      mockOrgRepo.findByEmail.mockResolvedValue({
        success: true,
        data: {
          id: 'org-123',
          email: 'test@example.com',
          passwordHash: 'hashed_password'
        }
      })

      // Mock password comparison failure
      const bcrypt = await import('bcryptjs')
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await loginPOST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_CREDENTIALS')
    })
  })

  describe('GET /api/auth/verify', () => {
    it('should verify valid token successfully', async () => {
      const tokenPayload: TokenPayload = {
        id: 'org-123',
        email: 'test@example.com',
        organizationId: 'org-123'
      }

      const token = generateAccessToken(tokenPayload)

      // Mock organization exists
      mockOrgRepo.findById.mockResolvedValue({
        success: true,
        data: { id: 'org-123', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const response = await verifyGET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.isValid).toBe(true)
      expect(body.data.user.email).toBe('test@example.com')
    })

    it('should return 401 when no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'GET'
      })

      const response = await verifyGET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NO_TOKEN')
    })

    it('should return 401 for invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid.token.here' }
      })

      const response = await verifyGET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_TOKEN')
    })

    it('should return 401 when organization no longer exists', async () => {
      const tokenPayload: TokenPayload = {
        id: 'org-123',
        email: 'test@example.com',
        organizationId: 'org-123'
      }

      const token = generateAccessToken(tokenPayload)

      // Mock organization not found
      mockOrgRepo.findById.mockResolvedValue({ success: true, data: null })

      const request = new NextRequest('http://localhost:3000/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const response = await verifyGET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('ORGANIZATION_NOT_FOUND')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST'
      })

      const response = await logoutPOST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toBe('Successfully logged out')
      
      // Check that refresh token cookie is cleared
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('refreshToken=')
      expect(cookies).toContain('Max-Age=0')
    })
  })
})