import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'auth_error')
        errorUrl.searchParams.set('error_description', exchangeError.message)
        return NextResponse.redirect(errorUrl)
      }

      if (data?.user) {
        // Optional: Log successful authentication
        console.log('User authenticated successfully:', data.user.email)
        
        // Create the redirect URL
        const redirectUrl = new URL(next, requestUrl.origin)
        
        // Optional: Add success parameter
        redirectUrl.searchParams.set('auth', 'success')
        
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('error_description', 'An unexpected error occurred during authentication')
      return NextResponse.redirect(errorUrl)
    }
  }

  // If no code is present, redirect to login
  console.warn('No authorization code found in callback')
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'missing_code')
  loginUrl.searchParams.set('error_description', 'No authorization code found')
  return NextResponse.redirect(loginUrl)
}

export async function POST(request: NextRequest) {
  // Handle POST requests (if needed for custom flows)
  const requestUrl = new URL(request.url)
  
  try {
    const body = await request.json()
    const { code, next = '/dashboard' } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      redirect: next
    })
    
  } catch (error) {
    console.error('Error in POST callback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}