import type { ReactNode } from 'react';
import { Icon, type IconName } from './icon';
import { cn } from './cn';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * 02-ARQUITETURA-FRONTEND.md §6 — Empty: ícone/ilustração + frase
 * explicativa + ação primária que resolve o vazio.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-bg-surface-elevated">
        <Icon name={icon} size={24} className="text-text-muted" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-h3 font-semibold text-text-primary">{title}</p>
        {description ? <p className="text-body-sm text-text-muted max-w-sm">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
