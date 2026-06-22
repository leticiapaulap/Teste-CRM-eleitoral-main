import { ApiError } from "./http.js";
import { ROLES } from "./security.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function requireString(value, field, min = 1) {
  const text = String(value || "").trim();
  if (text.length < min) throw new ApiError(400, `Campo obrigatorio ou invalido: ${field}.`);
  return text;
}

export function validateEmail(email) {
  const value = requireString(email, "email").toLowerCase();
  if (!EMAIL_RE.test(value)) throw new ApiError(400, "Email invalido.");
  return value;
}

export function validatePhone(phone) {
  const value = String(phone || "").replace(/\D/g, "");
  if (!PHONE_RE.test(value)) throw new ApiError(400, "Telefone invalido.");
  return value;
}

export function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) throw new ApiError(400, "A senha deve ter pelo menos 8 caracteres.");
  return value;
}

export function validateRole(role) {
  const value = String(role || ROLES.PESSOA).toUpperCase();
  if (!Object.values(ROLES).includes(value)) throw new ApiError(400, "Role invalida.");
  return value;
}

export function validateBoolean(value, field) {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  throw new ApiError(400, `Consentimento obrigatorio: ${field}.`);
}

export function validateCoordinate(value, field, min, max, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ApiError(400, `${field} obrigatorio.`);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ApiError(400, `${field} invalido.`);
  }
  return number;
}

export function validatePhotoMetadata(file, maxSize) {
  if (!file) throw new ApiError(400, "Foto obrigatoria.");
  const mimeType = file.mimetype || file.mime_type || file.type || "";
  const fileName = file.originalFilename || file.file_name || file.name || "";
  const size = Number(file.size || 0);
  const extension = String(fileName).split(".").pop()?.toLowerCase();

  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) throw new ApiError(400, "Formato de foto invalido.");
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new ApiError(400, "Extensao de foto invalida.");
  if (!size || size > maxSize) throw new ApiError(400, "Tamanho da foto invalido.");
  return { mimeType, fileName, size };
}

export function assertValidPhotoUrl(photoUrl, { required = true } = {}) {
  if (!required && (photoUrl === undefined || photoUrl === null || String(photoUrl).trim() === "")) {
    return null;
  }
  const value = requireString(photoUrl, "photoUrl");
  if (!/^(https?:\/\/|\/|mock:\/\/)/i.test(value)) {
    throw new ApiError(400, "photoUrl deve ser uma URL ou caminho valido.");
  }
  return value;
}
