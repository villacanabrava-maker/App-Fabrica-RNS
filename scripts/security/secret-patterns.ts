/**
 * Padrões de segredo compartilhados entre scripts/check-public-env.ts e
 * scripts/security/scan-secrets.ts. Um único lugar para adicionar um novo
 * padrão quando um novo provedor entrar (GitHub App, Vercel, ...).
 */
export interface SecretPattern {
  name: string;
  pattern: RegExp;
}

export const SECRET_PATTERNS: readonly SecretPattern[] = [
  { name: 'OpenAI API key', pattern: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key PEM', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Supabase secret key', pattern: /sb_secret_[a-zA-Z0-9_-]{10,}/ },
  { name: 'GitHub token', pattern: /gh[pousr]_[a-zA-Z0-9]{20,}/ },
];
