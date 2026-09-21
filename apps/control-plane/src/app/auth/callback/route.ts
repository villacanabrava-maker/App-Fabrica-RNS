import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * 10-TELAS-TRANSVERSAIS.md §A.1 — /auth/callback: destino do OAuth GitHub e
 * dos links de e-mail (confirmação de cadastro, recuperação de senha).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
