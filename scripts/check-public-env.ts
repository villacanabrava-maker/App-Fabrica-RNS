#!/usr/bin/env tsx
/**
 * Verifica que nenhum segredo real chegou a uma variável pública.
 *
 * "Pública" aqui significa: qualquer variável com prefixo NEXT_PUBLIC_,
 * porque o Next.js embute o VALOR dessas variáveis no bundle enviado ao
 * navegador em tempo de build — ver docs/05-SEGURANCA/01-MODELO-DE-SEGURANCA.md
 * §5 (baseline de segurança) e §14 (checklist: "CI falha ao detectar
 * segredo em variável pública").
 *
 * Duas fontes checadas:
 *   1. Todo arquivo .env* versionado no repositório (não deveria existir
 *      nenhum com valor real — .gitignore já bloqueia .env/.env.local, mas
 *      isso confere .env.example e qualquer exceção).
 *   2. As variáveis NEXT_PUBLIC_* atualmente carregadas em process.env —
 *      é o que protege o CI de verdade quando os secrets do GitHub Actions
 *      são injetados por engano num nome com esse prefixo.
 *
 * Saída de chave sb_publishable_ é sempre permitida — é, por definição,
 * a chave feita para ir ao navegador.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SECRET_PATTERNS } from './security/secret-patterns';

const REPO_ROOT = join(import.meta.dirname, '..');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage']);

interface Finding {
  source: string;
  key: string;
  matched: string;
}

function findEnvFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      findEnvFiles(full, out);
    } else if (/^\.env(\..+)?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function checkValue(source: string, key: string, value: string, findings: Finding[]): void {
  if (!key.startsWith('NEXT_PUBLIC_')) return;
  if (value.trim().length === 0) return;
  for (const { name, pattern } of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      findings.push({ source, key, matched: name });
    }
  }
}

function checkEnvFile(path: string, findings: Finding[]): void {
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    checkValue(relative(REPO_ROOT, path), key, value, findings);
  }
}

function checkProcessEnv(findings: Finding[]): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    checkValue('process.env', key, value, findings);
  }
}

function main(): void {
  const findings: Finding[] = [];

  for (const path of findEnvFiles(REPO_ROOT)) {
    checkEnvFile(path, findings);
  }
  checkProcessEnv(findings);

  if (findings.length > 0) {
    console.error('❌ Segredo encontrado em variável pública (NEXT_PUBLIC_*):\n');
    for (const f of findings) {
      console.error(`  ${f.source} :: ${f.key} — parece ${f.matched}`);
    }
    console.error(
      '\nUma variável NEXT_PUBLIC_* é embutida no bundle do navegador. ' +
        'Só a chave sb_publishable_ (ou equivalente já feita para o cliente) pode ir aqui.',
    );
    process.exit(1);
  }

  console.log('✓ Nenhum segredo encontrado em variável pública.');
}

main();
