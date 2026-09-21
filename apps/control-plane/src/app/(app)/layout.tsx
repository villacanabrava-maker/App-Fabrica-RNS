import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { Topbar } from '@/components/shell/topbar';
import { getCurrentMembership } from '@/server/queries/organizations';

/**
 * 02-ARQUITETURA-FRONTEND.md §4 — shell presente em toda página autenticada.
 * O proxy (src/proxy.ts) já garante sessão válida antes de chegar aqui;
 * este layout garante organização — "a organização precisa existir antes
 * de qualquer projeto" (09-CONFIGURACOES.md).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect('/organizacao/nova');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{
            fullName: membership.userFullName,
            email: membership.userEmail,
            role: membership.role,
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
