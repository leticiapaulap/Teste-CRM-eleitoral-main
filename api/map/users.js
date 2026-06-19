import { getQuery, handleError, methodNotAllowed, sendJson } from "../../lib/http.js";
import { requireAuth, ROLES } from "../../lib/security.js";
import { getMapSummary, listMapPoints } from "../../lib/map-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE, ROLES.LIDER]);
    const q = getQuery(req);
    const items = await listMapPoints(user, q);
    const summary = await getMapSummary(user, q);
    return sendJson(res, 200, { ok: true, items, summary });
  } catch (error) {
    return handleError(res, error);
  }
}
