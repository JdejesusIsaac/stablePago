import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if environment variables are available (required for Supabase client)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when env vars are missing, just return the response without auth
    console.warn('Supabase environment variables not available, skipping auth middleware')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: You *must* call await supabase.auth.getUser() to refresh the auth token
  // This validates the JWT and refreshes it if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define allowed routes for AllowMe.ai
  const allowedRoutes = [
    '/',
    '/retrieval_agents',
    '/progress',
    '/demo',
    '/auth',
    '/api',
    '/assessment-config'
  ];

  const isAllowedRoute = allowedRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + '/')
  );

  // Redirect to retrieval_agents if accessing restricted routes
  if (!isAllowedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/retrieval_agents'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from home to retrieval_agents (main app)
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/retrieval_agents'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to home for sign-in
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it contains the refreshed cookies
  return supabaseResponse
} 