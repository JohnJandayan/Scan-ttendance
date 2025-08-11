import { NextRequest, NextResponse } from 'next/server'
import { RegisterSchema, AuthResponse, ErrorResponse } from '@/types'
import { hashPassword, generateTokenPair, TokenPayload } from '@/lib/auth'
import { OrganizationRepository } from '@/lib/repositories'
import { createOrganizationSchema } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: validation.error.issues
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 400 })
    }

    const { name, email, password } = validation.data

    // Check if organization with this email already exists
    const orgRepo = new OrganizationRepository()
    const existingOrg = await orgRepo.findByEmail(email)
    
    if (existingOrg.success && existingOrg.data) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An organization with this email already exists'
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 409 })
    }

    // Create organization record (repository will handle password hashing)
    const createResult = await orgRepo.create({
      name,
      email,
      password
    })

    if (!createResult.success || !createResult.data) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: 'Failed to create organization account'
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 500 })
    }

    const organization = createResult.data

    // Generate JWT tokens
    const tokenPayload: TokenPayload = {
      id: organization.id,
      email: organization.email,
      organizationId: organization.id,
      role: 'admin' // Organization owner is admin by default
    }

    const tokens = generateTokenPair(tokenPayload)

    // Prepare response
    const response: AuthResponse = {
      success: true,
      data: {
        user: {
          id: organization.id,
          email: organization.email,
          organizationId: organization.id,
          organizationName: organization.name,
          role: 'admin'
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      }
    }

    // Set refresh token as httpOnly cookie
    const nextResponse = NextResponse.json(response, { status: 201 })
    nextResponse.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return nextResponse

  } catch (error) {
    console.error('Registration error:', error)
    
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during registration'
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
