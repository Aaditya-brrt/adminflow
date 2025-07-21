import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/chat', '/workflows']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Define auth routes (login, signup, etc.)
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/check-email', '/auth/callback']
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // Logging for debugging
  console.log('[Middleware] Path:', pathname, 'User:', user ? user.id : null)

  // If user is authenticated
  if (user) {
    if (isAuthRoute) {
      console.log('[Middleware] Authenticated user, redirecting from auth route to /dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    if (isProtectedRoute) {
      console.log('[Middleware] Authenticated user, accessing protected route')
      return supabaseResponse
    }
    if (pathname === '/') {
      console.log('[Middleware] Authenticated user, redirecting from / to /dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // If user is not authenticated
  if (!user) {
    if (isProtectedRoute) {
      console.log('[Middleware] Unauthenticated user, redirecting from protected route to /')
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    if (isAuthRoute || pathname === '/') {
      console.log('[Middleware] Unauthenticated user, accessing auth or landing page')
      return supabaseResponse
    }
    console.log('[Middleware] Unauthenticated user, redirecting to /')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
} 