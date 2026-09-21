const SUPABASE_URL = "https://lwjhekfwlnqncxwureda.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Syec7QZsvPOIzyr6rvR_Dg_-EPQhsqL";

async function rpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (!response.ok) {
    const err = new Error(`Supabase RPC ${name} failed with ${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export async function getHandoff(secret, requestId) {
  return rpc("agent_bridge_get", {
    p_bridge_secret: secret,
    p_request_id: requestId,
  });
}

export async function upsertHandoff(secret, input) {
  return rpc("agent_bridge_upsert", {
    p_bridge_secret: secret,
    p_request_id: input.requestId,
    p_repository: input.repository,
    p_thread_number: input.threadNumber,
    p_source_comment_id: input.sourceCommentId,
    p_source_comment_url: input.sourceCommentUrl || null,
    p_base_sha: input.baseSha,
    p_actor: input.actor,
    p_request_text: input.requestText,
    p_status: input.status,
    p_attempt: input.attempt || 0,
    p_answer: input.answer || null,
    p_openai_response_id: input.openaiResponseId || null,
    p_github_comment_id: input.githubCommentId || null,
    p_github_comment_url: input.githubCommentUrl || null,
    p_error: input.error || null,
  });
}
