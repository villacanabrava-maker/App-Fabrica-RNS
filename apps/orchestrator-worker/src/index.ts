/**
 * Orchestrator Worker — processo externo, longo, fora do Vercel.
 *
 * Consome workflow.jobs com lease, roda o event processor de 11 passos e
 * despacha AgentAdapters. Ver docs/02-ARQUITETURA/03-ARQUITETURA-BACKEND.md
 * e docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md, Sprint 1.4.
 *
 * Placeholder deliberado no Sprint 1.1: confirma que o processo sobe e
 * encerra de forma limpa. O loop de consumo real de fila chega no
 * Sprint 1.4, quando houver uma conexão Supabase configurada para
 * consumir de verdade.
 */

function main(): void {
  console.log('[orchestrator-worker] placeholder do Sprint 1.1 — nenhuma fila conectada ainda.');
}

main();
