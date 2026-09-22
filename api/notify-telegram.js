// Human Notifications V2 — Telegram bridge.
// Schema/behaviour: docs/09-OPERACOES/TELEGRAM-NOTIFICATIONS.md
//
// Security posture (layered, not just prefix-regex):
//   1. environment dumps, raw headers and raw provider stdout are never accepted as input at all —
//      they simply are not in ALLOWED_FIELDS, so a caller that includes them has those keys dropped.
//   2. every remaining string field is escaped for HTML.
//   3. every remaining string field also goes through redact() (known secret-shaped patterns,
//      not only known prefixes) before it can reach Telegram or the JSON response.
//   4. the whole message is size-capped (MAX_TEXT) regardless of what was sent in.
// Callers (the local orchestrator's notify.ps1, human-notifications.yml) own the WORDING
// (title/human_summary/next_step/...); this endpoint owns the STRUCTURE, the human_action/
// provider_status translation tables, the security gate and the send.

const MAX_TEXT = 3500;

const ALLOWED_FIELDS = [
  "event_key", "category", "severity", "title", "human_summary", "human_action",
  "project", "repository", "pr_number", "branch", "sha", "cycle_id", "task_id",
  "provider", "provider_status", "provider_history", "checks", "findings", "risks",
  "blocking_reason", "technical_detail", "next_step", "url", "details_url", "checks_url",
];

const CATEGORY_ICON = { INFO: "ℹ️", WORKING: "⚙️", BLOCKED: "⛔", HUMAN_ACTION: "🟡", COMPLETED: "✅", SECURITY: "🔒" };

const STATE_LABELS = {
  HEALTHY: "disponível", WORKING: "trabalhando agora", DEGRADED: "parcial (créditos reduzidos)",
  UNAVAILABLE_CREDIT: "sem créditos", UNAVAILABLE_AUTH: "sessão/chave indisponível",
  DISABLED_BY_POLICY: "reservado/desativado", CIRCUIT_OPEN: "em espera (falhas recentes)",
  UNKNOWN: "sem dado", ENABLED: "ativado", DISABLED: "desativado", IDLE: "ocioso", BLOCKED: "bloqueado",
  PENDING_RESPONSE: "aguardando resposta", UNAVAILABLE_ERROR: "com erro",
  REVIEWER_PROVIDER_UNAVAILABLE: "indisponível", none: "nenhum", NONE: "nenhum",
};

const HUMAN_ACTION_LABELS = {
  REVIEW: "Revisar a PR", APPROVE: "Aprovar/decidir sobre o merge (permanece manual)",
  REJECT_OR_DECIDE: "Decidir sobre um bloqueio", RESTORE_PROVIDER: "Restaurar um motor de construção",
  CONFIGURE_SECRET: "Configurar uma credencial pendente", INVESTIGATE: "Investigar uma anomalia",
};

const PROVIDER_LABELS = { copilot: "Copilot", anthropic: "Anthropic", openai: "OpenAI", claude: "Claude", none: "nenhum" };
const VALID_CATEGORIES = new Set(["INFO", "WORKING", "BLOCKED", "HUMAN_ACTION", "COMPLETED", "SECURITY"]);
const VALID_ACTIONS = new Set(["NONE", "REVIEW", "APPROVE", "REJECT_OR_DECIDE", "RESTORE_PROVIDER", "CONFIGURE_SECRET", "INVESTIGATE"]);
const VALID_SEVERITIES = new Set(["info", "low", "medium", "high", "critical"]);
const VALID_PROVIDER_STATUS_KEYS = new Set(["watcher", "constructor", "constructor_owner", "automation", "constructor_copilot", "constructor_anthropic", "constructor_openai", "fiscal_openai", "reviewer_anthropic", "ci", "vercel"]);
const VALID_PROVIDER_STATUS_VALUES = new Set(["HEALTHY", "WORKING", "DEGRADED", "UNAVAILABLE_CREDIT", "UNAVAILABLE_AUTH", "DISABLED_BY_POLICY", "CIRCUIT_OPEN", "UNKNOWN", "ENABLED", "DISABLED", "IDLE", "BLOCKED", "PENDING_RESPONSE", "UNAVAILABLE_ERROR"]);
const VALID_PROVIDER_OWNERS = new Set(["copilot", "anthropic", "openai", "claude", "none"]);

