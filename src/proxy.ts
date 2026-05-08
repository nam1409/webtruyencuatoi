import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ratelimit } from '@/lib/ratelimit'
import { createServerClient } from '@supabase/ssr'

/**
 * Next.js 16 Proxy Implementation
 * Running on Node.js Runtime for maximum performance and library support.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Rate Limiting (API only)
  if (path.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    try {
      const { success } = await ratelimit.limit(ip)
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } catch (e) { console.error('Rate limit failed', e) }
  }

  // 2. Initialize Response and Sync Session
  let response = await updateSession(request)

  // 3. Site Settings Enforcement
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  )

  const { data: settings } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()

  if (settings) {
    // HTTPS Enforcement
    if (settings.force_https && request.headers.get('x-forwarded-proto') === 'http') {
      console.log(`[Proxy] Redirecting to HTTPS: ${path}`);
      return NextResponse.redirect(`https://${request.headers.get('host')}${path}`, 301)
    }

    // Registration Control
    if (!settings.allow_registration && path.startsWith('/register')) {
      console.log(`[Proxy] Registration disabled, redirecting from ${path}`);
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Maintenance Mode Logic
    if (settings.maintenance_mode) {
      const { data: { user } } = await supabase.auth.getUser()
      
      let hasAccess = false
      if (user) {
        // Kiểm tra giống logic checkAdminRole
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (profile?.role === 'admin') {
          hasAccess = true
        } else {
          // Check Author
          const { count: storiesCount } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('author_id', user.id)
          if (storiesCount && storiesCount > 0) {
            hasAccess = true
          } else {
            // Check Collab
            const { count: collabCount } = await supabase.from('story_collaborators').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
            if (collabCount && collabCount > 0) hasAccess = true
          }
        }
      }

      const isPublicPath = path.startsWith('/maintenance') || 
                          path.startsWith('/login') || 
                          path.startsWith('/auth') || 
                          path.startsWith('/admin') || // Luôn cho phép vào admin để quản lý
                          path.startsWith('/_next') || 
                          path.startsWith('/api') ||
                          path.includes('.')

      if (!hasAccess && !isPublicPath) {
        return NextResponse.rewrite(new URL('/maintenance', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
