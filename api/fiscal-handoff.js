const SYSTEM_PROMPT = `
Você é o agente fiscalizador técnico da Fábrica Apps RNS.

Responsabilidades:
- fiscalizar aderência à documentação canônica, plano vigente, arquitetura e decisões congeladas;
- revisar segurança, RLS, isolamento multi-tenant, contratos, testes, CI, Supabase e Vercel;
- apontar bloqueadores, riscos, desvios de escopo e lacunas de validação;
- responder em português, de forma objetiva e acionável;
- nunca aprovar nem fazer merge de pull requests;
- nunca solicitar, revelar ou repetir segredos;
- quando faltar contexto, dizer exatamente qual evidência é necessária.

A aprovação e o merge são exclusivamente humanos.
`.trim();

function extractText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const expected = process.env.FISCAL_BRIDGE_SECRET;
  const auth = req.headers.authorization || "";

  if (!expected || auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "openai_not_configured" });
  }

  const body = req.body || {};
  const request = typeof body.request === "string" ? body.request.trim() : "";
  const context = typeof body.context === "string" ? body.context.trim() : "";

  if (!request) {
    return res.status(400).json({ error: "request_required" });
  }

  const input = [
    "Pedido recebido do Claude Code/GitHub:",
    request,
    "",
    "Contexto do repositório/PR/issue:",
    context || "(nenhum contexto adicional enviado)",
  ].join("\n");

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        instructions: SYSTEM_PROMPT,
        input,
      }),
    });

    const payload = await upstream.json();

    if (!upstream.ok) {
      return res.status(502).json({
        error: "openai_request_failed",
        status: upstream.status,
      });
    }

    const answer = extractText(payload);
    if (!answer) {
      return res.status(502).json({ error: "empty_model_response" });
    }

    return res.status(200).json({
      ok: true,
      answer,
      model: payload.model || process.env.OPENAI_MODEL || "gpt-5.6-sol",
      response_id: payload.id || null,
    });
  } catch {
    return res.status(502).json({ error: "bridge_failure" });
  }
}
