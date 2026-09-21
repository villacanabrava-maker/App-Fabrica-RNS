import { cn } from './cn';
import { Icon, type IconName } from './icon';

/**
 * 08-DESIGN-SYSTEM-RNS.md §7 — mapeamento canônico. Cor nunca é o único
 * portador de significado: ícone + rótulo textual sempre presentes.
 *
 * ★ As classes de cor de cada estado são escritas por extenso (não
 * interpoladas com template string) de propósito: o scanner do Tailwind
 * analisa o código-fonte estaticamente e não resolve `text-${var}` — uma
 * classe montada em runtime nunca é gerada no CSS final.
 */
export type StatusPillState =
  | 'running'
  | 'succeeded'
  | 'completed'
  | 'failed'
  | 'awaiting_human'
  | 'blocked'
  | 'cancelled'
  | 'queued'
  | 'pending'
  | 'in_review';

interface StatusEntry {
  icon: IconName;
  label: string;
  spin?: boolean;
  classes: string;
}

const STATE_MAP: Record<StatusPillState, StatusEntry> = {
  running: {
    icon: 'spinner',
    label: 'Em execução',
    spin: true,
    classes: 'text-status-info border-status-info/30 bg-status-info/10',
  },
  succeeded: {
    icon: 'check',
    label: 'Concluído',
    classes: 'text-status-success border-status-success/30 bg-status-success/10',
  },
  completed: {
    icon: 'check',
    label: 'Concluído',
    classes: 'text-status-success border-status-success/30 bg-status-success/10',
  },
  failed: {
    icon: 'alert',
    label: 'Erro',
    classes: 'text-status-danger border-status-danger/30 bg-status-danger/10',
  },
  awaiting_human: {
    icon: 'clock',
    label: 'Aguardando você',
    classes: 'text-status-warning border-status-warning/30 bg-status-warning/10',
  },
  blocked: {
    icon: 'lock',
    label: 'Bloqueado',
    classes: 'text-status-critical border-status-critical/30 bg-status-critical/10',
  },
  cancelled: {
    icon: 'x',
    label: 'Cancelado',
    classes: 'text-status-neutral border-status-neutral/30 bg-status-neutral/10',
  },
  queued: {
    icon: 'clock',
    label: 'Aguardando',
    classes: 'text-status-neutral border-status-neutral/30 bg-status-neutral/10',
  },
  pending: {
    icon: 'clock',
    label: 'Aguardando',
    classes: 'text-status-neutral border-status-neutral/30 bg-status-neutral/10',
  },
  in_review: {
    icon: 'review',
    label: 'Em revisão',
    classes: 'text-status-warning border-status-warning/30 bg-status-warning/10',
  },
};

export interface StatusPillProps {
  state: StatusPillState;
  /** Sobrescreve o rótulo padrão, mantendo cor e ícone do estado. */
  label?: string;
  className?: string;
}

export function StatusPill({ state, label, className }: StatusPillProps) {
  const entry = STATE_MAP[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium',
        entry.classes,
        className,
      )}
    >
      <Icon name={entry.icon} size={16} {...(entry.spin ? { className: 'animate-spin' } : {})} />
      <span>{label ?? entry.label}</span>
    </span>
  );
}