// Groups rendered separately in "Estado dos motores" (mirrors the human decision that Builder
// engines, the Fiscal and the independent Reviewer are three distinct pools — never merge them
// into one line).
const BUILDER_KEYS = ["constructor_copilot", "constructor_anthropic", "constructor_openai"];
const BUILDER_LABELS = { constructor_copilot: "Copilot", constructor_anthropic: "Anthropic", constructor_openai: "OpenAI" };

function required(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEnum(value, allowed, fallback) {
  if (typeof value !== "string") return fallback;
  const c = value.trim();
  if (!c) return fallback;
  const upper = c.toUpperCase();
  if (allowed.has(upper)) return upper;
  const lower = c.toLowerCase();
  if (allowed.has(lower)) return lower;
  return fallback;
}

function isAllowedHttpUrl(value) {
  if (typeof value !== "string") return false;
  const raw = value.trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !/[\u0000-\u001F\u007F]/.test(raw);
  } catch {
    return false;
  }
}

function clip(value, max = MAX_TEXT) {
  const text = required(value) || "";
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Layer 3: redact known-secret SHAPES, not only known prefixes. Two tiers:
//  - NAMED_SECRET_PATTERNS: specific shapes (name=value for a secret this project uses,
//    Authorization/Bearer headers, vendor token prefixes) — always redacted, everywhere,
//    including inside a URL's query string.
//  - GENERIC_BLOB_RE: last-resort, intentionally broad catch for any long unbroken
//    base64/hex-looking run — but a legitimate technical identifier must survive an audit
//    trail, so it explicitly does NOT redact a bare 40-hex-char git SHA (a real secret is
//    virtually never pure lowercase hex of exactly that length), and URLs are protected from
//    it entirely (a long owner/repo/comment path is not a secret shape) while still being
//    scanned by the named patterns above.
const NAMED_SECRET_PATTERNS = [
  /\b(OPENAI_API_KEY|ANTHROPIC_API_KEY|FISCAL_BRIDGE_SECRET|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|GITHUB_TOKEN|CODEX_API_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_JWT_SECRET)\s*[=:]\s*\S+/gi,
  /\bAuthorization\s*:\s*.+$/gim, // consumes the whole header value (e.g. "Authorization: Bearer <token>"), not just its first word
  /\bBearer\s+[A-Za-z0-9._-]+/gi,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bsk-(proj-)?[A-Za-z0-9_-]{16,}/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
];
const GENERIC_BLOB_RE = /\b[A-Za-z0-9+/_-]{40,}={0,2}\b/g;
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/g;
// Built at RUNTIME via String.fromCharCode (never a literal control byte in this source file,
// so the file stays plain text/diffable — embedding a raw control byte here previously made
// git treat this file as binary). A real control character essentially never appears in
// legitimate free text, so it is a safe, collision-proof marker while URLs are protected from
// GENERIC_BLOB_RE below.
const PLACEHOLDER_CH = String.fromCharCode(1);
const PLACEHOLDER_RESTORE_RE = new RegExp(`${PLACEHOLDER_CH}URL(\\d+)${PLACEHOLDER_CH}`, "g");

function redactNamed(text) {
  let out = text;
  for (const re of NAMED_SECRET_PATTERNS) out = out.replace(re, "«redigido»");
  return out;
}

function redact(text) {
  let out = String(text ?? "");
  const urls = [];
  out = out.replace(URL_RE, (m) => { urls.push(redactNamed(m)); return `${PLACEHOLDER_CH}URL${urls.length - 1}${PLACEHOLDER_CH}`; });
  out = redactNamed(out);
  out = out.replace(GENERIC_BLOB_RE, (m) => (/^[0-9a-f]{40}$/i.test(m) ? m : "«redigido»"));
  out = out.replace(PLACEHOLDER_RESTORE_RE, (_, i) => urls[Number(i)]);
  return out;
}

function safeText(value, max) {
  return escapeHtml(clip(redact(value), max));
}

// Same secret redaction as safeText, but WITHOUT HTML-escaping: buildHumanStatusComment()
// writes GitHub Markdown, not Telegram HTML — escaping "<"/">"/"&" there is unnecessary and
// hurts legibility/audit fidelity for no security benefit (there is no HTML-rendering context
// on that surface). Sanitized (redacted + length-capped) either way.
function safeMarkdown(value, max) {
  let out = String(value ?? "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, " ");
  out = out.replace(/<[^>]+>/g, " ");
  out = out.replace(/!\[[^\]]*\]\((?:javascript:|data:)[^)]+\)/gi, " ");
  out = out.replace(/\[([^\]]+)\]\((?:javascript:|data:)[^)]+\)/gi, "$1");
  out = out.replace(/\s+/g, " ").trim();
  return clip(redact(out), max);
}

