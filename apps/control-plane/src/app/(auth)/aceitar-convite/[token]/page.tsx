import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = { title: 'Aceitar convite — Fábrica Apps RNS' };

interface InvitePreview {
  organization_name: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
}

// (auth)/layout.tsx já provê o wrapper de tela cheia centralizado com a marca
// (mesmo padrão de login-form.tsx/registrar-form.tsx) — aqui só o cartão.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm">
      <h2 className="text-h3 font-semibold text-text-primary">Convite para a Fábrica Apps RNS</h2>
      {children}
    </div>
  );
}

/**
 * 10-TELAS-TRANSVERSAIS.md §A.3: rota pública. `factory.get_invite_preview`
 * (0016_invites.sql) é a única leitura liberada a `anon`/`authenticated` por
 * token — não lista nem enumera convites. A aceitação de verdade
 * (factory.accept_invite) exige sessão e valida token/estado/expiração/
 * identidade de novo, na mesma transação da membership — esta página só
 * decide qual UI mostrar, não é a defesa.
 */
export default async function AceitarConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: previewRows }, { data: userData }] = await Promise.all([
    supabase.rpc('get_invite_preview', { p_token: token }),
    supabase.auth.getUser(),
  ]);

  const preview = (Array.isArray(previewRows) ? previewRows[0] : previewRows) as InvitePreview | undefined;
  const user = userData.user;
  const next = `/aceitar-convite/${token}`;

  if (!preview) {
    return (
      <Shell>
        <p className="text-body-sm text-text-muted">Este link de convite não existe mais ou é inválido.</p>
      </Shell>
    );
  }

  const expired = preview.status === 'expired' || new Date(preview.expires_at) < new Date();
  const unavailable = preview.status !== 'pending' || expired;

  return (
    <Shell>
      <p className="text-body-sm text-text-secondary">
        Convite para <strong>{preview.email}</strong> entrar em <strong>{preview.organization_name}</strong> como{' '}
        <strong>{preview.role}</strong>.
      </p>

      {unavailable ? (
        <p className="text-body-sm text-status-danger">Este convite não está mais disponível.</p>
      ) : !user ? (
        <div className="flex flex-col gap-2">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-primary px-4 text-body font-medium text-text-on-brand hover:bg-brand-primary-hover"
          >
            Entrar
          </Link>
          <Link
            href={`/registrar?next=${encodeURIComponent(next)}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border-default px-4 text-body font-medium text-text-primary hover:bg-bg-surface-elevated"
          >
            Criar conta
          </Link>
        </div>
      ) : user.email?.toLowerCase() !== preview.email ? (
        <p className="text-body-sm text-status-danger">
          Você está logado como {user.email}, mas este convite é para {preview.email}. Saia e entre com a conta correta.
        </p>
      ) : (
        <AcceptInviteForm token={token} />
      )}
    </Shell>
  );
}
