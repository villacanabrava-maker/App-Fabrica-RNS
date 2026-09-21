import { getHandoff, upsertHandoff } from "./_bridge-store.js";

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

  const body = req.body || {};
  const requestId = requiredString(body, "request_id");
  const status = requiredString(body, "status");
  if (!requestId || !status) {
    return res.status(400).json({ error: "request_id_and_status_required" });
  }

  const allowed = new Set(["PUBLISHED", "ACKNOWLEDGED", "STALE", "FAILED", "DEAD_LETTER"]);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: "invalid_status" });
  }

  try {
    const prior = await getHandoff(secret, requestId);
    if (!prior) return res.status(404).json({ error: "request_not_found" });

    const result = await upsertHandoff(secret, {
      requestId,
      repository: requiredString(body, "repository") || "unknown/unknown",
      threadNumber: Number(body.thread_number) || 0,
      sourceCommentId: Number(body.source_comment_id) || 0,
      sourceCommentUrl: requiredString(body, "source_comment_url"),
      baseSha: requiredString(body, "base_sha") || prior.base_sha,
      actor: requiredString(body, "actor") || "system",
      requestText: requiredString(body, "request") || "status_update",
      status,
      attempt: Number(body.attempt) || prior.attempt || 0,
      answer: prior.answer || null,
      openaiResponseId: prior.openai_response_id || null,
      githubCommentId: body.github_comment_id ? Number(body.github_comment_id) : null,
      githubCommentUrl: requiredString(body, "github_comment_url"),
      error: requiredString(body, "error"),
    });

    return res.status(200).json({ ok: true, request_id: requestId, status: result?.status || status });
  } catch (error) {
    return res.status(502).json({ error: "status_update_failed", detail: error?.message || "unknown" });
  }
}
