import { getQuery, handleError, methodNotAllowed, sendJson } from "../../../lib/http.js";
import { requireAuth, ROLES } from "../../../lib/security.js";
import { getLeaderNetwork } from "../../../lib/user-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req, [ROLES.LIDER]);
    const q = getQuery(req);
    const result = await getLeaderNetwork(user.id, {
      page: q.page || 1,
      limit: q.limit || 50,
      tree: q.format === "tree",
      filters: {
        localidade: q.localidade,
        regiaoAdministrativa: q.regiao_administrativa,
        level: q.level,
        from: q.from,
        to: q.to,
      },
    });
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
}
