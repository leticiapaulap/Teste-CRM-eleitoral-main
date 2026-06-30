import { query } from "./db.js";
import { hashPassword, ROLES } from "./security.js";
import { makeReferralCode, makeReferralUrl } from "./referrals.js";
import { repairOrphanReferralLinks } from "./network-repair.js";
import {
  assertValidPhotoUrl,
  requireString,
  validateCoordinate,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRole,
} from "./validation.js";
import { ApiError } from "./http.js";

const CONTACT_MESSAGE_STATUSES = new Set(["NOVO", "LIDO", "RESPONDIDO", "RESOLVIDO"]);

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
  await repairOrphanReferralLinks();
  const page = Number(q.page || 1);
  const limit = Math.min(Number(q.limit || 50), 200);
  const offset = (page - 1) * limit;
  const filters = buildUserFilters(q);
  const params = [...filters.params, limit, offset];

  const result = await query(
    `select u.id, u.name, u.email, u.phone, u.role, u.photo_url, u.active, u.consent_accepted, u.created_at, u.updated_at,
            ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude,
            nn.parent_user_id, nn.root_leader_id, nn.level,
            parent.name as parent_user_name, root.name as root_leader_name,
            lp.referral_code, lp.referral_url
       from users u
       left join user_locations ul on ul.user_id = u.id
       left join network_nodes nn on nn.user_id = u.id
       left join users parent on parent.id = nn.parent_user_id
       left join users root on root.id = nn.root_leader_id
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
        set referral_url = $1 || '/?ref=' || referral_code
      where referral_url like 'http://localhost:%'
         or referral_url like 'https://localhost:%'
         or referral_url like '%/cadastro?ref=%'`,
    [appUrl.replace(/\/$/, "")]
  );
}

export async function getUserProfile(id) {
  await repairOrphanReferralLinks();
  const result = await query(
    `select u.id, u.name, u.email, u.phone, u.role, u.photo_url, u.active, u.consent_accepted, u.consent_accepted_at, u.created_at, u.updated_at,
            ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude,
            nn.parent_user_id, parent.name as parent_user_name,
            nn.root_leader_id, root.name as root_leader_name,
            nn.level, nn.referral_code_used,
            lp.referral_code, lp.referral_url
       from users u
       left join user_locations ul on ul.user_id = u.id
       left join network_nodes nn on nn.user_id = u.id
       left join users parent on parent.id = nn.parent_user_id
       left join users root on root.id = nn.root_leader_id
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
  if (input.password !== undefined || input.senha !== undefined) {
    setUser("password_hash", await hashPassword(validatePassword(input.password || input.senha)));
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
  const result = await query("delete from users where id = $1 returning id", [id]);
  if (!result.rows[0]) throw new ApiError(404, "Usuario nao encontrado.");
}

async function ensureContactMessageSupportSchema() {
  await query(`create table if not exists contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text,
    phone text,
    message text not null,
    status text not null default 'NOVO',
    created_at timestamptz not null default now()
  )`);
  await query("alter table contact_messages add column if not exists user_id uuid references users(id) on delete set null");
  await query("alter table contact_messages add column if not exists reply text");
  await query("alter table contact_messages add column if not exists replied_at timestamptz");
  await query("alter table contact_messages drop constraint if exists contact_messages_status_check");
  await query("alter table contact_messages add constraint contact_messages_status_check check (status in ('NOVO', 'LIDO', 'RESPONDIDO', 'RESOLVIDO'))");
  await query("create index if not exists contact_messages_user_id_idx on contact_messages (user_id)");
}

export async function createContactMessage(input = {}) {
  await ensureContactMessageSupportSchema();
  const name = requireString(input.name || input.nome, "name", 2);
  const message = requireString(input.message || input.mensagem, "message", 2);
  const email = input.email ? validateEmail(input.email) : null;
  const phone = input.phone || input.telefone || input.whatsapp ? validatePhone(input.phone || input.telefone || input.whatsapp) : null;
  const userId = input.user_id || input.userId || null;

  const result = await query(
    `insert into contact_messages (user_id, name, email, phone, message)
     values ($1, $2, $3, $4, $5)
     returning id, user_id, name, email, phone, message, reply, replied_at, status, created_at`,
    [userId, name, email, phone, message]
  );
  return result.rows[0];
}

export async function listContactMessages(q = {}) {
  await ensureContactMessageSupportSchema();
  const limit = Math.min(Number(q.limit || 50), 200);
  const params = [limit];
  const where = [];
  if (q.user_id || q.userId) {
    params.push(q.user_id || q.userId);
    where.push(`cm.user_id = $${params.length}`);
  }
  const result = await query(
    `select cm.id, cm.user_id, cm.name, cm.email, cm.phone, cm.message, cm.reply, cm.replied_at, cm.status, cm.created_at,
            u.name as user_name
       from contact_messages cm
       left join users u on u.id = cm.user_id
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by cm.created_at desc
      limit $1`,
    params
  );
  return { items: result.rows };
}

export async function replyContactMessage(id, input = {}) {
  await ensureContactMessageSupportSchema();
  const hasReply = input.reply !== undefined || input.resposta !== undefined;
  const reply = hasReply ? requireString(input.reply || input.resposta, "reply", 2) : null;
  const status = normalizeContactMessageStatus(input.status || (hasReply ? "RESPONDIDO" : ""));
  if (!hasReply && !status) throw new ApiError(400, "Informe uma resposta ou status.");

  if (!hasReply) {
    const result = await query(
      `update contact_messages
          set status = $2
        where id = $1
        returning id, user_id, name, email, phone, message, reply, replied_at, status, created_at`,
      [id, status]
    );
    if (!result.rows[0]) throw new ApiError(404, "Mensagem nao encontrada.");
    return result.rows[0];
  }

  const result = await query(
    `update contact_messages
        set reply = $2,
            replied_at = now(),
            status = $3
      where id = $1
      returning id, user_id, name, email, phone, message, reply, replied_at, status, created_at`,
    [id, reply, status || "RESPONDIDO"]
  );
  if (!result.rows[0]) throw new ApiError(404, "Mensagem nao encontrada.");
  return result.rows[0];
}

export async function deleteContactMessage(id) {
  await ensureContactMessageSupportSchema();
  const result = await query("delete from contact_messages where id = $1 returning id", [id]);
  if (!result.rows[0]) throw new ApiError(404, "Mensagem nao encontrada.");
}

function normalizeContactMessageStatus(status) {
  const value = String(status || "").trim().toUpperCase();
  if (!value) return "";
  if (!CONTACT_MESSAGE_STATUSES.has(value)) throw new ApiError(400, "Status de mensagem invalido.");
  return value;
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
