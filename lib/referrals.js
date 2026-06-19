import { randomBytes } from "node:crypto";

export function makeReferralCode(prefix = "SIV") {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
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
