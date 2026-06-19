import { methodNotAllowed, sendJson, handleError } from "../../lib/http.js";
import { requireAuth } from "../../lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req);
    return sendJson(res, 200, { ok: true, user });
  } catch (error) {
    return handleError(res, error);
  }
}