function isPlainObject(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

function normalizeProviderStatus(src) {
  const out = Object.create(null);
  if (!isPlainObject(src)) return out;
  for (const [key, value] of Object.entries(src)) {
    if (!VALID_PROVIDER_STATUS_KEYS.has(key)) continue;
    if (key === "constructor_owner") {
      const owner = String(value ?? "").trim().toLowerCase();
      if (VALID_PROVIDER_OWNERS.has(owner)) out[key] = owner;
      continue;
    }
    const normalized = normalizeEnum(value, VALID_PROVIDER_STATUS_VALUES, null);
    if (normalized) out[key] = normalized;
  }
  return out;
}

function sanitizeStringArray(v, maxItems = 10, maxLen = 200) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim()).slice(0, maxItems).map((x) => x.trim().slice(0, maxLen));
}

// Allowlist gate (layer 1): anything not named here — env dumps, headers, raw stdout, anything
// else — never enters the event object at all, regardless of what a caller sent.
function sanitizeEvent(body) {
  const src = body && typeof body === "object" ? body : {};
  const out = Object.create(null);
  for (const key of ALLOWED_FIELDS) if (src[key] !== undefined && src[key] !== null) out[key] = src[key];
  if (!out.human_summary && src.summary) out.human_summary = src.summary; // v1 compatibility

  out.event_key = required(out.event_key);
  out.title = required(out.title);
  out.human_summary = required(out.human_summary);
  const categoryInput = out.category;
  const categoryNormalized = categoryInput === undefined || categoryInput === null ? "INFO" : normalizeEnum(categoryInput, VALID_CATEGORIES, null);
  out.category = categoryNormalized || "INFO";
  const severityInput = out.severity;
  const severityNormalized = severityInput === undefined || severityInput === null ? (out.category === "BLOCKED" || out.category === "SECURITY" ? "critical" : "info") : normalizeEnum(severityInput, VALID_SEVERITIES, null);
  out.severity = severityNormalized || (out.category === "BLOCKED" || out.category === "SECURITY" ? "critical" : "info");
  const actionInput = out.human_action;
  const actionNormalized = actionInput === undefined || actionInput === null ? "NONE" : normalizeEnum(actionInput, VALID_ACTIONS, null);
  out.human_action = actionNormalized || "NONE";
  out.url = isAllowedHttpUrl(out.url) ? out.url.trim() : null;
  out.details_url = isAllowedHttpUrl(out.details_url) ? out.details_url.trim() : null;
  out.checks_url = isAllowedHttpUrl(out.checks_url) ? out.checks_url.trim() : null;
  out.sha = /^[0-9a-f]{7,40}$/i.test(String(out.sha || "")) ? out.sha : null;
  out.pr_number = Number.isFinite(Number(out.pr_number)) && out.pr_number !== undefined ? Number(out.pr_number) : null;
  out.provider_status = normalizeProviderStatus(out.provider_status);
  out.provider_history = sanitizeStringArray(out.provider_history);
  out.checks = sanitizeStringArray(out.checks);
  out.findings = sanitizeStringArray(out.findings);
  out.risks = sanitizeStringArray(out.risks);
  return out;
}

