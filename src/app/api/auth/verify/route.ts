import { NextRequest, NextResponse } from 'next/server'
import { TokenVerificationResponse, ErrorResponse } from '@/types'
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth'
import { OrganizationRepository } from '@/lib/repositories'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided'
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 401 })
    }

    try {
      // Verify the token
      const decoded = verifyAccessToken(token)

      // Optionally verify that the organization still exists
      const orgRepo = new OrganizationRepository()
      const orgResult = await orgRepo.findById(decoded.organizationId)

      if (!orgResult.success || !orgResult.data) {
        const response: ErrorResponse = {
          success: false,
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization associated with token no longer exists'
          },
          timestamp: new Date().toISOString()
        }
        return NextResponse.json(response, { status: 401 })
      }

      // Token is valid
      const response: TokenVerificationResponse = {
        success: true,
        data: {
          user: {
            id: decoded.id,
            email: decoded.email,
            organizationId: decoded.organizationId,
            role: decoded.role
          },
          isValid: true
        }
      }

      return NextResponse.json(response, { status: 200 })

    } catch (error) {
      let errorCode = 'INVALID_TOKEN'
      let errorMessage = 'Invalid authentication token'

      if (error instanceof Error) {
        if (error.message === 'ACCESS_TOKEN_EXPIRED') {
          errorCode = 'TOKEN_EXPIRED'
          errorMessage = 'Authentication token has expired'
        } else if (error.message === 'INVALID_ACCESS_TOKEN') {
          errorCode = 'INVALID_TOKEN'
          errorMessage = 'Invalid authentication token'
        }
      }

      const response: ErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        },
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(response, { status: 401 })
    }

  } catch (error) {
    console.error('Token verification error:', error)
    
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during token verification'
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}