export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });
}

export function handleError(res, error) {
  const status = error instanceof ApiError ? error.status : 500;
  const payload = {
    ok: false,
    error: error instanceof ApiError ? error.message : status === 500 ? "Erro interno." : error.message,
  };
  if (error.details) payload.details = error.details;
  if (status >= 500) console.error("[api:error]", error.message);
  return sendJson(res, status, payload);
}

export async function readJsonOrForm(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const contentType = req.headers["content-type"] || "";

  if (!raw) return {};
  if (contentType.includes("application/json")) return JSON.parse(raw);
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  throw new ApiError(415, "Content-Type nao suportado.");
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export function getQuery(req) {
  if (req.query) return req.query;
  const url = new URL(req.url, "http://localhost");
  return Object.fromEntries(url.searchParams.entries());
}
