import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublishableKey, supabaseUrl } from './env';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Uma instância nova por request (nunca compartilhada), conforme a própria
 * documentação de @supabase/ssr.
 *
 * `setAll` pode falhar em Server Components puros (Next.js não permite
 * escrever cookies fora de Server Actions/Route Handlers/Middleware) — o
 * try/catch é esperado nesse caso; a sessão ainda é lida corretamente, e o
 * middleware (src/middleware.ts) é quem garante a renovação do cookie.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component sem permissão de escrita — middleware cobre a renovação.
        }
      },
    },
  });
}
