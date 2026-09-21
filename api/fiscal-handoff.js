import { getHandoff, upsertHandoff } from "./_bridge-store.js";

const SYSTEM_PROMPT = `
Você é o agente fiscalizador técnico da Fábrica Apps RNS.

Responsabilidades:
- fiscalizar aderência à documentação canônica, plano vigente, arquitetura e decisões congeladas;
- revisar segurança, RLS, isolamento multi-tenant, contratos, testes, CI, Supabase e Vercel;
- apontar bloqueadores, riscos, desvios de escopo e lacunas de validação;
- responder em português, de forma objetiva e acionável;
- nunca aprovar nem fazer merge de pull requests;
- nunca solicitar, revelar ou repetir segredos;
- quando faltar contexto, dizer exatamente qual evidência é necessária;
- nunca afirmar que algo foi publicado/recebido sem evidência live confirmada.

A aprovação e o merge são exclusivamente humanos.
`.trim();

function extractText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }
  const chunks = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) chunks.push(part.text);
    }
  }
  return chunks.join("\n").trim();
}

function requiredString(body, key) {
  const value = body?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const secret = process.env.FISCAL_BRIDGE_SECRET;
  const auth = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "openai_not_configured" });

  const body = req.body || {};
  const requestId = requiredString(body, "request_id");
  const repository = requiredString(body, "repository");
  const baseSha = requiredString(body, "base_sha");
  const actor = requiredString(body, "actor");
  const requestText = requiredString(body, "request");
  const sourceCommentUrl = requiredString(body, "source_comment_url");
  const threadNumber = Number(body.thread_number);
  const sourceCommentId = Number(body.source_comment_id);
  const attempt = Math.max(1, Number(body.attempt) || 1);

  if (!requestId || !repository || !baseSha || !actor || !requestText ||
      !Number.isInteger(threadNumber) || !Number.isInteger(sourceCommentId)) {
    return res.status(400).json({ error: "invalid_request_envelope" });
  }

  try {
    const prior = await getHandoff(secret, requestId);
    if (prior?.status === "PUBLISHED" || prior?.status === "ACKNOWLEDGED") {
      return res.status(200).json({
        ok: true,
        request_id: requestId,
        base_sha: prior.base_sha,
        answer: prior.answer,
        response_id: prior.openai_response_id,
        replayed: true,
      });
    }
    if (prior?.status === "COMPLETED" && prior?.answer) {
      return res.status(200).json({
        ok: true,
        request_id: requestId,
        base_sha: prior.base_sha,
        answer: prior.answer,
        response_id: prior.openai_response_id,
        replayed: true,
      });
    }

    const common = {
      requestId, repository, threadNumber, sourceCommentId, sourceCommentUrl,
      baseSha, actor, requestText, attempt,
    };

    await upsertHandoff(secret, { ...common, status: "RECEIVED" });
    await upsertHandoff(secret, { ...common, status: "PROCESSING" });

    const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
    const input = [
      `request_id: ${requestId}`,
      `repository: ${repository}`,
      `thread: #${threadNumber}`,
      `base_sha: ${baseSha}`,
      `requester: ${actor}`,
      sourceCommentUrl ? `source_comment: ${sourceCommentUrl}` : "",
      "",
      "Pedido:",
      requestText,
    ].filter(Boolean).join("\n");

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input,
      }),
    });

    const payload = await upstream.json();
    if (!upstream.ok) {
      await upsertHandoff(secret, {
        ...common,
        status: attempt >= 3 ? "DEAD_LETTER" : "FAILED",
        error: `openai_status_${upstream.status}`,
      });
      return res.status(502).json({ error: "openai_request_failed", status: upstream.status, request_id: requestId });
    }

    const answer = extractText(payload);
    if (!answer) {
      await upsertHandoff(secret, {
        ...common,
        status: attempt >= 3 ? "DEAD_LETTER" : "FAILED",
        error: "empty_model_response",
      });
      return res.status(502).json({ error: "empty_model_response", request_id: requestId });
    }

    await upsertHandoff(secret, {
      ...common,
      status: "COMPLETED",
      answer,
      openaiResponseId: payload.id || null,
    });

    return res.status(200).json({
      ok: true,
      request_id: requestId,
      base_sha: baseSha,
      answer,
      response_id: payload.id || null,
      replayed: false,
    });
  } catch (error) {
    return res.status(502).json({
      error: "bridge_failure",
      request_id: requestId,
      detail: error?.message || "unknown",
    });
  }
}
