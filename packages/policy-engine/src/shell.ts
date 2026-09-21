import { matchGlob } from './glob';
import type { ShellPolicy } from './types';

/**
 * Caracteres que um shell real (bash) trata como operadores, não como
 * parte de um argumento: separador de comando, pipe, substituição de
 * comando, redirecionamento, quebra de linha. Qualquer um presente no
 * comando significa que "o primeiro token é uma ferramenta liberada"
 * NÃO é suficiente — o resto da string pode ser um comando diferente.
 *
 * ★ Achado do fiscal: `isShellCommandAllowed` liberava a string inteira
 * quando o PRIMEIRO token batia com uma ferramenta liberada por inteiro
 * (ex.: `git`), mesmo que o resto da string fosse `; rm -rf /`. O check
 * de deny rodava contra a string INTEIRA (glob ancorado em ^...$), então
 * `rm -rf /` isolado nunca casava com `git status; rm -rf /` e o
 * comando passava.
 */
const SHELL_METACHARACTERS = /[;&|<>$`\n\r]/;

function hasShellMetacharacters(command: string): boolean {
  return SHELL_METACHARACTERS.test(command);
}

/**
 * Decide se um comando de shell é permitido por um ShellPolicy.
 *
 * Regras, na ordem:
 * 1. deny casa (exato ou glob) → negado, mesmo que allow também case.
 * 2. allow casa exatamente (a string inteira, sem metacaracteres extras
 *    que o allow-list não previu) → permitido.
 * 3. SE o comando não contém metacaracteres de shell, allow tem uma
 *    entrada de uma palavra só (o nome da ferramenta) que bate com o
 *    primeiro (e único) token do comando → permitido — é o caso de
 *    `git`, `npm`, `pnpm` etc. em workspace_write. Com metacaracteres,
 *    este atalho nunca se aplica: um comando composto só passa se
 *    baterem exatamente com uma entrada explícita do allow-list.
 * 4. caso contrário → negado (padrão fechado, igual ao resto do engine).
 */
export function isShellCommandAllowed(command: string, policy: ShellPolicy | undefined): boolean {
  if (!policy) return false;

  const trimmed = command.trim();
  if (trimmed.length === 0) return false;

  const deniedMatch = policy.deny.some((entry) => matchGlob(entry, trimmed));
  if (deniedMatch) return false;

  if (policy.allow.includes(trimmed)) return true;

  if (hasShellMetacharacters(trimmed)) return false;

  const firstToken = trimmed.split(/\s+/)[0];
  const wholeToolAllowed = policy.allow.some((entry) => !entry.includes(' ') && entry === firstToken);
  return wholeToolAllowed;
}
