import { handleError, methodNotAllowed, sendJson } from "../../../lib/http.js";
import { query } from "../../../lib/db.js";
import { requireAuth, ROLES } from "../../../lib/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req, [ROLES.LIDER]);
    const totals = await query(
      `with recursive subtree as (
         select user_id, parent_user_id
           from network_nodes
          where user_id = $1
         union all
         select child.user_id, child.parent_user_id
           from network_nodes child
           join subtree parent on child.parent_user_id = parent.user_id
       )
       select count(*)::int as total,
              count(*) filter (where u.photo_url is not null)::int as total_com_foto,
              count(*) filter (where ul.latitude is not null and ul.longitude is not null)::int as total_com_localizacao
         from subtree
         join network_nodes nn on nn.user_id = subtree.user_id
         join users u on u.id = nn.user_id
         left join user_locations ul on ul.user_id = u.id
        where true`,
      [user.id]
    );
    const byLevel = await query(
      `with recursive subtree as (
         select user_id, parent_user_id
           from network_nodes
          where user_id = $1
         union all
         select child.user_id, child.parent_user_id
           from network_nodes child
           join subtree parent on child.parent_user_id = parent.user_id
       )
       select nn.level, count(*)::int as total
         from subtree
         join network_nodes nn on nn.user_id = subtree.user_id
        group by nn.level
        order by nn.level`,
      [user.id]
    );
    return sendJson(res, 200, { ok: true, totals: totals.rows[0], byLevel: byLevel.rows });
  } catch (error) {
    return handleError(res, error);
  }
}
