import { NextRequest, NextResponse } from 'next/server'
import { LoginSchema, AuthResponse, ErrorResponse } from '@/types'
import { comparePassword, generateTokenPair, TokenPayload } from '@/lib/auth'
import { OrganizationRepository } from '@/lib/repositories'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = LoginSchema.safeParse(body)
    if (!validation.success) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login credentials format',
          details: validation.error.issues
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 400 })
    }

    const { email, password } = validation.data

    // Find organization by email
    const orgRepo = new OrganizationRepository()
    const orgResult = await orgRepo.findByEmail(email)
    
    if (!orgResult.success || !orgResult.data) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 401 })
    }

    const organization = orgResult.data

    // Verify password
    const isPasswordValid = await comparePassword(password, organization.passwordHash)
    
    if (!isPasswordValid) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 401 })
    }

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
    const nextResponse = NextResponse.json(response, { status: 200 })
    nextResponse.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return nextResponse

  } catch (error) {
    console.error('Login error:', error)
    
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during login'
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
