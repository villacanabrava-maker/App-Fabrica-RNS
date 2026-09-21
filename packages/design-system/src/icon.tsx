import {
  Activity,
  ArrowLeft,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
  Folder,
  GitBranch,
  GitCommit,
  GitCompare,
  GitPullRequest,
  Home,
  Inbox,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  Lock,
  LockOpen,
  LogOut,
  MoreHorizontal,
  Network,
  Pause,
  Pencil,
  Play,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Share2,
  Shield,
  Square,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Único ponto de ícones do produto (02-ARQUITETURA-FRONTEND.md §7): nenhum
 * SVG solto em página, tudo passa por <Icon name="..." />. Nomes seguem
 * exatamente o union documentado. Verificados contra as exportações reais de
 * lucide-react@1.47.0 (node_modules — a documentação online estava fora do
 * escopo de rede permitido neste ambiente).
 *
 * Logotipos de terceiros (github, supabase, vercel, openai, anthropic,
 * antigravity, slack) NÃO estão aqui — lucide-react não os inclui, e a regra
 * do design system é que fiquem em `brand/` como SVG próprio, com uso de
 * marca respeitado. Entram no sprint que primeiro precisa deles (Sprint 1.9,
 * integração GitHub) — não fabricados agora para não fingir um asset que não
 * existe.
 */
export type IconName =
  // navegação
  | 'home'
  | 'projects'
  | 'agents'
  | 'orchestration'
  | 'knowledge'
  | 'templates'
  | 'integrations'
  | 'monitoring'
  | 'settings'
  // ações
  | 'plus'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'more'
  | 'edit'
  | 'trash'
  | 'copy'
  | 'download'
  | 'upload'
  | 'external'
  | 'share'
  | 'play'
  | 'pause'
  | 'stop'
  | 'log-out'
  | 'arrow-left'
  | 'chevron-down'
  | 'chevron-right'
  | 'eye'
  | 'eye-off'
  | 'rotate'
  // estado
  | 'check'
  | 'check-circle'
  | 'x'
  | 'alert'
  | 'alert-circle'
  | 'info'
  | 'clock'
  | 'spinner'
  | 'lock'
  | 'unlock'
  | 'shield'
  | 'bell'
  | 'user'
  | 'users'
  | 'building'
  | 'folder'
  | 'inbox'
  // domínio
  | 'branch'
  | 'commit'
  | 'pull-request'
  | 'compare'
  | 'database'
  | 'deploy'
  | 'review'
  | 'approval'
  | 'evidence'
  | 'workflow'
  | 'puzzle'
  | 'network';

const REGISTRY: Record<IconName, LucideIcon> = {
  home: Home,
  projects: LayoutGrid,
  agents: Puzzle,
  orchestration: Workflow,
  knowledge: BookOpen,
  templates: LayoutDashboard,
  integrations: Network,
  monitoring: Activity,
  settings: Settings,
  plus: Plus,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  more: MoreHorizontal,
  edit: Pencil,
  trash: Trash2,
  copy: Copy,
  download: Download,
  upload: Upload,
  external: ExternalLink,
  share: Share2,
  play: Play,
  pause: Pause,
  stop: Square,
  'log-out': LogOut,
  'arrow-left': ArrowLeft,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  eye: Eye,
  'eye-off': EyeOff,
  rotate: RotateCcw,
  check: Check,
  'check-circle': CheckCircle2,
  x: X,
  alert: TriangleAlert,
  'alert-circle': CircleAlert,
  info: Info,
  clock: Clock,
  spinner: Loader2,
  lock: Lock,
  unlock: LockOpen,
  shield: Shield,
  bell: Bell,
  user: User,
  users: Users,
  building: Building2,
  folder: Folder,
  inbox: Inbox,
  branch: GitBranch,
  commit: GitCommit,
  'pull-request': GitPullRequest,
  compare: GitCompare,
  database: Database,
  deploy: Rocket,
  review: GitCompare,
  approval: ClipboardCheck,
  evidence: ScrollText,
  workflow: Workflow,
  puzzle: Puzzle,
  network: Network,
};

export const ICON_SIZES = [16, 20, 24, 32, 48] as const;
export type IconSize = (typeof ICON_SIZES)[number];

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Ícone decorativo (padrão) → aria-hidden. Se for a única informação de um controle, passe um label. */
  label?: string;
}

export function Icon({ name, size = 20, className, label }: IconProps) {
  const Component = REGISTRY[name];
  if (label) {
    return <Component size={size} className={className} role="img" aria-label={label} />;
  }
  return <Component size={size} className={className} aria-hidden="true" />;
}
