/**
 * Único ponto de validação de destino pós-autenticação (`next`).
 *
 * Aceita SOMENTE caminho interno da própria aplicação. Qualquer outra coisa
 * volta para `fallback`. Usado por signInWithPassword, signInWithGitHub,
 * /auth/callback e pela página de login — não duplicar esta lógica.
 *
 * O que NÃO é caminho interno (open redirect):
 * - `//evil.com` e `/\evil.com`: navegadores tratam como host (protocol-relative);
 * - `https://evil.com`, `javascript:...`, `dashboard` (sem "/" inicial);
 * - caracteres de controle e "\": navegadores removem \t \n \r e normalizam "\"
 *   para "/", o que reabriria `//` (ex.: "/\t/evil.com").
 */
export function sanitizeRedirectPath(input: unknown, fallback: string = '/'): string {
  if (typeof input !== 'string' || input.length === 0) return fallback;
  if (input[0] !== '/' || input[1] === '/' || input[1] === '\\') return fallback;

  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || ch === '\\') return fallback;
  }

  // Defesa em profundidade: resolvido contra uma origem fictícia, o destino precisa continuar nela.
  const base = 'http://internal.invalid';
  try {
    if (new URL(input, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }

  return input;
}
