import { getQuery, handleError, methodNotAllowed, sendJson } from "../../lib/http.js";
import { requireAuth, ROLES } from "../../lib/security.js";
import { listMapPoints, toGeoJson } from "../../lib/map-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE, ROLES.LIDER]);
    const items = await listMapPoints(user, getQuery(req));
    return sendJson(res, 200, toGeoJson(items));
  } catch (error) {
    return handleError(res, error);
  }
}
