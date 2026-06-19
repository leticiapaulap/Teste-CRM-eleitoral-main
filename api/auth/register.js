import { methodNotAllowed, sendJson, handleError, readJsonOrForm } from "../../lib/http.js";
import { parseMultipart } from "../../lib/multipart.js";
import { storeProfilePhoto } from "../../lib/storage.js";
import { createUser } from "../../lib/user-service.js";
import { signToken } from "../../lib/security.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const contentType = req.headers["content-type"] || "";
    let input;
    let uploadMetadata = null;

    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipart(req);
      const file = files.photo || files.foto || files.profilePhoto;
      uploadMetadata = await storeProfilePhoto(file);
      input = { ...fields, photoUrl: uploadMetadata.fileUrl };
    } else {
      input = await readJsonOrForm(req);
    }

    const result = await createUser(input, uploadMetadata);
    const token = signToken(result.user);
    return sendJson(res, 201, { ok: true, user: result.user, leaderProfile: result.leaderProfile, token });
  } catch (error) {
    return handleError(res, error);
  }
}
