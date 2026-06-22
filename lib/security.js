import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "./http.js";
import { getConfig } from "./config.js";
import { query } from "./db.js";

export const ROLES = Object.freeze({
  EQUIPE: "EQUIPE",
  COORDENADORES: "COORDENADORES",
  LIDERES: "LIDERES",
  CADASTRADOS: "CADASTRADOS",
});

export const ADMIN_ROLES = new Set([ROLES.EQUIPE]);
export const REFERRAL_ROLES = new Set([ROLES.COORDENADORES, ROLES.LIDERES]);

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

export function canManageNetwork(role) {
  return isAdminRole(role) || REFERRAL_ROLES.has(role);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  const config = getConfig();
  if (!config.jwtSecret) throw new Error("JWT_SECRET nao configurado.");
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export async function requireAuth(req, allowedRoles) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new ApiError(401, "Token ausente.");

  const config = getConfig();
  if (!config.jwtSecret) throw new Error("JWT_SECRET nao configurado.");

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new ApiError(401, "Token invalido ou expirado.");
  }

  const result = await query(
    "select id, name, email, phone, role, photo_url, active, consent_accepted, consent_accepted_at, created_at, updated_at from users where id = $1 and active = true",
    [decoded.sub]
  );
  const user = result.rows[0];
  if (!user) throw new ApiError(401, "Usuario nao encontrado ou inativo.");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, "Permissao insuficiente.");
  }
  return user;
}
