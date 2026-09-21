import type { IconName } from '@rns/design-system';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** 02-ARQUITETURA-FRONTEND.md §4.1 — frase do card motivacional por página. */
  motivation: string;
}

/** Os nove itens fixos da AppSidebar, na ordem documentada. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Início', icon: 'home', motivation: 'Transformando ideias em soluções reais com IA.' },
  { href: '/projetos', label: 'Projetos', icon: 'projects', motivation: 'Construindo o futuro com agentes de IA.' },
  { href: '/agentes', label: 'Agentes', icon: 'agents', motivation: 'Inteligência que constrói o futuro.' },
  {
    href: '/orquestracao',
    label: 'Orquestração',
    icon: 'orchestration',
    motivation: 'Orquestre agentes. Automatize processos. Multiplique resultados.',
  },
  {
    href: '/conhecimento',
    label: 'Base de Conhecimento',
    icon: 'knowledge',
    motivation: 'Conhecimento que multiplica resultados.',
  },
  { href: '/templates', label: 'Templates', icon: 'templates', motivation: 'Templates prontos para grandes ideias.' },
  {
    href: '/integracoes',
    label: 'Integrações',
    icon: 'integrations',
    motivation: 'Conecte suas ferramentas e multiplique o potencial da sua equipe.',
  },
  {
    href: '/monitoramento',
    label: 'Monitoramento',
    icon: 'monitoring',
    motivation: 'Visibilidade total para decisões mais inteligentes.',
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: 'settings',
    motivation: 'Configure hoje um futuro mais produtivo.',
  },
] as const;

export function motivationFor(pathname: string): string {
  const match = [...NAV_ITEMS].reverse().find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)));
  return match?.motivation ?? NAV_ITEMS[0].motivation;
}
