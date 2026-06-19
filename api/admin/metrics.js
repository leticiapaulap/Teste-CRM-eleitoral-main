import { handleError, methodNotAllowed, sendJson } from "../../lib/http.js";
import { requireAuth, ROLES } from "../../lib/security.js";
import { getAdminMetrics } from "../../lib/admin-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE]);
    const metrics = await getAdminMetrics();
    return sendJson(res, 200, { ok: true, metrics });
  } catch (error) {
    return handleError(res, error);
  }
}
