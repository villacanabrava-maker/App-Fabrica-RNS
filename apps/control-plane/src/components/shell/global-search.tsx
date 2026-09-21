'use client';

import { Dialog } from '@base-ui/react/dialog';
import { useEffect, useState } from 'react';
import { Icon } from '@rns/design-system';

/**
 * 10-TELAS-TRANSVERSAIS.md §F — busca federada. Sem índice de projetos/
 * agentes/templates ainda (chegam nos Sprints 1.3+), então o modal abre e
 * funciona (atalhos, foco, fechamento), mas mostra o vazio real — não uma
 * lista inventada.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex w-full max-w-md items-center gap-2 rounded-md border border-border-default bg-bg-surface px-3 py-2 text-body-sm text-text-muted hover:border-border-strong">
        <Icon name="search" size={16} />
        Buscar projetos, agentes, templates...
        <kbd className="ml-auto rounded border border-border-default px-1.5 py-0.5 text-caption">⌘K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup
          role="combobox"
          aria-expanded={open}
          className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border border-border-default bg-bg-surface p-2 shadow-lg"
        >
          <Dialog.Title className="sr-only">Busca global</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border-default px-2 pb-2">
            <Icon name="search" size={16} className="text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar projetos, agentes, templates, documentos, execuções..."
              className="w-full bg-transparent text-body text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <p className="px-2 py-6 text-center text-body-sm text-text-muted">
            Comece a digitar. A busca cobre os dados dos próximos sprints (Projetos, Agentes, Templates).
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
