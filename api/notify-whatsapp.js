const MAX_TEXT = 900;

function required(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function clip(value, max = MAX_TEXT) { const text = required(value) || ""; return text.length <= max ? text : text.slice(0, max - 1) + "…"; }

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method_not_allowed" }); }
  const bridgeSecret = process.env.NOTIFICATION_BRIDGE_SECRET;
  if (!bridgeSecret || req.headers.authorization !== `Bearer ${bridgeSecret}`) return res.status(401).json({ error: "unauthorized" });
  const body = req.body || {};
  const eventKey = required(body.event_key), title = required(body.title), summary = required(body.summary), url = required(body.url);
  if (!eventKey || !title || !summary) return res.status(400).json({ error: "invalid_notification" });
  const token = process.env.WHATSAPP_ACCESS_TOKEN, phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID, recipient = process.env.WHATSAPP_TO, graphVersion = process.env.WHATSAPP_GRAPH_VERSION, templateName = process.env.WHATSAPP_TEMPLATE_NAME, templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR";
  if (!token || !phoneNumberId || !recipient || !graphVersion || !templateName) return res.status(503).json({ error: "whatsapp_not_configured", event_key: eventKey });
  const endpoint = `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(phoneNumberId)}/messages`;
  const payload = { messaging_product: "whatsapp", to: recipient, type: "template", template: { name: templateName, language: { code: templateLanguage }, components: [{ type: "body", parameters: [{ type: "text", text: clip(title, 180) }, { type: "text", text: clip(summary, 700) }, { type: "text", text: clip(url || "Sem link", 300) }] }] } };
  try {
    const upstream = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: "whatsapp_send_failed", event_key: eventKey, status: upstream.status });
    return res.status(200).json({ ok: true, event_key: eventKey, message_id: data?.messages?.[0]?.id || null });
  } catch (error) { return res.status(502).json({ error: "notification_bridge_failure", event_key: eventKey, detail: error?.message || "unknown" }); }
}
