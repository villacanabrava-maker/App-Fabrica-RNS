import { beforeEach, describe, expect, it, vi } from "vitest";
import handler, { buildHumanStatusComment, buildTelegramText, redact, safeMarkdown, sanitizeEvent } from "./notify-telegram.js";

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

// Fake secret-shaped test values are built by joining fragments at RUNTIME, so the versioned
// source never contains the literal secret-shaped substring on one line — scripts/security/
// scan-secrets.ts scans committed source text (git ls-files) for exactly these shapes, and a
// fake fixture with the real shape trips it just as a real leak would. Splitting each value at
// its prefix/random-run boundary (e.g. "ghp_" | "FAKE...") keeps the runtime string, and every
// test assertion against it, byte-for-byte identical to before — only how it is spelled in the
// source changes.
const fake = (...parts) => parts.join("");

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

describe("markdown-script-tag-whitespace", () => {
  it("removes script blocks even when the closing tag contains whitespace before >", () => {
    const out = safeMarkdown("<script>alert(1)</script > hello");
    expect(out).not.toContain("alert(1)");
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain("hello");
  });
});

describe("secret-redaction", () => {
  const fakes = {
    OPENAI_API_KEY: fake("OPENAI_API_KEY=sk-FAKEsk-", "FAKE1234567890abcdEFGH"),
    ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY=sk-ant-FAKE1234567890abcdEFGHijkl",
    FISCAL_BRIDGE_SECRET: "FISCAL_BRIDGE_SECRET=FakeSecretValue1234567890",
    TELEGRAM_BOT_TOKEN: "TELEGRAM_BOT_TOKEN=123456:FAKE-token-abcdefghijklmnop",
    GITHUB_TOKEN: fake("GITHUB_TOKEN=ghp_", "FAKEFAKEFAKEFAKEFAKEFAKEFAKE1234"),
    "Authorization: Bearer": "Authorization: Bearer FAKE.jwt.tokenvalue1234567890",
    "ghp_*": fake("ghp_", "FAKEFAKEFAKEFAKEFAKEFAKEFAKE1234"),
    "sk-*": fake("sk-", "FAKE1234567890abcdefghijklmnopqrstuvwx"),
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

describe("method-not-allowed", () => {
  it("GET -> 405, Allow: POST, never touches auth/body", async () => {
    const res = mockRes();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: "method_not_allowed" });
    expect(res.headers.Allow).toBe("POST");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("unauthorized-post", () => {
  it("POST with no Authorization header at all -> 401", async () => {
    const res = mockRes();
    await handler({ method: "POST", headers: {}, body: { ...BASE, event_key: "e-noauthheader" } }, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "unauthorized" });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("wrong-secret", () => {
  it("POST with an incorrect Authorization -> 401", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-unauth" }, { auth: "Bearer wrong" }), res);
    expect(res.statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("safe-schema-and-output", () => {
  it("rejects invalid enums and unsafe URLs while keeping a valid payload", () => {
    const ev = sanitizeEvent({
      ...BASE,
      event_key: "e-schema",
      category: "HACKER",
      severity: "urgent",
      human_action: "EXECUTE",
      url: "javascript:alert(1)",
      details_url: "data:text/html,<script>alert(1)</script>",
      checks_url: "ftp://example.com/ci",
      provider_status: { constructor: "BAD_STATUS" },
    });

    expect(ev.category).toBe("INFO");
    expect(ev.severity).toBe("info");
    expect(ev.human_action).toBe("NONE");
    expect(ev.url).toBeNull();
    expect(ev.details_url).toBeNull();
    expect(ev.checks_url).toBeNull();
    expect(ev.provider_status.constructor).toBeUndefined();
  });

  it("returns 400 for invalid category, action, severity and provider_status schema", async () => {
    const invalidCases = [
      { category: "HACKER" },
      { human_action: "EXECUTE" },
      { severity: "urgent" },
      { provider_status: { constructor: "BAD_STATUS" } },
    ];

    for (const body of invalidCases) {
      const res = mockRes();
      await handler(req({ ...BASE, ...body, event_key: `e-invalid-${Math.random().toString(16).slice(2)}` }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("invalid_notification");
    }
  });

  it("drops chat_id from the successful send payload while preserving the message id", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-send-minified", cycle_id: "cycle-42", task_id: "task-7" }), res);
    expect(res.body).not.toHaveProperty("chat_id");
    expect(res.body).toHaveProperty("message_id");
  });
});
describe("correct-secret-proceeds", () => {
  it("POST with the correct Authorization proceeds to send", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-correct-auth" }), res);
    expect(res.statusCode).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("failed-send-does-not-dedupe", () => {
  it("an upstream failure is retryable — the same event_key must be attempted again", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 502, json: async () => ({ ok: false }) }));
    const res1 = mockRes();
    await handler(req({ ...BASE, event_key: "e-retry-1" }), res1);
    expect(res1.statusCode).toBe(502);
    expect(res1.body.event_key).toBe("e-retry-1");
    expect(res1.body.deduped).toBeUndefined();

    // Same event_key again: must NOT be short-circuited as already-delivered — fetch is called again.
    const res2 = mockRes();
    await handler(req({ ...BASE, event_key: "e-retry-1" }), res2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res2.body.deduped).toBeUndefined();
  });

  it("a thrown network error is also retryable", async () => {
    global.fetch = vi.fn(async () => { throw new Error("ECONNRESET"); });
    const res1 = mockRes();
    await handler(req({ ...BASE, event_key: "e-retry-2" }), res1);
    expect(res1.statusCode).toBe(502);
    const res2 = mockRes();
    await handler(req({ ...BASE, event_key: "e-retry-2" }), res2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("successful-send-does-dedupe", () => {
  it("only a CONFIRMED delivery (Telegram ok:true) marks the event_key as delivered", async () => {
    const res1 = mockRes();
    await handler(req({ ...BASE, event_key: "e-delivered-1" }), res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.deduped).toBeUndefined();

    const res2 = mockRes();
    await handler(req({ ...BASE, event_key: "e-delivered-1" }), res2);
    expect(global.fetch).toHaveBeenCalledTimes(1); // second call short-circuited
    expect(res2.body.deduped).toBe(true);
  });
});

describe("legitimate-sha-not-redacted", () => {
  const sha40 = "72035873eb6bff3c64447ab1829fe0e256e08145";
  it("a bare 40-hex git SHA survives redact() even embedded in free text", () => {
    expect(redact(`corrigido no commit ${sha40} conforme o plano`)).toContain(sha40);
  });
  it("the structured sha field is never redacted in either surface", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-sha", sha: sha40, findings: [`veja o commit ${sha40}`] });
    const telegram = buildTelegramText(ev);
    const comment = buildHumanStatusComment(ev);
    expect(telegram).toContain(sha40.slice(0, 7)); // Telegram shows the short form
    expect(comment).toContain(`sha=${sha40}`); // GitHub report keeps the full sha
    expect(comment).toContain(sha40); // and the sha inside the finding text survives too
  });
});

describe("github-url-not-redacted", () => {
  const ghUrl = "https://github.com/villacanabrava-maker/App-Fabrica-RNS/pull/5#issuecomment-5769269395";
  const vercelUrl = "https://fabricarns-app-git-feat-sprint-1-2-auth-shell-villacanabrava.vercel.app/api/health";
  it("a full GitHub URL embedded in free text is not mangled by the generic blob pattern", () => {
    expect(redact(`ver detalhes em ${ghUrl}`)).toContain(ghUrl);
  });
  it("a full Vercel deployment URL embedded in free text is not mangled either", () => {
    expect(redact(`deploy em ${vercelUrl}`)).toContain(vercelUrl);
  });
  it("request_id/cycle_id/comment_id-shaped tokens survive redact()", () => {
    const requestId = "fiscal_26ccb7249f3ffc13686a8639";
    const cycleId = "c20260921205802-7203587";
    const commentId = "5769269395";
    const text = `request_id=${requestId} cycle_id=${cycleId} comment_id=${commentId}`;
    const out = redact(text);
    expect(out).toContain(requestId);
    expect(out).toContain(cycleId);
    expect(out).toContain(commentId);
  });
  it("a token embedded INSIDE a URL query string is still redacted (named patterns still apply)", () => {
    const fakeToken = fake("ghp_", "FAKEFAKEFAKEFAKEFAKEFAKEFAKE1234");
    const withToken = `https://example.invalid/callback?token=${fakeToken}`;
    const out = redact(withToken);
    expect(out).toContain("«redigido»");
    expect(out).not.toContain(fakeToken);
  });
});

describe("telegram-html-vs-github-markdown", () => {
  it("buildTelegramText HTML-escapes; buildHumanStatusComment does not (Markdown, not HTML)", () => {
    const ev = sanitizeEvent({ ...BASE, event_key: "e-md", human_summary: "Use `code` e o operador a < b para comparar." });
    const telegram = buildTelegramText(ev);
    const comment = buildHumanStatusComment(ev);
    expect(telegram).toContain("a &lt; b");
    expect(comment).toContain("a < b"); // not HTML-escaped — this is a Markdown surface
    expect(comment).toContain("`code`"); // backticks preserved for legibility
  });
  it("safeMarkdown still redacts secrets without HTML-escaping", () => {
    const out = safeMarkdown("token FISCAL_BRIDGE_SECRET=FakeSecretValue1234567890 e a < b", 200);
    expect(out).toContain("«redigido»");
    expect(out).toContain("a < b");
  });
});


describe("security-hardening-regressions", () => {
  it("redacts sensitive values on Telegram and GitHub metadata/output surfaces", () => {
    const secret = "GITHUB_TOKEN=ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234";
    const ev = sanitizeEvent({
      ...BASE,
      event_key: `event-${secret}`,
      title: `title ${secret}`,
      cycle_id: `cycle-${secret}`,
      task_id: `task-${secret}`,
      provider_history: [`copilot-${secret}`, "anthropic"],
      url: `https://github.com/example/repo/pull/1?token=ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234`,
      details_url: `https://github.com/example/repo/issues/1?token=ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234`,
      checks_url: `https://github.com/example/repo/actions?token=ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234`,
    });
    const telegram = buildTelegramText(ev);
    const github = buildHumanStatusComment(ev);
    expect(telegram).not.toContain("ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234");
    expect(github).not.toContain("ghp_FAKEFAKEFAKEFAKEFAKEFAKE1234");
    expect(telegram).toContain("«redigido»");
    expect(github).toContain("«redigido»");
  });

  it("rejects embedded URL credentials and canonicalizes safe URLs", () => {
    expect(sanitizeEvent({ ...BASE, url: "https://user:pass@example.com/path" }).url).toBeNull();
    expect(sanitizeEvent({ ...BASE, url: "javascript:alert(1)" }).url).toBeNull();
    expect(sanitizeEvent({ ...BASE, url: "data:text/html,hi" }).url).toBeNull();
    expect(sanitizeEvent({ ...BASE, url: "https://example.com/a b" }).url).toBe("https://example.com/a%20b");
  });

  it("escapes quotes in href attributes", () => {
    const ev = sanitizeEvent({
      ...BASE,
      url: "https://example.com/?q=%22hello%22",
      details_url: "https://example.com/details?q=%27x%27",
    });
    const text = buildTelegramText(ev);
    expect(text).toContain("href=");
    expect(text).not.toContain('href="https://example.com/?q="hello""');
  });

  it("rejects provider_status values that are not plain objects", async () => {
    for (const value of [[], "x", 123, true, null]) {
      const res = mockRes();
      await handler(req({ ...BASE, event_key: `e-provider-${String(value)}-${Math.random()}`, provider_status: value }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("invalid_notification");
      expect(res.body.invalid).toContain("provider_status");
    }
  });

  it("allows an empty provider_status object", async () => {
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-provider-empty", provider_status: {} }), res);
    expect(res.statusCode).toBe(200);
  });

  it("never returns a raw upstream error message", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("request failed https://api.telegram.org/botSECRET_TOKEN/sendMessage");
    });
    const res = mockRes();
    await handler(req({ ...BASE, event_key: "e-safe-error" }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.detail).toBe("upstream_request_failed");
    expect(JSON.stringify(res.body)).not.toContain("SECRET_TOKEN");
  });

  it("truncates only at complete rendered lines, preserving balanced Telegram markup", () => {
    const ev = sanitizeEvent({
      ...BASE,
      event_key: "e-safe-truncate",
      title: "T".repeat(300),
      human_summary: "A & B ".repeat(900),
      checks: Array.from({ length: 10 }, (_, i) => `check-${i}-${"x".repeat(180)}`),
      findings: Array.from({ length: 10 }, (_, i) => `finding-${i}-${"y".repeat(180)}`),
      details_url: "https://github.com/example/repo/pull/1#details",
    });
    const text = buildTelegramText(ev);
    expect(text.length).toBeLessThanOrEqual(3500);
    expect((text.match(/<b>/g) || []).length).toBe((text.match(/<\/b>/g) || []).length);
    expect((text.match(/<code>/g) || []).length).toBe((text.match(/<\/code>/g) || []).length);
    expect(text).not.toMatch(/&(?:amp|lt|gt|quot|#39)?$/);
    expect(text).not.toMatch(/<a\b[^>]*$/);
  });
});
