import { beforeEach, describe, expect, it, vi } from "vitest";
import handler, { buildHumanStatusComment, buildTelegramText, redact, sanitizeEvent } from "./notify-telegram.js";

function mockRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  return res;
}

function req(body, { auth = "Bearer test-secret" } = {}) {
  return { method: "POST", headers: { authorization: auth }, body };
}

const BASE = {
  event_key: "evt-1", title: "Teste", human_summary: "resumo", human_action: "NONE",
  category: "INFO", url: "https://github.com/org/repo/pull/5",
};

beforeEach(() => {
  process.env.FISCAL_BRIDGE_SECRET = "test-secret";
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "12345";
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, result: { message_id: 1, chat: { id: 12345 } } }) }));
});

describe("working-no-human-action", () => {
  it("renders NÃO and no APPROVE phrase", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-working" }), res);
    expect(res.statusCode).toBe(200);
    const text = global.fetch.mock.calls[0][1].body;
    expect(text).toContain("VOCÊ PRECISA FAZER ALGO AGORA");
    expect(JSON.parse(text).text).toContain("NÃO");
    expect(JSON.parse(text).text).not.toContain("NÃO fará merge");
  });
});

describe("constructor-provider-failover", () => {
  it("shows antes/agora and preserved-work language, no local paths", async () => {
    const ev = { ...BASE, event_key: "e-failover", category: "WORKING", provider_history: ["anthropic", "copilot"],
      provider_status: { constructor: "WORKING", constructor_owner: "copilot" } };
    const text = buildTelegramText(sanitizeEvent(ev));
    expect(text).toMatch(/Antes: Anthropic/);
    expect(text).toMatch(/Agora: Copilot/);
    expect(text).toContain("trabalho foi preservado");
    expect(text).not.toMatch(/[A-Za-z]:\\\\/);
  });
});

describe("all-providers-unavailable", () => {
  it("is SIM with RESTORE_PROVIDER and separates Fiscal", () => {
    const ev = sanitizeEvent({
      ...BASE, event_key: "e-allgone", category: "BLOCKED", human_action: "RESTORE_PROVIDER",
      human_summary: "Todos os motores de construção estão indisponíveis. O construtor parou com segurança.",
      technical_detail: "BLOCKED_PROVIDER_UNAVAILABLE; Anthropic sem créditos; Copilot indisponível; OpenAI reservado.",
      provider_status: { constructor_copilot: "UNAVAILABLE_AUTH", constructor_anthropic: "UNAVAILABLE_CREDIT", constructor_openai: "DISABLED_BY_POLICY", fiscal_openai: "HEALTHY" },
    });
    const text = buildTelegramText(ev);
    expect(text).toContain("SIM");
    expect(text).toContain("Restaurar um motor de construção");
    expect(text).toContain("Fiscal OpenAI: disponível");
    const [mainText] = text.split("Detalhe:");
    expect(mainText).not.toContain("BLOCKED_PROVIDER_UNAVAILABLE"); // technical code stays out of "O que aconteceu"
    expect(text).toContain("Detalhe: BLOCKED_PROVIDER_UNAVAILABLE"); // ...but is present in the secondary technical line
  });
});

describe("fiscal-findings (no human action when constructor is fixing it)", () => {
  it("maps to NÃO per the corrected rule", () => {
    const ev = sanitizeEvent({
      ...BASE, event_key: "e-fiscal", category: "WORKING", human_action: "NONE",
      human_summary: "O Fiscal encontrou problemas. O construtor recebeu os findings e está trabalhando na correção.",
    });
    const text = buildTelegramText(ev);
    expect(text).toContain("NÃO");
  });
});

describe("all-checks-green", () => {
  it("renders checks list, no problems", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-green", checks: ["Application PASS", "Database PASS", "Security PASS", "Vercel PASS"] });
    const text = buildTelegramText(ev);
    expect(text).toContain("Application PASS");
    expect(text).toContain("Nenhum problema conhecido.");
  });
});

describe("critical-ci-failure", () => {
  it("is SIM/INVESTIGATE with the failing check named", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-cifail", category: "BLOCKED", human_action: "INVESTIGATE", findings: ["Database CI falhou"] });
    const text = buildTelegramText(ev);
    expect(text).toContain("SIM");
    expect(text).toContain("Database CI falhou");
  });
});

describe("human-approval-required", () => {
  it("always injects the no-auto-merge phrase and required fields", () => {
    const ev = sanitizeEvent({
      ...BASE, event_key: "e-approve", category: "HUMAN_ACTION", human_action: "APPROVE",
      pr_number: 5, sha: "7203587" + "3".padEnd(33, "3"),
      checks: ["4/4 checks passando"], findings: [], risks: ["nenhum risco novo identificado"],
      human_summary: "Ciclo de revisao concluido (CLEAR) na SHA atual.",
    });
    const text = buildTelegramText(ev);
    expect(text).toContain("A Fábrica NÃO fará merge automaticamente.");
    expect(text).toContain("PR #5");
    expect(text).toMatch(/SHA 7203587/);
    const comment = buildHumanStatusComment(ev);
    expect(comment).toContain("A Fábrica NÃO fará merge automaticamente.");
    expect(comment).toContain("[RNS-HUMAN-STATUS]");
  });
});

