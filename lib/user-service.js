import { ApiError } from "./http.js";
import { query, withTransaction } from "./db.js";
import { getConfig } from "./config.js";
import { hashPassword, ROLES } from "./security.js";
import {
  assertValidPhotoUrl,
  requireString,
  validateBoolean,
  validateCoordinate,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRole,
} from "./validation.js";
import { makeReferralCode, makeReferralUrl, buildTree } from "./referrals.js";

export function normalizeRegisterInput(input) {
  const latitude = validateCoordinate(input.latitude, "latitude", -90, 90);
  const longitude = validateCoordinate(input.longitude, "longitude", -180, 180);
  const role = validateRole(input.role);
  const photoRequired = role !== ROLES.EQUIPE;
  return {
    name: requireString(input.name || input.nome, "name", 3),
    email: validateEmail(input.email),
    phone: validatePhone(input.phone || input.telefone || input.whatsapp),
    password: validatePassword(input.password || input.senha),
    role,
    photoUrl: assertValidPhotoUrl(input.photoUrl || input.photo_url, { required: photoRequired }),
    localidade: requireString(input.localidade || input.bairro, "localidade", 2),
    regiaoAdministrativa: String(input.regiao_administrativa || input.ra || "").trim() || null,
    latitude,
    longitude,
    referralCode: String(input.referralCode || input.referral_code || input.ref || "").trim() || null,
    consentAccepted: validateBoolean(input.consent_accepted ?? input.consentimento ?? input.aceite_lgpd, "consent_accepted"),
  };
}

export async function createUser(input, uploadMetadata, { allowAdminRole = false, appUrl } = {}) {
  const data = normalizeRegisterInput(input);
  if (data.role === ROLES.EQUIPE && !allowAdminRole && process.env.ALLOW_ADMIN_REGISTER !== "true") {
    throw new ApiError(403, "Cadastro publico de perfil administrativo nao permitido.");
  }
  const config = getConfig();
  const passwordHash = await hashPassword(data.password);

  return withTransaction(async (client) => {
    let parentUser = null;
    let rootLeaderId = null;
    let level = 0;

    if (data.referralCode) {
      const referral = await client.query(
        `select lp.user_id, nn.root_leader_id, nn.level
           from leader_profiles lp
           left join network_nodes nn on nn.user_id = lp.user_id
          where lp.referral_code = $1 and lp.active = true`,
        [data.referralCode]
      );
      parentUser = referral.rows[0];
      if (!parentUser) throw new ApiError(400, "Codigo de indicacao invalido.");
      rootLeaderId = parentUser.root_leader_id || parentUser.user_id;
      level = Number(parentUser.level || 0) + 1;
    }

    const userResult = await client.query(
      `insert into users (name, email, phone, password_hash, role, photo_url, consent_accepted, consent_accepted_at)
       values ($1, $2, $3, $4, $5, $6, true, now())
       returning id, name, email, phone, role, photo_url, active, consent_accepted, consent_accepted_at, created_at, updated_at`,
      [data.name, data.email, data.phone, passwordHash, data.role, data.photoUrl]
    );
    const user = userResult.rows[0];

    if ([ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS].includes(data.role) && !rootLeaderId) {
      rootLeaderId = user.id;
      level = 0;
    }

    await client.query(
      `insert into user_locations (user_id, localidade, regiao_administrativa, latitude, longitude)
       values ($1, $2, $3, $4, $5)`,
      [user.id, data.localidade, data.regiaoAdministrativa, data.latitude, data.longitude]
    );

    await client.query(
      `insert into network_nodes (user_id, parent_user_id, root_leader_id, referral_code_used, level)
       values ($1, $2, $3, $4, $5)`,
      [user.id, parentUser?.user_id || null, rootLeaderId, data.referralCode, level]
    );

    if (uploadMetadata) {
      await client.query(
        `insert into profile_photos (user_id, file_url, file_name, mime_type, size)
         values ($1, $2, $3, $4, $5)`,
        [user.id, uploadMetadata.fileUrl, uploadMetadata.fileName, uploadMetadata.mimeType, uploadMetadata.size]
      );
    }

    let leaderProfile = null;
    if ([ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS].includes(data.role)) {
      leaderProfile = await ensureLeaderProfile(client, user.id, appUrl || config.appUrl);
    }

    await client.query(
      "insert into audit_logs (actor_user_id, action, target_user_id, metadata) values ($1, $2, $3, $4)",
      [user.id, "USER_REGISTERED", user.id, JSON.stringify({ role: data.role, referralCode: data.referralCode })]
    );

    return { user, leaderProfile };
  });
}