function getInvalidStructurallyFields(raw) {
  const invalid = [];
  if (raw && typeof raw === "object") {
    if (raw.category !== undefined && raw.category !== null && !VALID_CATEGORIES.has(String(raw.category).trim().toUpperCase())) invalid.push("category");
    if (raw.human_action !== undefined && raw.human_action !== null && !VALID_ACTIONS.has(String(raw.human_action).trim().toUpperCase())) invalid.push("human_action");
    if (raw.severity !== undefined && raw.severity !== null && !VALID_SEVERITIES.has(String(raw.severity).trim().toLowerCase())) invalid.push("severity");
    if (raw.provider_status !== undefined && raw.provider_status !== null) {
      for (const [key, value] of Object.entries(raw.provider_status)) {
        if (!VALID_PROVIDER_STATUS_KEYS.has(key)) { invalid.push("provider_status"); break; }
        if (key === "constructor_owner") {
          if (!VALID_PROVIDER_OWNERS.has(String(value ?? "").trim().toLowerCase())) { invalid.push("provider_status"); break; }
          continue;
        }
        if (!VALID_PROVIDER_STATUS_VALUES.has(String(value ?? "").trim())) { invalid.push("provider_status"); break; }
      }
    }
    for (const key of ["url", "details_url", "checks_url"]) {
      const val = raw[key];
      if (val !== undefined && val !== null && !isAllowedHttpUrl(val)) invalid.push(key);
    }
  }
  return [...new Set(invalid)];
}

function label(map, value) {
  if (value === null || value === undefined || value === "") return null;
  return map[value] || String(value);
}

function buildEnginesSection(ev) {
  const lines = [];
  const builders = BUILDER_KEYS
    .filter((k) => ev.provider_status[k] !== undefined)
    .map((k) => `${BUILDER_LABELS[k]}: ${label(STATE_LABELS, ev.provider_status[k]) || "sem dado"}`);
  if (builders.length) lines.push("Motores de construção: " + builders.join(" · "));
  if (ev.provider_status.constructor_owner !== undefined) {
    lines.push("Quem está trabalhando: " + (PROVIDER_LABELS[ev.provider_status.constructor_owner] || ev.provider_status.constructor_owner || "nenhum"));
  }
  if (ev.provider_status.automation !== undefined) lines.push("Automação: " + (label(STATE_LABELS, ev.provider_status.automation) || ev.provider_status.automation));
  if (ev.provider_status.fiscal_openai !== undefined) lines.push("Fiscal OpenAI: " + (label(STATE_LABELS, ev.provider_status.fiscal_openai) || "sem dado"));
  if (ev.provider_status.reviewer_anthropic !== undefined) lines.push("Revisor independente: " + (label(STATE_LABELS, ev.provider_status.reviewer_anthropic) || "sem dado"));
  return lines;
}

// Full snapshot (all keys present, unfiltered) — used only in the GitHub technical report,
// never in the shorter Telegram summary.
function buildFullSnapshotSection(ev) {
  const order = ["watcher", "constructor", "constructor_owner", "automation", "constructor_copilot",
    "constructor_anthropic", "constructor_openai", "fiscal_openai", "reviewer_anthropic", "ci", "vercel"];
  return order
    .filter((k) => ev.provider_status[k] !== undefined)
    .map((k) => `${k}: ${ev.provider_status[k]}`);
}

function trimTelegramHtml(text, max = MAX_TEXT) {
  if (text.length <= max) return text;
  const footer = "\n\n(mensagem resumida — detalhes completos no GitHub)";
  const available = max - footer.length;
  let trimmed = text.slice(0, available).trimEnd();
  trimmed = trimmed.replace(/<\/?[A-Za-z][^>]*$/, "");
  trimmed = trimmed.replace(/&lt;[^&]*$/, "");
  return trimmed + footer;
}

