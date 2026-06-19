import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getConfig } from "./config.js";
import { ApiError } from "./http.js";
import { validatePhotoMetadata } from "./validation.js";

export async function storeProfilePhoto(file) {
  const config = getConfig();
  const metadata = validatePhotoMetadata(file, config.uploadMaxSize);
  const extension = metadata.fileName.split(".").pop().toLowerCase();
  const storedName = `${randomUUID()}.${extension}`;

  if (config.storageProvider === "mock") {
    return {
      fileUrl: `mock://profile-photos/${storedName}`,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      size: metadata.size,
    };
  }

  if (config.storageProvider === "local") {
    if (config.nodeEnv === "production") {
      throw new ApiError(500, "Storage local nao deve ser usado em producao na Vercel.");
    }
    const dir = path.resolve(config.uploadDir);
    await fs.mkdir(dir, { recursive: true });
    const destination = path.join(dir, storedName);
    await fs.copyFile(file.filepath, destination);
    const publicBase = config.storagePublicBaseUrl || "/uploads/profile-photos";
    return {
      fileUrl: `${publicBase.replace(/\/$/, "")}/${storedName}`,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      size: metadata.size,
    };
  }

  throw new ApiError(501, "Storage externo ainda nao configurado para este provider.");
}