export async function ensureLeaderProfile(clientOrPool, userId, appUrl) {
  const existing = await clientOrPool.query(
    "select referral_code, referral_url from leader_profiles where user_id = $1 and active = true",
    [userId]
  );
  if (existing.rows[0]) return existing.rows[0];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeReferralCode();
    const url = makeReferralUrl(appUrl, code);
    try {
      const created = await clientOrPool.query(
        `insert into leader_profiles (user_id, referral_code, referral_url)
         values ($1, $2, $3)
         returning referral_code, referral_url`,
        [userId, code, url]
      );
      return created.rows[0];
    } catch (error) {
      if (error.code !== "23505") throw error;
    }
  }
  throw new ApiError(500, "Nao foi possivel gerar codigo unico de indicacao.");
}

export async function getUserByEmail(email) {
  const result = await query("select * from users where lower(email) = lower($1) and active = true", [email]);
  return result.rows[0] || null;
}

export async function getLeaderNetwork(rootLeaderId, { page = 1, limit = 50, tree = false, filters = {} } = {}) {
  const params = [rootLeaderId];
  const where = ["true"];

  if (filters.localidade) {
    params.push(`%${filters.localidade}%`);
    where.push(`ul.localidade ilike $${params.length}`);
  }
  if (filters.regiaoAdministrativa) {
    params.push(filters.regiaoAdministrativa);
    where.push(`ul.regiao_administrativa = $${params.length}`);
  }
  if (filters.level !== undefined && filters.level !== null && filters.level !== "") {
    params.push(Number(filters.level));
    where.push(`nn.level = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    where.push(`u.created_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    where.push(`u.created_at <= $${params.length}`);
  }

  const baseSql = `
    with recursive subtree as (
      select user_id, parent_user_id
        from network_nodes
       where user_id = $1
      union all
      select child.user_id, child.parent_user_id
        from network_nodes child
        join subtree parent on child.parent_user_id = parent.user_id
    )
    select u.id as user_id, u.name, u.email, u.phone, u.role, u.photo_url, u.created_at,
           nn.parent_user_id, nn.root_leader_id, nn.level, nn.referral_code_used,
           ul.localidade, ul.regiao_administrativa, ul.latitude, ul.longitude
      from subtree
      join network_nodes nn on nn.user_id = subtree.user_id
      join users u on u.id = nn.user_id
      left join user_locations ul on ul.user_id = u.id
     where ${where.join(" and ")}
     order by nn.level asc, u.created_at desc`;

  if (tree) {
    const result = await query(baseSql, params);
    return { items: buildTree(result.rows) };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const paged = await query(`${baseSql} limit $${params.length + 1} offset $${params.length + 2}`, [
    ...params,
    Number(limit),
    offset,
  ]);
  const count = await query(
    `with recursive subtree as (
       select user_id, parent_user_id
         from network_nodes
        where user_id = $1
       union all
       select child.user_id, child.parent_user_id
         from network_nodes child
         join subtree parent on child.parent_user_id = parent.user_id
     )
     select count(*)::int as total
       from subtree
       join network_nodes nn on nn.user_id = subtree.user_id
       join users u on u.id = nn.user_id
       left join user_locations ul on ul.user_id = u.id
      where ${where.join(" and ")}`,
    params
  );
  return { items: paged.rows, page: Number(page), limit: Number(limit), total: count.rows[0].total };
}
