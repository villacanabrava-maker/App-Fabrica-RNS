import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-body text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-status-danger aria-invalid:ring-status-danger',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
