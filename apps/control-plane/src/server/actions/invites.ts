'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionState } from './auth';

/**
 * Chama factory.accept_invite (0016_invites.sql) — valida token/estado/
 * expiração/identidade e cria a membership na mesma transação. A tela
 * `/aceitar-convite/[token]` já filtra os casos óbvios (sem sessão, e-mail
 * diferente, convite indisponível) antes de mostrar este botão; a função no
 * banco é a defesa real, não esta checagem.
 */
export async function acceptInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get('token') ?? '');
  if (!token) return { error: 'Convite inválido.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Faça login para aceitar o convite.' };

  const { error } = await supabase.rpc('accept_invite', { p_token: token });

  if (error) {
    if (error.message.includes('expirado')) return { error: 'Este convite expirou.' };
    if (error.message.includes('outro e-mail')) {
      return { error: 'Este convite foi emitido para outro e-mail. Saia e entre com a conta correta.' };
    }
    if (error.message.includes('já é membro')) return { error: 'Você já é membro desta organização.' };
    if (error.message.includes('não está mais disponível')) return { error: 'Este convite já foi usado ou revogado.' };
    if (error.message.includes('convite inválido')) return { error: 'Convite inválido.' };
    return { error: 'Não foi possível aceitar o convite.' };
  }

  redirect('/');
}
