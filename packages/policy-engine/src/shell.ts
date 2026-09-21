import { matchGlob } from './glob';
import type { ShellPolicy } from './types';

/**
 * Decide se um comando de shell é permitido por um ShellPolicy.
 *
 * Regras, na ordem:
 * 1. deny casa (exato ou glob) → negado, mesmo que allow também case.
 * 2. allow casa exatamente → permitido.
 * 3. allow tem uma entrada de uma palavra só (o nome da ferramenta) que bate
 *    com o primeiro token do comando → permitido (a ferramenta inteira foi
 *    liberada; é o caso de `git`, `npm`, `pnpm` etc. em workspace_write).
 * 4. caso contrário → negado (padrão fechado, igual ao resto do engine).
 */
export function isShellCommandAllowed(command: string, policy: ShellPolicy | undefined): boolean {
  if (!policy) return false;

  const trimmed = command.trim();
  if (trimmed.length === 0) return false;

  const deniedMatch = policy.deny.some((entry) => matchGlob(entry, trimmed));
  if (deniedMatch) return false;

  if (policy.allow.includes(trimmed)) return true;

  const firstToken = trimmed.split(/\s+/)[0];
  const wholeToolAllowed = policy.allow.some((entry) => !entry.includes(' ') && entry === firstToken);
  return wholeToolAllowed;
}
