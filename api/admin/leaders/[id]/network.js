import { getQuery, handleError, methodNotAllowed, sendJson } from "../../../../lib/http.js";
import { requireAuth, ROLES } from "../../../../lib/security.js";
import { getLeaderNetwork } from "../../../../lib/user-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE]);
    const q = getQuery(req);
    const leaderId = req.query?.id || q.id;
    const result = await getLeaderNetwork(leaderId, {
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
