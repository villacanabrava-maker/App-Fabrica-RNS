'use server';

import { redirect } from 'next/navigation';
import { sanitizeRedirectPath } from '@/lib/redirect';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface ActionState {
  error?: string;
  success?: boolean;
}

/**
 * 10-TELAS-TRANSVERSAIS.md §A.3: mensagem de erro genérica, nunca revela se
 * o e-mail existe.
 */
export async function signInWithPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = sanitizeRedirectPath(formData.get('next'));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  redirect(next);
}

export async function signUpWithPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '');

  if (password.length < 8) {
    return { error: 'A senha precisa ter pelo menos 8 caracteres.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: 'Não foi possível criar a conta. Verifique os dados e tente novamente.' };
  }

  redirect('/login?registrado=1');
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const supabase = await createSupabaseServerClient();

  // Erro nunca é revelado ao chamador: mesma resposta exista ou não o e-mail.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=/configuracoes/seguranca`,
  });

  return { success: true };
}

export async function signInWithGitHub(formData: FormData): Promise<never> {
  const next = sanitizeRedirectPath(formData.get('next'));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect('/login?erro=oauth');
  }

  redirect(data.url);
}

export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
