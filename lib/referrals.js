import { randomBytes } from "node:crypto";

export function referralPrefixForRole(role) {
  return String(role || "").toUpperCase() === "COORDENADORES" ? "AG" : "SIV";
}

function randomDigits(size = 8) {
  let digits = "";
  while (digits.length < size) {
    digits += String(randomBytes(size).readUIntBE(0, Math.min(size, 6))).replace(/\D/g, "");
  }
  return digits.slice(0, size);
}

export function makeReferralCode(prefix = "SIV") {
  const normalizedPrefix = String(prefix || "SIV").toUpperCase();
  if (normalizedPrefix === "AG") return `AG${randomDigits(8)}`;
  return `${normalizedPrefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function makeReferralCodeForRole(role) {
  return makeReferralCode(referralPrefixForRole(role));
}

export function makeReferralUrl(appUrl, code) {
  return `${appUrl.replace(/\/$/, "")}/cadastro?ref=${encodeURIComponent(code)}`;
}

export function buildTree(nodes) {
  const ids = new Set(nodes.map((node) => node.user_id));
  const byParent = new Map();
  for (const node of nodes) {
    const parent = node.parent_user_id && ids.has(node.parent_user_id) ? node.parent_user_id : "root";
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push({ ...node, children: [] });
  }

  function attach(parentId) {
    return (byParent.get(parentId) || []).map((node) => ({
      ...node,
      children: attach(node.user_id),
    }));
  }

  return attach("root");
}
