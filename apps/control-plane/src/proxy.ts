import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabasePublishableKey, supabaseUrl } from './lib/supabase/env';

const PUBLIC_PATHS = ['/login', '/registrar', '/recuperar-senha', '/aceitar-convite', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * 10-TELAS-TRANSVERSAIS.md §A.3: rota protegida sem sessão → /login.
 * Sessão válida em rota pública de auth → manda para a raiz (o layout do
 * grupo (app) decide se falta organização).
 *
 * Arquivo/nome de função "proxy" (não "middleware"): convenção renomeada no
 * Next.js 16 — confirmado no changelog embutido no pacote instalado
 * (node_modules/next/dist/docs/.../proxy.md, "Middleware is deprecated and
 * renamed to Proxy"), já que a doc pública equivalente está fora da rede
 * permitida neste ambiente.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);

  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublic && pathname !== '/auth/callback' && !pathname.startsWith('/aceitar-convite')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
