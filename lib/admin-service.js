import { query } from "./db.js";
import { ROLES } from "./security.js";

export function buildUserFilters(q, baseParamCount = 0) {
  const params = [];
  const where = ["u.active = true"];

  if (q.role) {
    params.push(String(q.role).toUpperCase());
    where.push(`u.role = $${baseParamCount + params.length}`);
  }
  if (q.localidade) {
    params.push(`%${q.localidade}%`);
    where.push(`ul.localidade ilike $${baseParamCount + params.length}`);
  }
  if (q.regiao_administrativa) {
    params.push(q.regiao_administrativa);
    where.push(`ul.regiao_administrativa = $${baseParamCount + params.length}`);
  }
  if (q.from) {
    params.push(q.from);
    where.push(`u.created_at >= $${baseParamCount + params.length}`);
  }
  if (q.to) {
    params.push(q.to);
    where.push(`u.created_at <= $${baseParamCount + params.length}`);
  }

  return { where, params };
}

export async function listUsers(q = {}) {
  const page = Number(q.page || 1);
  const limit = Math.min(Number(q.limit || 50), 200);
  const offset = (page - 1) * limit;
  const filters = buildUserFilters(q);
  const params = [...filters.params, limit, offset];

  const result = await query(
    `select u.id, u.name, u.email, u.phone, u.role, u.photo_url, u.active, u.consent_accepted, u.created_at, u.updated_at,
            ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude,
            nn.parent_user_id, nn.root_leader_id, nn.level
       from users u
       left join user_locations ul on ul.user_id = u.id
       left join network_nodes nn on nn.user_id = u.id
      where ${filters.where.join(" and ")}
      order by u.created_at desc
      limit $${filters.params.length + 1} offset $${filters.params.length + 2}`,
    params
  );
  const count = await query(
    `select count(*)::int as total from users u left join user_locations ul on ul.user_id = u.id where ${filters.where.join(" and ")}`,
    filters.params
  );
  return { items: result.rows, page, limit, total: count.rows[0].total };
}

export async function getAdminMetrics() {
  const totals = await query(
    `select count(*)::int as total_usuarios,
            count(*) filter (where role = '${ROLES.LIDERES}')::int as total_lideres,
            count(*) filter (where photo_url is not null)::int as total_com_foto,
            count(*) filter (where ul.latitude is not null and ul.longitude is not null)::int as total_com_localizacao,
            count(*) filter (where ul.latitude is null or ul.longitude is null)::int as total_sem_localizacao
       from users u
       left join user_locations ul on ul.user_id = u.id
      where u.active = true`
  );
  const byRegion = await query(
    `select coalesce(ul.regiao_administrativa, ul.localidade, 'Nao informado') as localidade, count(*)::int as total
       from users u
       left join user_locations ul on ul.user_id = u.id
      where u.active = true
      group by 1
      order by total desc`
  );
  const byLeader = await query(
    `select root.id as leader_id, root.name as leader_name, count(nn.user_id)::int as total
       from network_nodes nn
       join users root on root.id = nn.root_leader_id
      group by root.id, root.name
      order by total desc`
  );
  const byLevel = await query(
    "select level, count(*)::int as total from network_nodes group by level order by level"
  );
  const byPeriod = await query(
    `select date_trunc('day', created_at)::date as data, count(*)::int as total
       from users
      where active = true
      group by 1
      order by 1 desc
      limit 90`
  );

  return {
    totals: totals.rows[0],
    byRegion: byRegion.rows,
    byLeader: byLeader.rows,
    byLevel: byLevel.rows,
    byPeriod: byPeriod.rows,
  };
}
