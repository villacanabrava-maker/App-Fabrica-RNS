import { describe, expect, it } from 'vitest';
import {
  canTransition,
  isMaterialChange,
  nextReviewRound,
  type TaskContext,
} from '../src/index';

const baseCtx: TaskContext = {
  attempt: 0,
  maxAttempts: 3,
  hasBlockingFindings: false,
  allChecksGreen: true,
};

describe('canTransition — task state machine', () => {
  it('permite uma transição válida com o ator correto', () => {
    const result = canTransition('queued', 'leased', 'lease_acquired', 'system', baseCtx);
    expect(result).toEqual({ ok: true });
  });

  it('rejeita uma transição que não existe no grafo', () => {
    const result = canTransition('created', 'completed', 'skip_everything', 'system', baseCtx);
    expect(result.ok).toBe(false);
  });

  it('rejeita o ator errado mesmo quando a transição existe', () => {
    // "human_approved" existe de awaiting_human -> approved, mas só para 'human'
    const result = canTransition('awaiting_human', 'approved', 'human_approved', 'agent', baseCtx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/Ator "agent" não pode/);
    }
  });

  // ★ A garantia central: só humano aprova, e só sem finding bloqueante.
  it('rejeita aprovação humana quando há finding bloqueante', () => {
    const result = canTransition('awaiting_human', 'approved', 'human_approved', 'human', {
      ...baseCtx,
      hasBlockingFindings: true,
    });
    expect(result.ok).toBe(false);
  });

  it('permite aprovação humana sem finding bloqueante', () => {
    const result = canTransition('awaiting_human', 'approved', 'human_approved', 'human', baseCtx);
    expect(result).toEqual({ ok: true });
  });

  it('rejeita retry quando as tentativas já se esgotaram', () => {
    const result = canTransition('failed_retryable', 'ready', 'retry', 'system', {
      ...baseCtx,
      attempt: 3,
      maxAttempts: 3,
    });
    expect(result.ok).toBe(false);
  });

  it('permite retry enquanto houver tentativas', () => {
    const result = canTransition('failed_retryable', 'ready', 'retry', 'system', {
      ...baseCtx,
      attempt: 1,
      maxAttempts: 3,
    });
    expect(result).toEqual({ ok: true });
  });

  it('um estado terminal não aceita nenhuma transição além de superseded', () => {
    const result = canTransition('completed', 'ready', 'dispatch', 'human', baseCtx);
    expect(result.ok).toBe(false);
  });

  it('cancelamento por humano é sempre permitido, mesmo fora do grafo explícito', () => {
    const result = canTransition('running', 'cancelled', 'cancel', 'human', baseCtx);
    expect(result).toEqual({ ok: true });
  });

  it('checks vermelhos nunca liberam awaiting_human', () => {
    const result = canTransition('awaiting_checks', 'awaiting_human', 'checks_green', 'system', {
      ...baseCtx,
      allChecksGreen: false,
    });
    expect(result.ok).toBe(false);
  });
});

describe('nextReviewRound — ciclo de revisão dupla', () => {
  it('a rodada 0 começa em OpenAI R1', () => {
    expect(nextReviewRound(0)).toEqual({ action: 'run', round: 1, runtime: 'openai', phase: 'r1' });
  });

  it('segue a sequência fixa OpenAI R1 -> Claude R1 -> OpenAI R2 -> Claude R2', () => {
    expect(nextReviewRound(1)).toMatchObject({ round: 2, runtime: 'anthropic', phase: 'r1' });
    expect(nextReviewRound(2)).toMatchObject({ round: 3, runtime: 'openai', phase: 'r2' });
    expect(nextReviewRound(3)).toMatchObject({ round: 4, runtime: 'anthropic', phase: 'r2' });
  });

  // ★ O ciclo tem exatamente quatro passagens. round > 4 é DENIED.
  it('a rodada 4 nunca produz uma quinta passagem — vai para o human gate', () => {
    expect(nextReviewRound(4)).toEqual({ action: 'human_gate', reason: 'max_hops_reached' });
  });

  it('uma rodada negativa também cai no human gate, nunca em execução', () => {
    expect(nextReviewRound(-1)).toEqual({ action: 'human_gate', reason: 'max_hops_reached' });
  });
});

describe('isMaterialChange — classificação material vs. editorial', () => {
  it('uma migration SQL é sempre material', () => {
    expect(
      isMaterialChange({ changedPaths: ['supabase/migrations/0012_x.sql'], changedSections: [] }),
    ).toBe(true);
  });

  it('um arquivo em factory-intelligence é sempre material', () => {
    expect(
      isMaterialChange({ changedPaths: ['factory-intelligence/registry/agents.yaml'], changedSections: [] }),
    ).toBe(true);
  });

  it('mudar a seção "Segurança" de um documento é material', () => {
    expect(
      isMaterialChange({ changedPaths: ['docs/01-PRODUTO/02-PRODUCT-SPEC.md'], changedSections: ['Segurança'] }),
    ).toBe(true);
  });

  it('mudar só um typo de texto comum não é material', () => {
    expect(
      isMaterialChange({ changedPaths: ['docs/03-PAGINAS/01-INICIO.md'], changedSections: ['Visão geral'] }),
    ).toBe(false);
  });
});
