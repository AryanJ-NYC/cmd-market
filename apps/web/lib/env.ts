import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { getRuntimeDatabaseUrl } from "./db/urls";

const runtimeEnv = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  DEV_SELLER_OVERRIDE_EMAILS: process.env.DEV_SELLER_OVERRIDE_EMAILS,
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  X_CONSUMER_KEY: process.env.X_CONSUMER_KEY,
  X_CONSUMER_SECRET: process.env.X_CONSUMER_SECRET
};

const validatedEnv = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: runtimeEnv,
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    DEV_SELLER_OVERRIDE_EMAILS: z.string().default(""),
    NEON_DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    X_CONSUMER_KEY: z.string().min(1),
    X_CONSUMER_SECRET: z.string().min(1)
  }
});

export const env = {
  allowDevelopmentOverrides: validatedEnv.NODE_ENV !== "production",
  betterAuthSecret: validatedEnv.BETTER_AUTH_SECRET,
  databaseUrl: getRuntimeDatabaseUrl(validatedEnv),
  nodeEnv: validatedEnv.NODE_ENV,
  xConsumerKey: validatedEnv.X_CONSUMER_KEY ?? null,
  xConsumerSecret: validatedEnv.X_CONSUMER_SECRET ?? null,
  developmentSellerOverrideEmails: splitCsv(validatedEnv.DEV_SELLER_OVERRIDE_EMAILS)
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
