import { NextRequest, NextResponse } from 'next/server'
import { ErrorResponse } from '@/types'

export async function POST(_request: NextRequest) {
  try {
    // For JWT-based authentication, logout is primarily handled client-side
    // by removing the tokens. However, we can clear the refresh token cookie
    // and potentially add the token to a blacklist in the future.

    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Successfully logged out' 
      }, 
      { status: 200 }
    )

    // Clear the refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to past date
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during logout'
      },
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}