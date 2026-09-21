const MAX_TEXT = 3500;

function required(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clip(value, max = MAX_TEXT) {
  const text = required(value) || "";
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

  const body = req.body || {};
  const eventKey = required(body.event_key);
  const title = required(body.title);
  const summary = required(body.summary);
  const url = required(body.url);

  if (!eventKey || !title || !summary) {
    return res.status(400).json({ error: "invalid_notification" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(503).json({
      error: "telegram_not_configured",
      event_key: eventKey,
      missing: [
        !token && "TELEGRAM_BOT_TOKEN",
        !chatId && "TELEGRAM_CHAT_ID",
      ].filter(Boolean),
    });
  }

  const text = [
    `<b>${escapeHtml(clip(title, 180))}</b>`,
    "",
    escapeHtml(clip(summary, 2800)),
    url ? "" : null,
    url ? `<a href="${escapeHtml(url)}">Abrir no GitHub</a>` : null,
    "",
    `<code>${escapeHtml(eventKey)}</code>`,
  ].filter((line) => line !== null).join("\n");

  try {
    const upstream = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    const data = await upstream.json();
    if (!upstream.ok || !data?.ok) {
      return res.status(502).json({
        error: "telegram_send_failed",
        event_key: eventKey,
        status: upstream.status,
      });
    }

    return res.status(200).json({
      ok: true,
      event_key: eventKey,
      message_id: data?.result?.message_id || null,
      chat_id: data?.result?.chat?.id || null,
    });
  } catch (error) {
    return res.status(502).json({
      error: "notification_bridge_failure",
      event_key: eventKey,
      detail: error?.message || "unknown",
    });
  }
}
