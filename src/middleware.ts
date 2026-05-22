import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── /admin/* ──────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // Verificar que es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/?error=no-admin', request.url));
    }
  }

  // Redirigir si ya logueado y va al login de admin
  if (pathname === '/admin/login' && user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single();
    if (profile?.is_admin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // ── /perfil/* ─────────────────────────────────────────────
  if (pathname.startsWith('/perfil') && !user) {
    return NextResponse.redirect(new URL('/login?redirect=/perfil', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/perfil/:path*'],
};
