import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { getRuntimeDatabaseUrl } from "./db/urls";

const runtimeEnv = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  DEV_SELLER_OVERRIDE_EMAILS: process.env.DEV_SELLER_OVERRIDE_EMAILS,
  DO_SPACES_ACCESS_KEY_ID: process.env.DO_SPACES_ACCESS_KEY_ID,
  DO_SPACES_SECRET_ACCESS_KEY: process.env.DO_SPACES_SECRET_ACCESS_KEY,
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  OPENCLAW_CLIENT_SECRET:
    process.env.OPENCLAW_CLIENT_SECRET ??
    (process.env.NODE_ENV === "test" ? "test-openclaw-client-secret" : undefined),
  X_CLIENT_ID: process.env.X_CLIENT_ID,
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET
};

const validatedEnv = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: runtimeEnv,
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    DEV_SELLER_OVERRIDE_EMAILS: z.string().default(""),
    DO_SPACES_ACCESS_KEY_ID: z.string().min(1),
    DO_SPACES_SECRET_ACCESS_KEY: z.string().min(1),
    NEON_DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    OPENCLAW_CLIENT_SECRET: z.string().min(1),
    X_CLIENT_ID: z.string().min(1),
    X_CLIENT_SECRET: z.string().min(1)
  }
});

export const env = {
  allowDevelopmentOverrides: validatedEnv.NODE_ENV !== "production",
  betterAuthSecret: validatedEnv.BETTER_AUTH_SECRET,
  databaseUrl: getRuntimeDatabaseUrl(validatedEnv),
  doSpacesAccessKeyId: validatedEnv.DO_SPACES_ACCESS_KEY_ID,
  doSpacesSecretAccessKey: validatedEnv.DO_SPACES_SECRET_ACCESS_KEY,
  nodeEnv: validatedEnv.NODE_ENV,
  openClawClientSecret: validatedEnv.OPENCLAW_CLIENT_SECRET,
  xClientId: validatedEnv.X_CLIENT_ID ?? null,
  xClientSecret: validatedEnv.X_CLIENT_SECRET ?? null,
  developmentSellerOverrideEmails: splitCsv(validatedEnv.DEV_SELLER_OVERRIDE_EMAILS)
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