function buildTelegramText(ev) {
  const icon = CATEGORY_ICON[ev.category] || "ℹ️";
  const needsAction = ev.human_action !== "NONE";
  const head = [
    `${icon} <b>${safeText(ev.title, 180)}</b>`,
    "",
    [ev.project, ev.pr_number ? `PR #${ev.pr_number}` : null, ev.sha ? `SHA ${ev.sha.slice(0, 7)}` : null].filter(Boolean).map((s) => safeText(s, 60)).join(" · "),
    "",
    "<b>O que aconteceu:</b>",
    safeText(ev.human_summary, 900),
    "",
    "<b>VOCÊ PRECISA FAZER ALGO AGORA?</b>",
    needsAction ? `SIM — ${safeText(label(HUMAN_ACTION_LABELS, ev.human_action) || ev.human_action, 160)}` : "NÃO",
  ];
  if (ev.human_action === "APPROVE") head.push("", "<b>A Fábrica NÃO fará merge automaticamente.</b>"); // baked in, never left to the caller to remember

  const nowDoing = [];
  if (ev.provider_status.constructor !== undefined) {
    const owner = PROVIDER_LABELS[ev.provider_status.constructor_owner] || ev.provider_status.constructor_owner;
    if (ev.provider_status.constructor === "WORKING" && owner) nowDoing.push(`Construindo com ${owner}.`);
    else if (ev.provider_status.constructor === "IDLE") nowDoing.push("Sem tarefa de construção em andamento.");
    else if (ev.provider_status.constructor === "BLOCKED") nowDoing.push("Parado, aguardando um motor disponível.");
  }
  if (ev.provider_history.length >= 2) {
    nowDoing.push(`Antes: ${PROVIDER_LABELS[ev.provider_history[0]] || ev.provider_history[0]} · Agora: ${PROVIDER_LABELS[ev.provider_history[ev.provider_history.length - 1]] || ev.provider_history[ev.provider_history.length - 1]}.`);
    nowDoing.push("O trabalho foi preservado. A mesma branch/worktree continua sendo usada. Não existem dois construtores escrevendo simultaneamente.");
  }

  const engines = buildEnginesSection(ev);
  const checks = ev.checks.length ? ev.checks.map((c) => safeText(c, 140)) : ["Sem dado de validação para este evento."];
  const problems = [];
  if (ev.blocking_reason) problems.push(safeText(ev.blocking_reason, 300));
  if (ev.findings.length) problems.push(...ev.findings.map((f) => safeText(f, 200)));
  if (ev.risks.length) problems.push(...ev.risks.map((r) => "Risco: " + safeText(r, 200)));
  if (!problems.length) problems.push("Nenhum problema conhecido.");
  if (ev.technical_detail) problems.push(`Detalhe: ${safeText(ev.technical_detail, 300)}`); // raw technical codes, secondary line only

  const body = [
    ...head,
    "",
    ...(nowDoing.length ? ["<b>O que a Fábrica está fazendo agora:</b>", ...nowDoing.map((s) => safeText(s, 220)), ""] : []),
    ...(engines.length ? ["<b>Estado dos motores:</b>", ...engines.map((s) => safeText(s, 160)), ""] : []),
    "<b>Validações:</b>", ...checks, "",
    "<b>Problemas:</b>", ...problems, "",
    ...(ev.next_step ? ["<b>Próximo passo:</b>", safeText(ev.next_step, 300), ""] : []),
  ];

  const links = [];
  if (ev.url) links.push(`<a href="${escapeHtml(ev.url)}">Abrir PR</a>`);
  if (ev.checks_url) links.push(`<a href="${escapeHtml(ev.checks_url)}">Ver CI</a>`);
  if (ev.details_url) links.push(`<a href="${escapeHtml(ev.details_url)}">Ver detalhes</a>`);
  if (links.length) body.push(links.join(" · "));
  body.push("", `<code>${escapeHtml(ev.event_key)}</code>`);

  let text = body.filter((l) => l !== null && l !== undefined).join("\n");
  if (text.length > MAX_TEXT) {
    const footer = ev.details_url
      ? `\n\n(mensagem resumida — <a href="${escapeHtml(ev.details_url)}">detalhes completos no GitHub</a>)`
      : "\n\n(mensagem resumida)";
    text = text.slice(0, MAX_TEXT - footer.length).trimEnd();
    text = text.replace(/<\/?[A-Za-z][^>]*$/, "");
    text = text + footer;
  }
  return text;
}

