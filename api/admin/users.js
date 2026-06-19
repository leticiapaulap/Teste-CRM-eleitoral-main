import { getQuery, handleError, methodNotAllowed, sendJson } from "../../lib/http.js";
import { requireAuth, ROLES } from "../../lib/security.js";
import { listUsers } from "../../lib/admin-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE]);
    const result = await listUsers(getQuery(req));
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
