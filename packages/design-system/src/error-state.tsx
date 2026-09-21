import { Icon } from './icon';
import { Button } from './button';
import { cn } from './cn';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** ID correlacionável exibido para suporte, conforme 02-ARQUITETURA-FRONTEND.md §6. */
  correlationId?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * 02-ARQUITETURA-FRONTEND.md §6 — Error: mensagem humana + o que fazer +
 * "Tentar novamente" + código correlacionável.
 */
export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar esta informação. Tente novamente em instantes.',
  correlationId,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)} role="alert">
      <div className="flex size-12 items-center justify-center rounded-full bg-status-danger/10">
        <Icon name="alert" size={24} className="text-status-danger" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-h3 font-semibold text-text-primary">{title}</p>
        <p className="text-body-sm text-text-muted max-w-sm">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <Icon name="refresh" size={16} />
          Tentar novamente
        </Button>
      ) : null}
      {correlationId ? (
        <p className="text-caption text-text-muted font-mono mt-1">ID: {correlationId}</p>
      ) : null}
    </div>
  );
}
