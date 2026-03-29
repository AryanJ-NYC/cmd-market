function hasPrismaCliDatabaseUrl(runtimeEnv: DatabaseUrlEnvironment) {
  return Boolean(runtimeEnv.NEON_DATABASE_URL_UNPOOLED);
}

function getPrismaCliDatabaseUrl(runtimeEnv: DatabaseUrlEnvironment) {
  const databaseUrl = runtimeEnv.NEON_DATABASE_URL_UNPOOLED;

  if (!databaseUrl) {
    throw new Error("NEON_DATABASE_URL_UNPOOLED is required.");
  }

  return databaseUrl;
}

function getRuntimeDatabaseUrl(runtimeEnv: DatabaseUrlEnvironment) {
  const databaseUrl = runtimeEnv.NEON_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("NEON_DATABASE_URL is required.");
  }

  return databaseUrl;
}

export { getPrismaCliDatabaseUrl, getRuntimeDatabaseUrl, hasPrismaCliDatabaseUrl };

type DatabaseUrlEnvironment = Record<string, string | undefined> & {
  NEON_DATABASE_URL?: string;
  NEON_DATABASE_URL_UNPOOLED?: string;
};
