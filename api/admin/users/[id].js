import { ApiError, handleError, methodNotAllowed, sendJson } from "../../../lib/http.js";
import { query } from "../../../lib/db.js";
import { requireAuth, ROLES } from "../../../lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    await requireAuth(req, [ROLES.DEPUTADO, ROLES.EQUIPE]);
    const id = req.query?.id;
    const result = await query(
      `select u.id, u.name, u.email, u.phone, u.role, u.photo_url, u.active, u.consent_accepted, u.consent_accepted_at, u.created_at, u.updated_at,
              ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude,
              nn.parent_user_id, nn.root_leader_id, nn.level
         from users u
         left join user_locations ul on ul.user_id = u.id
         left join network_nodes nn on nn.user_id = u.id
        where u.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new ApiError(404, "Usuario nao encontrado.");
    return sendJson(res, 200, { ok: true, user: result.rows[0] });
  } catch (error) {
    return handleError(res, error);
  }
}
