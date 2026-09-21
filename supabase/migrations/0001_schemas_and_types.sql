-- ============================================================
-- 0001 — Schemas e tipos enumerados
-- Fábrica Apps RNS — Factory Supabase
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Separação de superfície: só o que precisa chegar ao cliente
-- é exposto pela Data API.
create schema if not exists api;
create schema if not exists factory;
create schema if not exists workflow;
create schema if not exists agents;
create schema if not exists review;
create schema if not exists governance;
create schema if not exists integration;

-- ---------- Identidade e produto ----------
create type membership_role as enum ('owner','admin','engineer','viewer');
create type app_status as enum ('planning','in_progress','in_review','paused','completed','archived');
create type spec_status as enum ('draft','under_review','approved','superseded');
create type environment_kind as enum ('preview','staging','production');

-- ---------- Planejamento ----------
create type mission_status as enum ('draft','planning','under_review','approved','executing','completed','blocked','cancelled');
create type version_status as enum ('draft','in_review','approved','rejected','superseded');
create type stage_status as enum ('pending','ready','executing','reviewing','awaiting_human','approved','blocked','completed','cancelled');

-- ---------- Trabalho ----------
create type task_kind as enum ('plan','implement','review','test','security','browser','release','research');
create type task_state as enum (
  'created','ready','queued','leased','running','artifact_ready','reviewing',
  'awaiting_checks','awaiting_human','approved','completed',
  'changes_required','failed_retryable','failed_terminal','rejected',
  'revision_required','blocked','blocked_budget','cancelled','superseded');
create type job_state as enum ('queued','leased','running','succeeded','failed','dead');

-- ---------- Atores e agentes ----------
create type actor_kind as enum ('human','agent','system','integration');
create type runtime_kind as enum ('openai','anthropic','antigravity','deterministic','mock');
create type write_policy as enum ('read_only','workspace_write','test_workspace','preview_only','governance_only');
create type run_state as enum ('pending','running','succeeded','failed','cancelled','blocked');

-- ---------- Revisão ----------
create type review_subject as enum ('mission_version','stage','task','pull_request');
create type cycle_status as enum ('open','awaiting_human','closed','superseded','blocked');
create type review_verdict as enum ('APPROVE_AI_STAGE','CHANGES_REQUIRED','BLOCKED','READY_FOR_HUMAN_APPROVAL');
create type human_decision as enum ('approved','rejected','revision_requested');
create type finding_category as enum ('architecture','correctness','security','data','testing','performance','ux','operations','research','requirement');
create type finding_severity as enum ('info','low','medium','high','critical');
create type finding_status as enum ('open','accepted','rejected','resolved','deferred');
create type disagreement_type as enum ('factual','architectural','security','requirement','implementation','preference');
create type materiality as enum ('low','medium','high','critical');
create type disagreement_resolution as enum ('resolved','accepted_openai','accepted_claude','combined','deferred','human_decision_required');

-- ---------- Evidência ----------
create type artifact_type as enum ('plan','patch','review','report','screenshot','log','test_result','diff');
create type evidence_type as enum ('code','test','ci','runtime','browser','database','external_source','human');
create type evidence_integrity as enum ('verified','reported','inferred','pending');

-- ---------- Governança ----------
create type approval_subject as enum ('mission_version','stage','task','release','spec');
create type approval_decision as enum ('approved','rejected','revision_requested');
create type gate_state as enum ('pending','resolved','expired','cancelled');
create type policy_decision as enum ('allow','ask','deny');

-- ---------- Integração e entrega ----------
create type pr_kind as enum ('plan','execution','maintenance');
create type pr_state as enum ('open','merged','closed');
create type check_status as enum ('queued','in_progress','success','failure','neutral','cancelled');
create type deployment_state as enum ('queued','building','ready','error','canceled');
create type release_decision as enum ('promote','hold','rollback');
create type integration_status as enum ('connected','disconnected','error','configuring');

-- ---------- Conteúdo e fluxos ----------
create type knowledge_kind as enum ('document','video','tutorial','faq','best_practice');
create type flow_status as enum ('draft','active','paused','archived');
create type budget_scope as enum ('organization','app','mission','run');
