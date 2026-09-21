#!/usr/bin/env tsx
/**
 * Varredura de segredos no conteúdo versionado.
 *
 * Percorre todo arquivo rastreado pelo Git (git ls-files — já exclui o que
 * está em .gitignore) e procura os padrões de factory-intelligence/
 * secret-patterns.ts. Roda no CI a cada PR (security.yml) e semanalmente
 * contra o histórico completo (ver nota abaixo).
 *
 * "No histórico" (docs/07-QUALIDADE/02-CI-CD.md) idealmente cobre todos os
 * commits, não só o snapshot atual. Isso pertence a uma ferramenta dedicada
 * (gitleaks/trufflehog) rodando sobre o histórico completo — este script é
 * o scanner do snapshot atual, mais barato e mais rápido, que roda em
 * TODO PR. Adicionar a varredura de histórico completo é trabalho futuro,
 * não fingido aqui.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECRET_PATTERNS } from './secret-patterns';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf',
  '.woff', '.woff2', '.ttf', '.eot', '.zip', '.gz',
]);

interface Finding {
  file: string;
  line: number;
  matched: string;
}

function listTrackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf-8' });
  return out.split('\n').filter((f) => f.length > 0);
}

function hasBinaryExtension(path: string): boolean {
  const dot = path.lastIndexOf('.');
  if (dot === -1) return false;
  return BINARY_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

function scanFile(relPath: string, findings: Finding[]): void {
  if (hasBinaryExtension(relPath)) return;
  // O próprio catálogo de padrões contém os regexes como texto — nunca um
  // "achado" de si mesmo.
  if (relPath === 'scripts/security/secret-patterns.ts') return;

  let content: string;
  try {
    content = readFileSync(join(REPO_ROOT, relPath), 'utf-8');
  } catch {
    return; // arquivo binário não decodificável como utf-8, ou removido entre o ls-files e a leitura
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({ file: relPath, line: i + 1, matched: name });
      }
    }
  }
}

function main(): void {
  const findings: Finding[] = [];
  for (const file of listTrackedFiles()) {
    scanFile(file, findings);
  }

  if (findings.length > 0) {
    console.error(`❌ ${findings.length} possível(is) segredo(s) encontrado(s) no conteúdo versionado:\n`);
    for (const f of findings) {
      console.error(`  ${f.file}:${f.line} — parece ${f.matched}`);
    }
    process.exit(1);
  }

  console.log('✓ Nenhum padrão de segredo encontrado no conteúdo versionado.');
}

main();
