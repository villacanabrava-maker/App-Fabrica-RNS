'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@rns/design-system';
import { NAV_ITEMS, motivationFor } from './nav-items';

/**
 * 02-ARQUITETURA-FRONTEND.md §4 — AppSidebar: nove itens fixos, item ativo
 * com fundo elevado, SidebarBrand, SidebarMotivation. Colapso (compactar
 * menu lateral) é preferência de Configurações → Geral, fora do Sprint 1.2
 * (a aba Geral não está no escopo deste sprint — ver sprint-1-2-status.md).
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex w-[var(--rns-layout-sidebar-expanded)] shrink-0 flex-col justify-between bg-bg-sidebar px-3 py-4"
      aria-label="Navegação principal"
    >
      <div className="flex flex-col gap-6">
        <Link href="/" className="flex flex-col gap-1 px-2 py-1">
          <span
            aria-hidden="true"
            className="size-8 rounded-lg"
            style={{ background: 'var(--rns-brand-gradient)' }}
          />
          <span className="text-body-lg font-bold text-white">Fábrica Apps RNS</span>
          <span className="text-caption text-white/60">Agentes. Ideias. Aplicativos Reais.</span>
        </Link>

        <nav aria-label="Páginas">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'flex items-center gap-3 rounded-md bg-white/10 px-3 py-2 text-body-sm font-medium text-white'
                        : 'flex items-center gap-3 rounded-md px-3 py-2 text-body-sm text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  >
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div aria-hidden="true" className="rounded-lg bg-white/5 p-4">
        <p className="text-body-sm text-white/80">{motivationFor(pathname)}</p>
        <div className="mt-3 h-1 w-full rounded-full bg-white/10">
          <div className="h-1 w-2/3 rounded-full" style={{ background: 'var(--rns-brand-gradient)' }} />
        </div>
      </div>
    </aside>
  );
}
