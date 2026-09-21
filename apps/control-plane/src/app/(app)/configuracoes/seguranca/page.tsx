import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@rns/design-system';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentMembership } from '@/server/queries/organizations';
import { canManageSecurity } from '@/server/queries/rbac';

/**
 * 09-CONFIGURACOES.md §4 (Segurança). Só o que tem dado real por trás
 * neste sprint: status de 2FA (Supabase Auth MFA, real). Sessões ativas,
 * chaves de API e log de auditoria filtrado ficam claramente marcados
 * como não implementados ainda — não fabrico uma lista vazia fingindo
 * ser "zero sessões"/"zero chaves" quando na verdade é "recurso não
 * construído". Ver sprint-1-2-status.md.
 */
export default async function ConfiguracoesSegurancaPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect('/organizacao/nova');

  const supabase = await createSupabaseServerClient();
  const { data: mfaData } = await supabase.auth.mfa.listFactors();
  const totpEnrolled = (mfaData?.totp ?? []).some((factor) => factor.status === 'verified');
  const canManage = canManageSecurity(membership.role);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Autenticação em duas etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-muted">
            {totpEnrolled
              ? 'Sua conta tem um método de autenticação em duas etapas verificado.'
              : 'Nenhum método de autenticação em duas etapas configurado para sua conta ainda.'}
          </p>
          <p className="mt-2 text-caption text-text-muted">
            Fluxo de configuração (QR code, código de verificação) chega em um próximo sprint — este é o status real
            lido de <code className="font-mono">supabase.auth.mfa</code>, não um mock.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessões ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-muted">
            A listagem de dispositivos/sessões não é exposta pela API de cliente do Supabase Auth — precisa de uma
            rota de servidor dedicada. Não implementado neste sprint; não finjo uma lista vazia aqui.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-muted">
            {canManage
              ? 'Leitura de governance.audit_events já é permitida por RLS, mas a escrita (toda alteração desta página deveria gerar um evento) ainda não tem policy de INSERT nem função segura — ver server/actions/settings.ts. Adiar a leitura até a escrita existir, para não mostrar um log incompleto como se fosse completo.'
              : 'Apenas owner ou admin podem ver o log de auditoria.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-muted">
            factory.api_keys existe no schema, mas a geração/listagem de chaves é sprint futuro (integrações/API
            pública ainda não fazem parte da Fase 1 funcional).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
