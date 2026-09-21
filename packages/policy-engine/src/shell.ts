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
 * ★ Achado do fiscal (revalidação 2026-09-21, item 4): o atalho "ferramenta
 * liberada por inteiro" (passo 3, abaixo) tratava `node`, `npm`, `pnpm` e
 * `npx` como qualquer outra ferramenta liberada por primeiro token — mas
 * essas quatro têm, embutida, uma forma de executar código arbitrário sem
 * nenhum metacaractere de shell: `node -e/--eval/-p/--print "<js>"`,
 * `npm exec`/`npm x <pacote>`, `pnpm exec`/`pnpm dlx <pacote>`, `npx
 * <pacote>`. Nada disso contém `;`, `|`, `$()` etc., então passava pelo
 * check de metacaracteres e, com o primeiro token liberado por inteiro,
 * o comando inteiro era permitido — execução de código/pacote arbitrário
 * sem nunca usar um metacaractere de shell.
 *
 * Corrigido por capability/subcomando, não por lista de flags a manter:
 * para estas quatro ferramentas, o atalho do passo 3 nega os argumentos
 * que dão a elas capacidade de rodar código ou pacotes fora do que já
 * está no workspace (eval inline; `exec`/`x`/`dlx`, que são o mesmo
 * mecanismo do `npx`; qualquer argumento do `npx`, cuja função inteira é
 * baixar e rodar um pacote arbitrário). Instalar dependências, rodar
 * scripts do `package.json` (`npm run`, `pnpm build` etc.) e rodar um
 * arquivo já existente no workspace (`node script.js`) continuam liberados
 * pelo atalho — não é o vetor reportado.
 */
const GENERIC_EXECUTORS = new Set(['node', 'npm', 'npx', 'pnpm']);

function isDangerousGenericExecutorInvocation(firstToken: string, args: readonly string[]): boolean {
  switch (firstToken) {
    case 'node':
      return args.some(
        (a) => a === '-e' || a === '--eval' || a.startsWith('--eval=') || a === '-p' || a === '--print' || a.startsWith('--print='),
      );
    case 'npm':
      // `npm exec` e seu alias `npm x` rodam um pacote arbitrário — o mesmo mecanismo do `npx`.
      return args[0] === 'exec' || args[0] === 'x';
    case 'pnpm':
      // `pnpm exec` roda um bin do workspace; `pnpm dlx` baixa e roda um pacote arbitrário — tratamos os dois como perigosos por serem o mesmo mecanismo do `npx`.
      return args[0] === 'exec' || args[0] === 'dlx';
    case 'npx':
      // A função inteira do npx é baixar/rodar um pacote arbitrário — só a invocação sem argumento (help/no-op) é inofensiva.
      return args.length > 0;
    default:
      return false;
  }
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
 *    primeiro token do comando, E (se a ferramenta for `node`/`npm`/
 *    `npm`/`pnpm`/`npx`) os argumentos não dão a ela capacidade de
 *    executor genérico (ver `isDangerousGenericExecutorInvocation`)
 *    → permitido. É o caso de `git`, `npm install`, `pnpm build` etc. em
 *    workspace_write. Com metacaracteres, este atalho nunca se aplica: um
 *    comando composto só passa se bater exatamente com uma entrada
 *    explícita do allow-list.
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

  const tokens = trimmed.split(/\s+/);
  // trimmed é não vazio (checado acima) e \s+ nunca produz um array vazio.
  const firstToken = tokens[0] ?? '';
  const wholeToolAllowed = policy.allow.some((entry) => !entry.includes(' ') && entry === firstToken);
  if (!wholeToolAllowed) return false;

  if (GENERIC_EXECUTORS.has(firstToken) && isDangerousGenericExecutorInvocation(firstToken, tokens.slice(1))) {
    return false;
  }

  return true;
}
