export function getConfig() {
  return {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
    frontendUrl: (process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
    nodeEnv: process.env.NODE_ENV || "development",
    storageProvider: process.env.STORAGE_PROVIDER || "mock",
    uploadMaxSize: Number(process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024),
    uploadDir: process.env.UPLOAD_DIR || ".uploads/profile-photos",
    storagePublicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || "",
  };
}

export function assertServerConfig() {
  const config = getConfig();
  if (!config.databaseUrl) throw new Error("DATABASE_URL nao configurado.");
  if (!config.jwtSecret) throw new Error("JWT_SECRET nao configurado.");
  return config;
}