// Exported for the GitHub "[RNS-HUMAN-STATUS]" comment body (technical, no length pressure).
export function buildHumanStatusComment(rawEvent) {
  const ev = sanitizeEvent(rawEvent);
  const lines = [
    "[RNS-HUMAN-STATUS]",
    `categoria=${ev.category} human_action=${ev.human_action}` + (ev.cycle_id ? ` cycle_id=${ev.cycle_id}` : "") + (ev.task_id ? ` task_id=${ev.task_id}` : "") + (ev.sha ? ` sha=${ev.sha}` : ""),
    "",
    `## ${clip(ev.title, 200)}`,
    "",
    safeMarkdown(ev.human_summary, 4000),
    "",
    `VOCÊ PRECISA FAZER ALGO AGORA? ${ev.human_action === "NONE" ? "NÃO" : "SIM — " + (label(HUMAN_ACTION_LABELS, ev.human_action) || ev.human_action)}`,
  ];
  if (ev.human_action === "APPROVE") lines.push("", "A Fábrica NÃO fará merge automaticamente.");
  const full = buildFullSnapshotSection(ev);
  if (full.length) lines.push("", "### Estado dos subsistemas", ...full.map((s) => `- ${s}`));
  if (ev.provider_history.length) lines.push("", `Histórico de providers: ${ev.provider_history.join(" -> ")}`);
  if (ev.checks.length) lines.push("", "### Validações", ...ev.checks.map((c) => `- ${safeMarkdown(c, 300)}`));
  if (ev.findings.length) lines.push("", "### Findings", ...ev.findings.map((f) => `- ${safeMarkdown(f, 400)}`));
  if (ev.risks.length) lines.push("", "### Riscos conhecidos", ...ev.risks.map((r) => `- ${safeMarkdown(r, 300)}`));
  if (ev.blocking_reason) lines.push("", `Bloqueio: ${safeMarkdown(ev.blocking_reason, 400)}`);
  if (ev.technical_detail) lines.push("", `Detalhe técnico: ${safeMarkdown(ev.technical_detail, 400)}`);
  if (ev.next_step) lines.push("", `Próximo passo: ${safeMarkdown(ev.next_step, 400)}`);
  if (ev.url) lines.push("", `PR: ${ev.url}`);
  return lines.join("\n");
}

export { sanitizeEvent, buildTelegramText, redact, safeMarkdown };

// Best-effort, in-memory only (per warm container; resets on cold start). NOT persistence —
// nothing is written to any store. Smooths bursts of the same event_key arriving in a short
// window from GitHub Actions (adjustment #1: no new persistence for batching/dedupe in V2).
// Real, durable dedupe for local-orchestrator-originated events lives in notify.ps1's own
// notify-state.json on the caller side.
//
// Dedupe means DELIVERED, not merely ATTEMPTED: seenRecently() only checks membership;
// markDelivered() is called only after Telegram has confirmed success. A failed/errored send
// must be retryable on the next identical event_key, not silently swallowed as "deduped".
const recentEventKeys = new Map();
const DEDUPE_TTL_MS = 10 * 60 * 1000;
function seenRecently(key) {
  const now = Date.now();
  for (const [k, t] of recentEventKeys) if (now - t > DEDUPE_TTL_MS) recentEventKeys.delete(k);
  return recentEventKeys.has(key);
}
function markDelivered(key) {
  recentEventKeys.set(key, Date.now());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const bridgeSecret = process.env.FISCAL_BRIDGE_SECRET;
  const auth = req.headers.authorization || "";
  if (!bridgeSecret || auth !== `Bearer ${bridgeSecret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const invalid = getInvalidStructurallyFields(req.body || {});
  if (invalid.length) {
    return res.status(400).json({ error: "invalid_notification", invalid });
  }

  const ev = sanitizeEvent(req.body || {});
  if (!ev.event_key || !ev.title || !ev.human_summary) {
    return res.status(400).json({ error: "invalid_notification" });
  }

  if (seenRecently(ev.event_key)) {
    return res.status(200).json({ ok: true, event_key: ev.event_key, deduped: true });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(503).json({
      error: "telegram_not_configured",
      event_key: ev.event_key,
      missing: [!token && "TELEGRAM_BOT_TOKEN", !chatId && "TELEGRAM_CHAT_ID"].filter(Boolean),
    });
  }

  const text = buildTelegramText(ev);

  try {
    const upstream = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No reply_markup / inline_keyboard is ever sent: Telegram stays informative-only,
        // never an authority surface (rule: no Approve/Reject/Merge buttons in this version).
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      },
    );

    const data = await upstream.json();
    if (!upstream.ok || !data?.ok) {
      // Not delivered: do NOT mark dedupe. The same event_key must be retryable.
      return res.status(502).json({ error: "telegram_send_failed", event_key: ev.event_key, status: upstream.status });
    }

    markDelivered(ev.event_key); // only now — confirmed delivered
    return res.status(200).json({
      ok: true,
      event_key: ev.event_key,
      message_id: data?.result?.message_id || null,
    });
  } catch (error) {
    return res.status(502).json({ error: "notification_bridge_failure", event_key: ev.event_key, detail: error?.message || "unknown" });
  }
}
