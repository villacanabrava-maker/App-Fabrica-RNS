/**
 * Gera apps/control-plane/src/app/tokens.css a partir de design-system/tokens.json.
 *
 * Roda sob demanda (não em build), porque tokens.json muda raramente:
 *   pnpm tsx scripts/design-system/build-tokens-css.ts
 *
 * Resolve referências "{a.b.c}" e emite:
 *   :root                              — tokens sem variação de tema + semânticos claros
 *   [data-theme="dark"]                — semânticos escuros (override explícito)
 *   @media (prefers-color-scheme:dark) — semânticos escuros quando não há override
 *   @theme inline                      — mapeia para o namespace do Tailwind v4, para que
 *                                         bg-bg-app, text-text-primary etc. sejam gerados
 *
 * @theme inline (não @theme puro) é obrigatório aqui: as variáveis referenciadas mudam em
 * runtime por [data-theme], e "inline" instrui o Tailwind a não resolvê-las estaticamente
 * no build. Confirmado lendo o parser de modificadores de @theme em
 * node_modules/.pnpm/tailwindcss@4.3.3/node_modules/tailwindcss/dist/lib.js (aceita
 * "reference" | "inline" | "default" | "static") — a documentação oficial
 * (tailwindcss.com, ui.shadcn.com) está bloqueada pelo proxy de egress deste ambiente.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type TokenNode = Record<string, unknown>;

const ROOT = resolve(import.meta.dirname, '../..');
const TOKENS_PATH = resolve(ROOT, 'design-system/tokens.json');
const OUT_PATH = resolve(ROOT, 'apps/control-plane/src/app/tokens.css');

const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf-8')) as TokenNode;

function get(path: string): unknown {
  const parts = path.split('.');
  let node: unknown = tokens;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as TokenNode)[part];
  }
  return node;
}

function resolveValue(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`Valor de token não é string resolvível: ${JSON.stringify(value)}`);
  }
  const match = value.match(/^\{([^}]+)\}$/);
  if (!match) return value;
  const refPath = match[1] as string;
  const target = get(refPath) as TokenNode | undefined;
  if (!target) throw new Error(`Referência de token não encontrada: ${refPath}`);
  if ('$value' in target) return resolveValue(target.$value);
  throw new Error(`Referência de token sem $value: ${refPath}`);
}

interface CssVar {
  name: string;
  value: string;
}

const rootStatic: CssVar[] = [];
const rootLight: CssVar[] = [];
const dark: CssVar[] = [];
const themeInline: CssVar[] = [];

function kebab(...parts: string[]): string {
  return parts.join('-');
}

// ---------- primitivos usados diretamente (radius, duration) ----------
for (const [name, node] of Object.entries(tokens.primitive as TokenNode)) {
  if (typeof node !== 'object' || node === null) continue;
  if ('$value' in (node as TokenNode)) continue; // ex.: primitive.color.ink, tratado à parte
  for (const [key, leaf] of Object.entries(node as TokenNode)) {
    if (typeof leaf !== 'object' || leaf === null || !('$value' in (leaf as TokenNode))) continue;
    if (name === 'color') continue; // cores primitivas não viram var direta — só via semantic/brand
    const varName = `--rns-${name}-${key}`;
    rootStatic.push({ name: varName, value: resolveValue((leaf as TokenNode).$value) });
    if (name === 'radius') themeInline.push({ name: `--radius-${key}`, value: `var(${varName})` });
    // duration não tem namespace --duration-* no Tailwind v4 (confirmado em theme.css do
    // pacote instalado — só existe --default-transition-duration). Fica só em :root, para
    // uso via CSS arbitrário (duration-[var(--rns-duration-fast)]), sem entrar no @theme.
  }
}

// ---------- brand ----------
for (const [key, node] of Object.entries(tokens.brand as TokenNode)) {
  if (key.startsWith('$') || typeof node !== 'object' || node === null) continue;
  const varName = `--rns-brand-${key}`;
  rootStatic.push({ name: varName, value: resolveValue((node as TokenNode).$value) });
  themeInline.push({ name: `--color-brand-${key}`, value: `var(${varName})` });
}

// ---------- semantic (claro/escuro) ----------
function walkSemantic(node: TokenNode, path: string[]): void {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
    const childNode = child as TokenNode;
    const nextPath = [...path, key];
    if ('light' in childNode && 'dark' in childNode) {
      const varName = `--rns-${nextPath.join('-')}`;
      rootLight.push({ name: varName, value: resolveValue(childNode.light) });
      dark.push({ name: varName, value: resolveValue(childNode.dark) });
      themeInline.push({ name: `--color-${nextPath.join('-')}`, value: `var(${varName})` });
    } else if ('$value' in childNode) {
      const varName = `--rns-${nextPath.join('-')}`;
      rootStatic.push({ name: varName, value: resolveValue(childNode.$value) });
      themeInline.push({ name: `--color-${nextPath.join('-')}`, value: `var(${varName})` });
    } else {
      walkSemantic(childNode, nextPath);
    }
  }
}
walkSemantic(tokens.semantic as TokenNode, []);

// ---------- component.layout (dimensões de layout do shell) ----------
const layout = (tokens.component as TokenNode).layout as TokenNode;
for (const [key, leaf] of Object.entries(layout)) {
  if (typeof leaf !== 'object' || leaf === null || !('$value' in (leaf as TokenNode))) continue;
  rootStatic.push({ name: `--rns-layout-${key}`, value: resolveValue((leaf as TokenNode).$value) });
}

// ---------- component.run.status / component.review.finding ----------
function walkComponentColor(node: TokenNode, path: string[]): void {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$') || typeof child !== 'object' || child === null) continue;
    const childNode = child as TokenNode;
    if ('$value' in childNode) {
      const varName = `--rns-${path.concat(key).join('-')}`;
      rootStatic.push({ name: varName, value: resolveValue(childNode.$value) });
    } else {
      walkComponentColor(childNode, [...path, key]);
    }
  }
}
walkComponentColor((tokens.component as TokenNode).run as TokenNode, ['run']);
walkComponentColor((tokens.component as TokenNode).review as TokenNode, ['review']);

// ---------- typography.family ----------
const family = (tokens.typography as TokenNode).family as TokenNode;
for (const [key, leaf] of Object.entries(family)) {
  if (typeof leaf !== 'object' || leaf === null || !('$value' in (leaf as TokenNode))) continue;
  rootStatic.push({ name: `--rns-font-${key}`, value: resolveValue((leaf as TokenNode).$value) });
}

// ---------- typography.scale -> namespace --text-* do Tailwind v4 (tamanho + line-height
// pareados via sufixo "--line-height", confirmado em theme.css do pacote instalado) ----------
const scale = (tokens.typography as TokenNode).scale as TokenNode;
for (const [key, leaf] of Object.entries(scale)) {
  const entry = leaf as { size: string; lineHeight: string; weight: number };
  themeInline.push({ name: `--text-${key}`, value: entry.size });
  themeInline.push({ name: `--text-${key}--line-height`, value: entry.lineHeight });
}

function block(selector: string, vars: CssVar[]): string {
  const lines = vars.map((v) => `  ${v.name}: ${v.value};`).join('\n');
  return `${selector} {\n${lines}\n}`;
}

const output = `/**
 * GERADO — não editar à mão.
 * Fonte: design-system/tokens.json
 * Regenerar: pnpm tsx scripts/design-system/build-tokens-css.ts
 */

${block(':root', [...rootStatic, ...rootLight])}

@media (prefers-color-scheme: dark) {
${block(':root:not([data-theme="light"])', dark).replace(/^/gm, '  ').trimStart()}
}

${block('[data-theme="dark"]', dark)}

@theme inline {
${themeInline.map((v) => `  ${v.name}: ${v.value};`).join('\n')}
  --font-sans: var(--rns-font-sans);
  --font-mono: var(--rns-font-mono);
}
`;

writeFileSync(OUT_PATH, output, 'utf-8');
console.log(`Gerado: ${OUT_PATH}`);
