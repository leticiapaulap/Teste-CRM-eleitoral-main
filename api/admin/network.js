import { getQuery, handleError, methodNotAllowed, sendJson } from "../../lib/http.js";
import { query } from "../../lib/db.js";
import { requireAuth, ROLES } from "../../lib/security.js";
import { buildTree } from "../../lib/referrals.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE]);
    const q = getQuery(req);
    const result = await query(
      `select u.id as user_id, u.name, u.email, u.phone, u.role, u.photo_url, u.created_at,
              nn.parent_user_id, nn.root_leader_id, nn.level, nn.referral_code_used,
              ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude
         from network_nodes nn
         join users u on u.id = nn.user_id
         left join user_locations ul on ul.user_id = u.id
        order by nn.root_leader_id, nn.level, u.created_at desc`
    );
    const items = q.format === "tree" ? buildTree(result.rows) : result.rows;
    return sendJson(res, 200, { ok: true, items });
  } catch (error) {
    return handleError(res, error);
  }
}
