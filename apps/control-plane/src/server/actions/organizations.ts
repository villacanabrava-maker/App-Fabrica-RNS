'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ActionState } from './auth';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Chama factory.create_organization (0014_organization_bootstrap.sql) —
 * função SECURITY DEFINER que cria a organização e a membership 'owner' do
 * chamador na mesma transação. Nunca envia role/user_id/organization_id:
 * a função os deriva de auth.uid() no servidor.
 */
export async function createOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return { error: 'Informe o nome da organização.' };
  }

  const slug = slugify(name);
  if (!slug) {
    return { error: 'Não foi possível gerar um identificador para este nome.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('create_organization', { p_name: name, p_slug: slug });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe uma organização com esse nome. Tente um nome diferente.' };
    }
    return { error: 'Não foi possível criar a organização. Tente novamente.' };
  }

  redirect('/');
}
