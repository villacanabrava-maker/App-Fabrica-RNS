-- ============================================================
-- 0010 — Seed dos papéis R1–R9
--
-- Espelha factory-intelligence/registry/agents.yaml.
-- Alterações devem vir por migration, nunca por escrita manual.
-- ============================================================

insert into agents.agent_roles
  (id, name, title, description, write_policy, independent_review,
   default_skills, allowed_runtimes, minimum_output)
values
  ('R1','orchestration-intelligence','Orchestration Intelligence',
   'Interpreta a missão, decompõe o trabalho, propõe DAG, owners e sequência. NÃO é o Orchestrator: sugere, não efetiva transições.',
   'read_only', false,
   array['plan-decomposition','dependency-analysis'],
   array['openai','anthropic','mock']::runtime_kind[],
   'agent-output.schema.json'),

  ('R2','architecture','Architecture',
   'Arquitetura, interfaces, ADRs, dependências e trade-offs.',
   'read_only', false,
   array['architecture-review','adr-authoring'],
   array['openai','anthropic','mock']::runtime_kind[],
   'review.schema.json'),

  ('R3','research','Research',
   'Pesquisa técnica externa, versões, documentação oficial e validação de fontes. Único papel com egress de rede ampliado.',
   'read_only', false,
   array['deep-research','source-validation'],
   array['openai','anthropic','mock']::runtime_kind[],
   'evidence.schema.json'),

  ('R4','builder','Builder',
   'Implementação de front-end, back-end e infraestrutura como código.',
   'workspace_write', false,
   array['implementation','ci-repair'],
   array['openai','anthropic','mock']::runtime_kind[],
   'agent-output.schema.json'),

  ('R5','reviewer','Reviewer',
   'Revisão adversarial e cross-model de plano e de código.',
   'read_only', true,
   array['plan-review','code-review'],
   array['openai','anthropic','mock']::runtime_kind[],
   'review.schema.json'),

  ('R6','qa-testing','QA & Testing',
   'Testes, regressões, integração, CI e evals.',
   'test_workspace', true,
   array['test-design','regression-analysis'],
   array['openai','anthropic','mock']::runtime_kind[],
   'evidence.schema.json'),

  ('R7','security-data','Security & Data',
   'AppSec, Supabase, migrations, RLS e secrets. Finding critical bloqueia progresso.',
   'read_only', true,
   array['security-audit','rls-audit','migration-review'],
   array['openai','anthropic','mock']::runtime_kind[],
   'review.schema.json'),

  ('R8','ux-browser-verification','UX & Browser Verification',
   'Verificação no navegador, E2E, UX e acessibilidade. Só inicia com preview pair pronto.',
   'preview_only', false,
   array['browser-validation','accessibility-review'],
   array['openai','anthropic','mock']::runtime_kind[],
   'evidence.schema.json'),

  ('R9','release-evidence','Release & Evidence',
   'Reconcilia evidências, avalia prontidão de release e encerra. Não faz merge nem deploy.',
   'governance_only', false,
   array['evidence-synthesis','release-readiness'],
   array['openai','anthropic','mock']::runtime_kind[],
   'evidence.schema.json')
on conflict (id) do update set
  name             = excluded.name,
  title            = excluded.title,
  description      = excluded.description,
  write_policy     = excluded.write_policy,
  independent_review = excluded.independent_review,
  default_skills   = excluded.default_skills,
  allowed_runtimes = excluded.allowed_runtimes,
  minimum_output   = excluded.minimum_output,
  updated_at       = now();

-- Runtime mock habilitado na Fase 1. Os demais entram na Fase 2.
insert into agents.runtime_profiles (runtime, surface, enabled, config)
values ('mock','deterministic_fixture', true, '{}'::jsonb)
on conflict (runtime, surface) do nothing;

insert into agents.model_profiles (runtime, model_key, enabled, notes)
values ('mock','mock-deterministic', true, 'Fase 1. Sem rede, sem custo.')
on conflict (runtime, model_key) do nothing;
