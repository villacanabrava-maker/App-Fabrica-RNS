'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Icon } from '@rns/design-system';
import { signOut } from '@/server/actions/auth';

export interface UserMenuProps {
  fullName: string | null;
  email: string;
  role: string;
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  engineer: 'Engineer',
  viewer: 'Viewer',
};

/**
 * 02-ARQUITETURA-FRONTEND.md §4 — UserMenu: avatar com iniciais, nome,
 * papel. Menu: Perfil, Configurações, Trocar organização, Tema, Sair.
 * "Trocar organização" e "Perfil" dedicado ficam para quando existir mais
 * de uma organização por usuário na UI (fora do escopo do Sprint 1.2).
 */
export function UserMenu({ fullName, email, role }: UserMenuProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-surface-elevated"
        aria-label={`Menu do usuário, ${fullName ?? email}, papel ${ROLE_LABEL[role] ?? role}`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-body-sm font-semibold text-text-on-brand">
          {initials(fullName, email)}
        </span>
        <span className="hidden flex-col items-start text-left md:flex">
          <span className="text-body-sm font-medium text-text-primary">{fullName ?? email}</span>
          <span className="text-caption text-text-muted">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <Icon name="chevron-down" size={16} className="text-text-muted" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup className="min-w-56 rounded-lg border border-border-default bg-bg-surface p-1 shadow-lg">
            <Menu.Item
              render={<Link href="/configuracoes" />}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-text-primary data-[highlighted]:bg-bg-surface-elevated"
            >
              <Icon name="settings" size={16} />
              Configurações
            </Menu.Item>
            <Menu.Item
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-text-primary data-[highlighted]:bg-bg-surface-elevated"
            >
              <Icon name={theme === 'dark' ? 'eye' : 'eye-off'} size={16} />
              Tema {theme === 'dark' ? 'claro' : 'escuro'}
            </Menu.Item>
            <div className="my-1 h-px bg-border-default" />
            <form action={signOut}>
              <Menu.Item
                render={<button type="submit" className="w-full" />}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm text-status-danger data-[highlighted]:bg-status-danger/10"
              >
                <Icon name="log-out" size={16} />
                Sair
              </Menu.Item>
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
