import { ApiError, methodNotAllowed, sendJson, handleError, readJsonOrForm, sanitizeUser } from "../../lib/http.js";
import { getUserByEmail } from "../../lib/user-service.js";
import { signToken, verifyPassword } from "../../lib/security.js";
import { validateEmail, requireString } from "../../lib/validation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = await readJsonOrForm(req);
    const email = validateEmail(body.email);
    const password = requireString(body.password || body.senha, "password");
    const user = await getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(401, "Credenciais invalidas.");
    }
    const token = signToken(user);
    return sendJson(res, 200, { ok: true, token, user: sanitizeUser(user) });
  } catch (error) {
    return handleError(res, error);
  }
}
