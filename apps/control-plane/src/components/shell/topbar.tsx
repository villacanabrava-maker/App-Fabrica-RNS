import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { UserMenu, type UserMenuProps } from './user-menu';

export function Topbar({ user }: { user: UserMenuProps }) {
  return (
    <header className="flex h-[var(--rns-layout-topbar-height)] shrink-0 items-center justify-between gap-4 border-b border-border-default bg-bg-surface px-4 lg:px-6">
      <GlobalSearch />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu {...user} />
      </div>
    </header>
  );
}
