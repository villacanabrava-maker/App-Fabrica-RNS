import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './icon';

/**
 * 08-DESIGN-SYSTEM-RNS.md §7 — variantes, tamanhos (32/40/48px) e o estado
 * loading (spinner substitui ícone/texto, aria-busy).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-text-on-brand hover:bg-brand-primary-hover',
        secondary: 'bg-bg-surface-elevated border border-border-default text-text-primary hover:bg-border-default',
        outline: 'border border-border-default bg-transparent text-text-primary hover:bg-bg-surface-elevated',
        ghost: 'bg-transparent text-text-primary hover:bg-bg-surface-elevated',
        danger: 'bg-status-danger text-text-on-brand hover:opacity-90',
        link: 'bg-transparent text-brand-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-body-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-body-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Icon name="spinner" size={16} className="animate-spin" />
            <span>Aguarde…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
