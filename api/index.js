import { ApiError, getQuery, handleError, methodNotAllowed, readJsonOrForm, sanitizeUser, sendJson } from "../lib/http.js";

export const config = { api: { bodyParser: false } };

function getRoute(req) {
  const route = req.query?.route;
  if (Array.isArray(route)) return route.join("/");
  if (typeof route === "string") return route;
  return new URL(req.url, "http://localhost").pathname.replace(/^\/api\//, "");
}

function getDynamicId(route, pattern) {
  const routeParts = route.split("/");
  const patternParts = pattern.split("/");
  if (routeParts.length !== patternParts.length) return null;

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = routeParts[index];
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = actual;
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

function getPublicAppUrl(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || req.headers.host;
  const proto = forwardedProto || (host?.includes("localhost") ? "http" : "https");
  if (host && !String(host).includes("localhost")) return `${proto}://${host}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  const fallback = process.env.APP_URL || "http://localhost:3000";
  return fallback.replace(/\/$/, "");
}

async function authRegister(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { parseMultipart } = await import("../lib/multipart.js");
  const { storeProfilePhoto } = await import("../lib/storage.js");
  const { createUser } = await import("../lib/user-service.js");
  const { signToken } = await import("../lib/security.js");

  const contentType = req.headers["content-type"] || "";
  let input;
  let uploadMetadata = null;

  if (contentType.includes("multipart/form-data")) {
    const { fields, files } = await parseMultipart(req);
    const file = files.photo || files.foto || files.profilePhoto;
    if (file) {
      uploadMetadata = await storeProfilePhoto(file);
    }
    input = { ...fields, photoUrl: uploadMetadata?.fileUrl };
  } else {
    input = await readJsonOrForm(req);
  }

  const result = await createUser(input, uploadMetadata, { appUrl: getPublicAppUrl(req) });
  const token = signToken(result.user);
  return sendJson(res, 201, { ok: true, user: result.user, leaderProfile: result.leaderProfile, token });
}

async function sivRegister(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { randomBytes } = await import("node:crypto");
  const { createUser } = await import("../lib/user-service.js");
  const { ROLES } = await import("../lib/security.js");
  const input = await readJsonOrForm(req);
  const phone = String(input.whatsapp || input.phone || input.telefone || "").replace(/\D/g, "");
  const generatedEmail = `${phone || randomBytes(4).toString("hex")}.${Date.now()}@cadastro.siv.local`;
  const result = await createUser(
    {
      name: input.name || input.nome,
      email: input.email || generatedEmail,
      phone: input.phone || input.telefone || input.whatsapp,
      password: input.password || randomBytes(12).toString("hex"),
      role: ROLES.CADASTRADOS,
      photoUrl: input.photoUrl || input.photo_url || "/img/LOGO-SIV.png",
      localidade: input.localidade || input.bairro,
      regiao_administrativa: input.regiao_administrativa || input.ra,
      referralCode: input.referralCode || input.referral_code || input.ref,
      consent_accepted: input.consent_accepted ?? input.aceite_lgpd ?? true,
    },
    null,
    { appUrl: getPublicAppUrl(req) }
  );
  return sendJson(res, 201, {
    ok: true,
    codigo_pessoa: result.leaderProfile?.referral_code,
    invite_link: result.leaderProfile?.referral_url,
    user: result.user,
  });
}

async function authLogin(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { canLogin, signToken, verifyPassword } = await import("../lib/security.js");
  const { getUserByEmail } = await import("../lib/user-service.js");
  const { requireString, validateEmail } = await import("../lib/validation.js");

  const body = await readJsonOrForm(req);
  const email = validateEmail(body.email);
  const password = requireString(body.password || body.senha, "password");
  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new ApiError(401, "Credenciais invalidas.");
  }
  if (!canLogin(user.role)) {
    throw new ApiError(403, "Login permitido apenas para equipe e coordenadores.");
  }
  const token = signToken(user);
  return sendJson(res, 200, { ok: true, token, user: sanitizeUser(user) });
}

async function contactMessages(req, res) {
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const { createContactMessage, listContactMessages } = await import("../lib/admin-service.js");

  if (req.method === "POST") {
    const input = await readJsonOrForm(req);
    const message = await createContactMessage(input);
    return sendJson(res, 201, { ok: true, message });
  }

  if (req.method === "GET") {
    await requireAuth(req, [ROLES.EQUIPE]);
    const result = await listContactMessages(getQuery(req));
    return sendJson(res, 200, { ok: true, ...result });
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}

async function authMe(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { requireAuth } = await import("../lib/security.js");
  const { getUserProfile } = await import("../lib/admin-service.js");
  const user = await requireAuth(req);
  const profile = await getUserProfile(user.id);
  return sendJson(res, 200, { ok: true, user: profile || user });
}

async function uploadProfilePhoto(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const { parseMultipart } = await import("../lib/multipart.js");
  const { storeProfilePhoto } = await import("../lib/storage.js");
  const { files } = await parseMultipart(req);
  const file = files.photo || files.foto || files.profilePhoto;
  const upload = await storeProfilePhoto(file);
  return sendJson(res, 201, { ok: true, photoUrl: upload.fileUrl, file: upload });
}

async function leaderNetwork(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const { getLeaderNetwork } = await import("../lib/user-service.js");
  const user = await requireAuth(req, [ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS]);
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
}

async function leaderReferralLink(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { getConfig } = await import("../lib/config.js");
  const { query } = await import("../lib/db.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const { ensureLeaderProfile } = await import("../lib/user-service.js");
  const user = await requireAuth(req, [ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS]);
  const profile = await ensureLeaderProfile({ query }, user.id, getPublicAppUrl(req));
  return sendJson(res, 200, { ok: true, referralCode: profile.referral_code, referralUrl: profile.referral_url });
}

async function leaderMetrics(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { query } = await import("../lib/db.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const user = await requireAuth(req, [ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS]);
  const totals = await query(
    `with recursive subtree as (
       select user_id, parent_user_id from network_nodes where user_id = $1
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
       left join user_locations ul on ul.user_id = u.id`,
    [user.id]
  );
  const byLevel = await query(
    `with recursive subtree as (
       select user_id, parent_user_id from network_nodes where user_id = $1
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
}

async function adminLeaders(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { listUsers } = await import("../lib/admin-service.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  await requireAuth(req, [ROLES.EQUIPE]);
  const result = await listUsers({ ...getQuery(req), role: ROLES.LIDERES });
  return sendJson(res, 200, { ok: true, ...result });
}

async function adminUsers(req, res) {
  if (!["GET", "POST"].includes(req.method)) return methodNotAllowed(res, ["GET", "POST"]);
  const { ensureReferralLinksForAll, listUsers } = await import("../lib/admin-service.js");
  const { createUser } = await import("../lib/user-service.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  await requireAuth(req, [ROLES.EQUIPE]);
  if (req.method === "POST") {
    const input = await readJsonOrForm(req);
    const result = await createUser(input, null, { allowAdminRole: true, appUrl: getPublicAppUrl(req) });
    return sendJson(res, 201, { ok: true, user: result.user, leaderProfile: result.leaderProfile });
  }
  await ensureReferralLinksForAll(getPublicAppUrl(req));
  const result = await listUsers(getQuery(req));
  return sendJson(res, 200, { ok: true, ...result });
}

async function adminNetwork(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { query } = await import("../lib/db.js");
  const { buildTree } = await import("../lib/referrals.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  await requireAuth(req, [ROLES.EQUIPE]);
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
}

async function adminLeaderNetwork(req, res, id) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const { getLeaderNetwork } = await import("../lib/user-service.js");
  await requireAuth(req, [ROLES.EQUIPE]);
  const q = getQuery(req);
  const result = await getLeaderNetwork(id, {
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
}

async function adminUserById(req, res, id) {
  if (!["GET", "PATCH", "DELETE"].includes(req.method)) return methodNotAllowed(res, ["GET", "PATCH", "DELETE"]);
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const { deleteUser, getUserProfile, updateUser } = await import("../lib/admin-service.js");
  await requireAuth(req, [ROLES.EQUIPE]);
  if (req.method === "PATCH") {
    const input = await readJsonOrForm(req);
    const user = await updateUser(id, input);
    return sendJson(res, 200, { ok: true, user });
  }
  if (req.method === "DELETE") {
    await deleteUser(id);
    return sendJson(res, 200, { ok: true });
  }
  const user = await getUserProfile(id);
  if (!user) throw new ApiError(404, "Usuario nao encontrado.");
  return sendJson(res, 200, { ok: true, user });
}

async function adminMetrics(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { getAdminMetrics } = await import("../lib/admin-service.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  await requireAuth(req, [ROLES.EQUIPE]);
  const metrics = await getAdminMetrics();
  return sendJson(res, 200, { ok: true, metrics });
}

async function mapResponse(req, res, forcedRole, geojson = false) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { getMapSummary, listMapPoints, toGeoJson } = await import("../lib/map-service.js");
  const { requireAuth, ROLES } = await import("../lib/security.js");
  const user = await requireAuth(req, [ROLES.EQUIPE, ROLES.COORDENADORES, ROLES.LIDERES, ROLES.CADASTRADOS]);
  const q = forcedRole ? { ...getQuery(req), role: forcedRole } : getQuery(req);
  const items = await listMapPoints(user, q);
  if (geojson) return sendJson(res, 200, toGeoJson(items));
  const summary = await getMapSummary(user, q);
  return sendJson(res, 200, { ok: true, items, summary });
}

async function healthCheck(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  const { getConfig } = await import("../lib/config.js");
  const { query } = await import("../lib/db.js");
  const config = getConfig();
  const checks = {
    databaseUrl: Boolean(config.databaseUrl),
    jwtSecret: Boolean(config.jwtSecret),
    usersTable: false,
    db: false,
  };

  try {
    await query("select 1");
    checks.db = true;
    const table = await query("select to_regclass('public.users') as table_name");
    checks.usersTable = Boolean(table.rows[0]?.table_name);
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      checks,
      error: error.code || error.message,
    });
  }

  return sendJson(res, 200, { ok: true, checks });
}

export default async function handler(req, res) {
  try {
    const route = getRoute(req);
    const leaderNetworkMatch = getDynamicId(route, "admin/leaders/:id/network");
    const userMatch = getDynamicId(route, "admin/users/:id");

    if (route === "auth/register") return await authRegister(req, res);
    if (route === "siv") return await sivRegister(req, res);
    if (route === "auth/login") return await authLogin(req, res);
    if (route === "auth/me") return await authMe(req, res);
    if (route === "contact/messages") return await contactMessages(req, res);
    if (route === "health") return await healthCheck(req, res);
    if (route === "upload/profile-photo") return await uploadProfilePhoto(req, res);
    if (route === "leaders/me/network") return await leaderNetwork(req, res);
    if (route === "leaders/me/referral-link") return await leaderReferralLink(req, res);
    if (route === "leaders/me/metrics") return await leaderMetrics(req, res);
    if (route === "admin/leaders") return await adminLeaders(req, res);
    if (route === "admin/users") return await adminUsers(req, res);
    if (route === "admin/network") return await adminNetwork(req, res);
    if (route === "admin/metrics") return await adminMetrics(req, res);
    if (leaderNetworkMatch) return await adminLeaderNetwork(req, res, leaderNetworkMatch.id);
    if (userMatch) return await adminUserById(req, res, userMatch.id);
    if (route === "map/leaders") return await mapResponse(req, res, "LIDERES");
    if (route === "map/users") return await mapResponse(req, res);
    if (route === "map/network") return await mapResponse(req, res);
    if (route === "map/geojson") return await mapResponse(req, res, null, true);

    return sendJson(res, 404, { ok: false, error: "Rota nao encontrada." });
  } catch (error) {
    return handleError(res, error);
  }
}
