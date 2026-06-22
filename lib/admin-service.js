import { query } from "./db.js";
import { ROLES } from "./security.js";
import { makeReferralCode, makeReferralUrl } from "./referrals.js";
import {
  assertValidPhotoUrl,
  requireString,
  validateCoordinate,
  validateEmail,
  validatePhone,
  validateRole,
} from "./validation.js";
import { ApiError } from "./http.js";

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
            nn.parent_user_id, nn.root_leader_id, nn.level,
            lp.referral_code, lp.referral_url
       from users u
       left join user_locations ul on ul.user_id = u.id
       left join network_nodes nn on nn.user_id = u.id
       left join leader_profiles lp on lp.user_id = u.id and lp.active = true
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

export async function ensureReferralLinksForAll(appUrl) {
  const result = await query(
    `select u.id
       from users u
       left join leader_profiles lp on lp.user_id = u.id and lp.active = true
      where u.active = true and lp.user_id is null`
  );

  for (const row of result.rows) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = makeReferralCode();
      try {
        await query(
          `insert into leader_profiles (user_id, referral_code, referral_url)
           values ($1, $2, $3)
           on conflict (user_id) do nothing`,
          [row.id, code, makeReferralUrl(appUrl, code)]
        );
        break;
      } catch (error) {
        if (error.code !== "23505") throw error;
      }
    }
  }

  await query(
    `update leader_profiles
        set referral_url = $1 || '/cadastro?ref=' || referral_code
      where referral_url like 'http://localhost:%'
         or referral_url like 'https://localhost:%'`,
    [appUrl.replace(/\/$/, "")]
  );
}

export async function getUserProfile(id) {
  const result = await query(
    `select u.id, u.name, u.email, u.phone, u.role, u.photo_url, u.active, u.consent_accepted, u.consent_accepted_at, u.created_at, u.updated_at,
            ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude,
            nn.parent_user_id, nn.root_leader_id, nn.level,
            lp.referral_code, lp.referral_url
       from users u
       left join user_locations ul on ul.user_id = u.id
       left join network_nodes nn on nn.user_id = u.id
       left join leader_profiles lp on lp.user_id = u.id and lp.active = true
      where u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateUser(id, input = {}) {
  const existing = await getUserProfile(id);
  if (!existing) throw new ApiError(404, "Usuario nao encontrado.");

  const role = input.role !== undefined ? validateRole(input.role) : existing.role;
  const userUpdates = [];
  const userParams = [];

  function setUser(column, value) {
    userParams.push(value);
    userUpdates.push(`${column} = $${userParams.length}`);
  }

  if (input.name !== undefined || input.nome !== undefined) setUser("name", requireString(input.name || input.nome, "name", 3));
  if (input.email !== undefined) setUser("email", validateEmail(input.email));
  if (input.phone !== undefined || input.telefone !== undefined || input.whatsapp !== undefined) {
    setUser("phone", validatePhone(input.phone || input.telefone || input.whatsapp));
  }
  if (input.role !== undefined) setUser("role", role);
  if (input.photoUrl !== undefined || input.photo_url !== undefined) {
    setUser("photo_url", assertValidPhotoUrl(input.photoUrl || input.photo_url, { required: role !== ROLES.EQUIPE }));
  }
  if (role !== ROLES.EQUIPE && !existing.photo_url && input.photoUrl === undefined && input.photo_url === undefined) {
    throw new ApiError(400, "Foto obrigatoria para coordenadores, lideres e cadastrados.");
  }
  if (input.active !== undefined) setUser("active", input.active === true || input.active === "true" || input.active === "1" || input.active === 1);

  if (userUpdates.length) {
    userParams.push(id);
    await query(`update users set ${userUpdates.join(", ")} where id = $${userParams.length}`, userParams);
  }

  const hasLocation =
    input.localidade !== undefined ||
    input.bairro !== undefined ||
    input.regiao_administrativa !== undefined ||
    input.ra !== undefined ||
    input.latitude !== undefined ||
    input.longitude !== undefined;

  if (hasLocation) {
    const localidade = input.localidade !== undefined || input.bairro !== undefined
      ? requireString(input.localidade || input.bairro, "localidade", 2)
      : existing.localidade;
    const regiaoAdministrativa = input.regiao_administrativa !== undefined || input.ra !== undefined
      ? String(input.regiao_administrativa || input.ra || "").trim() || null
      : existing.regiao_administrativa;
    const latitude = input.latitude !== undefined
      ? validateCoordinate(input.latitude, "latitude", -90, 90)
      : existing.latitude;
    const longitude = input.longitude !== undefined
      ? validateCoordinate(input.longitude, "longitude", -180, 180)
      : existing.longitude;

    await query(
      `insert into user_locations (user_id, localidade, regiao_administrativa, latitude, longitude)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id) do update
         set localidade = excluded.localidade,
             regiao_administrativa = excluded.regiao_administrativa,
             latitude = excluded.latitude,
             longitude = excluded.longitude`,
      [id, localidade, regiaoAdministrativa, latitude, longitude]
    );
  }

  return getUserProfile(id);
}

export async function deleteUser(id) {
  const result = await query("update users set active = false where id = $1 returning id", [id]);
  if (!result.rows[0]) throw new ApiError(404, "Usuario nao encontrado.");
}

export async function createContactMessage(input = {}) {
  const name = requireString(input.name || input.nome, "name", 2);
  const message = requireString(input.message || input.mensagem, "message", 5);
  const email = input.email ? validateEmail(input.email) : null;
  const phone = input.phone || input.telefone || input.whatsapp ? validatePhone(input.phone || input.telefone || input.whatsapp) : null;

  const result = await query(
    `insert into contact_messages (name, email, phone, message)
     values ($1, $2, $3, $4)
     returning id, name, email, phone, message, status, created_at`,
    [name, email, phone, message]
  );
  return result.rows[0];
}

export async function listContactMessages(q = {}) {
  const limit = Math.min(Number(q.limit || 50), 200);
  const result = await query(
    `select id, name, email, phone, message, status, created_at
       from contact_messages
      order by created_at desc
      limit $1`,
    [limit]
  );
  return { items: result.rows };
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
