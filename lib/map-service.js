import { query } from "./db.js";
import { repairOrphanReferralLinks } from "./network-repair.js";
import { canManageNetwork, isAdminRole, ROLES } from "./security.js";

function addMapFilters(q, params, where) {
  const role = q.role;
  const localidade = q.localidade;
  const regiaoAdministrativa = q.regiao_administrativa || q.regiaoAdministrativa;
  const leaderId = q.leader_id || q.leaderId || q.root_leader_id;
  const referralCode = q.referralCode || q.referral_code;

  if (role) {
    params.push(String(role).toUpperCase());
    where.push(`u.role = $${params.length}`);
  }
  if (localidade) {
    params.push(`%${localidade}%`);
    where.push(`ul.localidade ilike $${params.length}`);
  }
  if (regiaoAdministrativa) {
    params.push(regiaoAdministrativa);
    where.push(`ul.regiao_administrativa = $${params.length}`);
  }
  if (leaderId) {
    params.push(leaderId);
    where.push(`nn.root_leader_id = $${params.length}`);
  }
  if (referralCode) {
    params.push(referralCode);
    where.push(`nn.referral_code_used = $${params.length}`);
  }
  if (q.level !== undefined && q.level !== null && q.level !== "") {
    params.push(Number(q.level));
    where.push(`nn.level = $${params.length}`);
  }
  if (q.from) {
    params.push(q.from);
    where.push(`u.created_at >= $${params.length}`);
  }
  if (q.to) {
    params.push(q.to);
    where.push(`u.created_at <= $${params.length}`);
  }
}

function mapSelect(fromClause, where) {
  return `
    select u.id,
           u.name,
           u.role,
           u.photo_url,
           u.created_at,
           ul.localidade,
           ul.regiao_administrativa,
           ul.latitude,
           ul.longitude,
           nn.root_leader_id,
           root.name as root_leader_name,
           nn.parent_user_id,
           parent.name as parent_user_name,
           nn.level
      ${fromClause}
      join users u on u.id = nn.user_id
      left join users root on root.id = nn.root_leader_id
      left join users parent on parent.id = nn.parent_user_id
      left join user_locations ul on ul.user_id = u.id
     where ${where.join(" and ")}
     order by ul.regiao_administrativa nulls last, nn.level asc, u.created_at desc`;
}

export async function listMapPoints(currentUser, q = {}) {
  await repairOrphanReferralLinks();
  const params = [];
  const where = ["u.active = true"];
  let fromClause = "from network_nodes nn";

  if (q.requireCoordinates !== "false") {
    where.push("ul.latitude is not null", "ul.longitude is not null");
  }

  if (isAdminRole(currentUser.role)) {
    addMapFilters(q, params, where);
  } else if (canManageNetwork(currentUser.role)) {
    params.push(currentUser.id);
    fromClause = `from (
      with recursive subtree as (
        select user_id, parent_user_id
          from network_nodes
         where user_id = $1
        union all
        select child.user_id, child.parent_user_id
          from network_nodes child
          join subtree parent on child.parent_user_id = parent.user_id
      )
      select node.*
        from subtree
        join network_nodes node on node.user_id = subtree.user_id
    ) nn`;
    addMapFilters(
      { ...q, leader_id: undefined, leaderId: undefined, root_leader_id: undefined },
      params,
      where
    );
  }

  const result = await query(mapSelect(fromClause, where), params);
  return result.rows;
}

export async function getMapSummary(currentUser, q = {}) {
  const points = await listMapPoints(currentUser, { ...q, requireCoordinates: "false" });
  const byRegion = new Map();
  const byLeader = new Map();

  for (const point of points) {
    const region = point.regiao_administrativa || point.localidade || "Nao informado";
    byRegion.set(region, (byRegion.get(region) || 0) + 1);

    const leaderId = point.root_leader_id || "sem_lider";
    const current = byLeader.get(leaderId) || {
      leaderId,
      leaderName: point.root_leader_name || "Sem lider",
      total: 0,
    };
    current.total += 1;
    byLeader.set(leaderId, current);
  }

  return {
    total: points.length,
    byRegion: [...byRegion.entries()].map(([regiaoAdministrativa, total]) => ({ regiaoAdministrativa, total })),
    byLeader: [...byLeader.values()],
  };
}

export function toGeoJson(points) {
  return {
    type: "FeatureCollection",
    features: points
      .filter((point) => point.latitude !== null && point.longitude !== null)
      .map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(point.longitude), Number(point.latitude)],
        },
        properties: {
          id: point.id,
          name: point.name,
          role: point.role,
          photo_url: point.photo_url,
          localidade: point.localidade,
          regiao_administrativa: point.regiao_administrativa,
          root_leader_id: point.root_leader_id,
          root_leader_name: point.root_leader_name,
          parent_user_id: point.parent_user_id,
          parent_user_name: point.parent_user_name,
          level: point.level,
          created_at: point.created_at,
        },
      })),
  };
}