describe("security-alert (structured signal, not keyword scan)", () => {
  it("only becomes SECURITY when the caller says so structurally", () => {
    const structured = sanitizeEvent({ ...BASE, event_key: "e-sec1", category: "SECURITY", human_action: "INVESTIGATE",
      human_summary: "Violação de papel: um ACK de /fiscal apareceu de um ator estranho ao coordenador." });
    expect(buildTelegramText(structured)).toContain("🔒");

    // Free text merely mentioning RLS/RBAC/secret must NOT force category=SECURITY by itself —
    // the renderer trusts whatever category the caller (which classifies structurally) sent.
    const notKeyworded = sanitizeEvent({ ...BASE, event_key: "e-sec2", category: "INFO",
      human_summary: "A migration ajusta RLS e RBAC da tabela memberships." });
    expect(buildTelegramText(notKeyworded)).toContain("ℹ️");
  });
});

describe("long-message-clipping", () => {
  it("clips to MAX_TEXT and keeps a details link when it overflows", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-long", details_url: "https://github.com/org/repo/pull/5#issuecomment-1",
      human_summary: "x".repeat(6000),
      checks: Array.from({ length: 10 }, (_, i) => `check ${i} `.repeat(30)),
      findings: Array.from({ length: 10 }, (_, i) => `finding ${i} `.repeat(30)),
      risks: Array.from({ length: 10 }, (_, i) => `risk ${i} `.repeat(30)) });
    const text = buildTelegramText(ev);
    expect(text.length).toBeLessThanOrEqual(3500);
    expect(text).toContain("detalhes completos no GitHub");
  });
});

describe("html-injection", () => {
  it("escapes tags in every free-text field", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-html", title: "<script>alert(1)</script>", human_summary: "<img src=x onerror=alert(1)>", next_step: "<b>bold</b>" });
    const text = buildTelegramText(ev);
    expect(text).not.toContain("<script>");
    expect(text).not.toContain("<img");
    expect(text).toContain("&lt;script&gt;");
  });
});

describe("secret-redaction", () => {
  const fakes = {
    OPENAI_API_KEY: "OPENAI_API_KEY=sk-FAKEsk-FAKE1234567890abcdEFGH",
    ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY=sk-ant-FAKE1234567890abcdEFGHijkl",
    FISCAL_BRIDGE_SECRET: "FISCAL_BRIDGE_SECRET=FakeSecretValue1234567890",
    TELEGRAM_BOT_TOKEN: "TELEGRAM_BOT_TOKEN=123456:FAKE-token-abcdefghijklmnop",
    GITHUB_TOKEN: "GITHUB_TOKEN=ghp_FAKEFAKEFAKEFAKEFAKEFAKEFAKE1234",
    "Authorization: Bearer": "Authorization: Bearer FAKE.jwt.tokenvalue1234567890",
    "ghp_*": "ghp_FAKEFAKEFAKEFAKEFAKEFAKEFAKE1234",
    "sk-*": "sk-FAKE1234567890abcdefghijklmnopqrstuvwx",
  };
  for (const [name, sample] of Object.entries(fakes)) {
    it(`redacts ${name}`, () => {
      const out = redact(`prefixo ${sample} sufixo`);
      expect(out).toContain("«redigido»");
      expect(out).not.toContain(sample.split(/[=: ]/).pop());
    });
  }

  it("never lets a disallowed field (env dump / raw stdout) through the allowlist", () => {
    const ev = sanitizeEvent({ ...BASE, env: { OPENAI_API_KEY: "sk-should-not-appear" }, stdout: "raw provider stdout dump", headers: { authorization: "Bearer x" } });
    expect(ev.env).toBeUndefined();
    expect(ev.stdout).toBeUndefined();
    expect(ev.headers).toBeUndefined();
  });
});

describe("provider-status translation", () => {
  it("translates enum states to plain PT-BR and never shows raw codes as the primary line", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-translate",
      provider_status: { constructor_copilot: "HEALTHY", constructor_anthropic: "UNAVAILABLE_CREDIT", constructor_openai: "DISABLED_BY_POLICY" } });
    const text = buildTelegramText(ev);
    expect(text).toContain("disponível");
    expect(text).toContain("sem créditos");
    expect(text).toContain("reservado/desativado");
  });
});

describe("no telegram authority buttons", () => {
  it("never sends reply_markup/inline_keyboard", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-noauth" }), res);
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.reply_markup).toBeUndefined();
    expect(payload.text).not.toMatch(/Aprovar|Rejeitar|Merge|Executar correção/);
  });
});

describe("in-process dedupe (best-effort, non-persistent)", () => {
  it("does not re-send the same event_key within the warm window", async () => {
    const res1 = mockRes();
    await handler(req({ ...BASE, event_key: "e-dedupe-1" }), res1);
    const res2 = mockRes();
    await handler(req({ ...BASE, event_key: "e-dedupe-1" }), res2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res2.body.deduped).toBe(true);
  });
});

describe("unauthorized", () => {
  it("rejects without the bridge secret", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-unauth" }, { auth: "Bearer wrong" }), res);
    expect(res.statusCode).toBe(401);
  });
});
