import { randomBytes } from "node:crypto";

const INTERNAL_EMAIL_DOMAIN = "cadastro.siv.local";

export function makeInternalEmail(seed = "") {
  const cleanSeed = String(seed || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  const suffix = randomBytes(4).toString("hex");
  return `sem-email-${cleanSeed || "cadastro"}-${suffix}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function isInternalEmail(email) {
  return String(email || "").toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

export function publicEmail(email) {
  return isInternalEmail(email) ? null : email || null;
}

export function withPublicEmail(row) {
  return row ? { ...row, email: publicEmail(row.email) } : row;
}
