export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método não permitido" });
  }

  try {
    const scriptUrl = process.env.SIV_APPS_SCRIPT_URL;
    if (!scriptUrl) {
      return res.status(500).json({ ok: false, error: "SIV_APPS_SCRIPT_URL não configurado no Vercel." });
    }

    // ✅ captura IP real do usuário
    const xff = req.headers["x-forwarded-for"];
    const ip =
      (typeof xff === "string" && xff.trim())
        ? xff.split(",")[0].trim()
        : (req.socket?.remoteAddress || "");

    const bodyObj =
      typeof req.body === "string"
        ? Object.fromEntries(new URLSearchParams(req.body))
        : (req.body || {});

    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(bodyObj)) params.set(k, String(v));

    // ✅ manda IP pro Apps Script
    params.set("ip", ip);

    const r = await fetch(scriptUrl, { method: "POST", body: params });
    const text = await r.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(200).json({
        ok: false,
        error: "Apps Script não retornou JSON (provável erro no Apps Script ou Deploy).",
        status: r.status,
        raw_preview: text.slice(0, 500),
      });
    }

    return res.status(200).json(json);

  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
