import { methodNotAllowed, sendJson, handleError } from "../../lib/http.js";
import { parseMultipart } from "../../lib/multipart.js";
import { storeProfilePhoto } from "../../lib/storage.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const { files } = await parseMultipart(req);
    const file = files.photo || files.foto || files.profilePhoto;
    const upload = await storeProfilePhoto(file);
    return sendJson(res, 201, { ok: true, photoUrl: upload.fileUrl, file: upload });
  } catch (error) {
    return handleError(res, error);
  }
}
