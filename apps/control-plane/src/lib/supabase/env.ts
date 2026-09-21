function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}. Ver .env.example.`);
  }
  return value;
}

export function supabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Sem esta variável, `redirectTo` do reset de senha e do OAuth vira caminho
 * relativo (`/auth/callback...`) — o e-mail/redirect do Supabase quebra
 * silenciosamente (Fiscal R1, achado 5).
 */
export function siteUrl(): string {
  return required('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL);
}
