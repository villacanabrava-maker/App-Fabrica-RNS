/**
 * Casador de glob mínimo, sem dependência externa.
 * Suporta o vocabulário usado em factory-intelligence/registry/permissions.yaml:
 *   **   qualquer coisa, incluindo separadores
 *   *    qualquer coisa dentro de um segmento (sem cruzar espaço/barra)
 * Suficiente para os padrões reais do registry; não é um glob completo.
 */
function globToRegExp(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      out += '.*';
      i++;
    } else if (ch === '*') {
      out += '[^/\\s]*';
    } else if ('.+^${}()|[]\\'.includes(ch ?? '')) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return new RegExp(`^${out}$`);
}

export function matchGlob(pattern: string, value: string): boolean {
  return globToRegExp(pattern).test(value);
}
