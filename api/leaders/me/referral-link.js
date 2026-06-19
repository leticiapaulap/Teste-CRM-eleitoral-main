import { handleError, methodNotAllowed, sendJson } from "../../../lib/http.js";
import { getConfig } from "../../../lib/config.js";
import { query } from "../../../lib/db.js";
import { requireAuth, ROLES } from "../../../lib/security.js";
import { ensureLeaderProfile } from "../../../lib/user-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireAuth(req, [ROLES.LIDER]);
    const profile = await ensureLeaderProfile({ query }, user.id, getConfig().appUrl);
    return sendJson(res, 200, { ok: true, referralCode: profile.referral_code, referralUrl: profile.referral_url });
  } catch (error) {
    return handleError(res, error);
  }
}
