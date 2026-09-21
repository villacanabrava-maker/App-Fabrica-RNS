import type { StorybookConfig } from '@storybook/nextjs';

/**
 * Sprint 1.2 — Storybook cobre só os primitivos do design system mínimo
 * (@rns/design-system). Páginas reais (auth, shell, Configurações) dependem
 * de sessão/Supabase e ficam fora do escopo de Storybook por ora.
 *
 * Stories vivem em `src/stories/` (não em `packages/design-system/`) de
 * propósito: design-system é um pacote "puro" (sem devDependency de
 * ferramentas de app, mesmo padrão do Sprint 1.1) — quem depende de
 * Storybook é o app, não o pacote.
 */
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};

export default config;
