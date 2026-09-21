'use client';

import { Popover } from '@base-ui/react/popover';
import { Icon } from '@rns/design-system';

/**
 * 10-TELAS-TRANSVERSAIS.md §E — painel de notificações agrupado. Sem
 * tabela de notificações ainda (Sprint 1.8+ / human gates), então o badge
 * fica em 0 e o painel mostra o vazio real.
 */
export function NotificationBell() {
  const unreadCount = 0;

  return (
    <Popover.Root>
      <Popover.Trigger
        className="relative flex size-9 items-center justify-center rounded-md hover:bg-bg-surface-elevated"
        aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
      >
        <Icon name="bell" size={20} className="text-text-secondary" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup
            role="region"
            aria-label="Notificações"
            className="w-80 rounded-lg border border-border-default bg-bg-surface p-4 shadow-lg"
          >
            <Popover.Title className="text-body-sm font-semibold text-text-primary">Notificações</Popover.Title>
            <p className="mt-4 text-center text-body-sm text-text-muted">Nenhuma notificação por aqui ainda.</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
