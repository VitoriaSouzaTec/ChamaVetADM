import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Injetar headers de segurança obrigatórios
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  const pathname = request.nextUrl.pathname

  // Ignorar rotas estáticas e assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/brasilapi') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return response
  }

  const isAuthRoute = pathname === '/login' || pathname.startsWith('/login/')

  // Verificar se há sessão de demonstração ativa (Dev/Sandbox)
  const demoRoleCookie = request.cookies.get('chamavet_demo_role')?.value
  if (demoRoleCookie === 'admin' || demoRoleCookie === 'support') {
    if (isAuthRoute && pathname !== '/login/mfa') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isSupabaseConfigured =
    supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')

  // Se Supabase ainda não estiver configurado e sem demo cookie, permitir acessar a tela de login
  if (!isSupabaseConfigured) {
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar sessão real do Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (!isAuthRoute) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Verificar papel no app_metadata
  const adminRole =
    user.app_metadata?.admin_role || user.app_metadata?.role

  if (adminRole !== 'admin' && adminRole !== 'support') {
    await supabase.auth.signOut()
    const errorUrl = new URL('/login?error=sem_permissao', request.url)
    return NextResponse.redirect(errorUrl)
  }

  // Verificar nível de autenticação MFA (AAL2)
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const isAal2 = aalData?.currentLevel === 'aal2'
  const isMfaRoute = pathname === '/login/mfa'

  if (!isAal2) {
    if (!isMfaRoute) {
      const mfaUrl = new URL('/login/mfa', request.url)
      return NextResponse.redirect(mfaUrl)
    }
    return response
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
