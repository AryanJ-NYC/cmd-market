import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const DEFAULT_APP_BASE_URL = "http://localhost:3000";
const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/cmd_market";
const DEFAULT_BETTER_AUTH_SECRET = "development-only-secret-change-me";
const requireXAuthConfig = process.env.NODE_ENV !== "test";

const runtimeEnv = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DEV_SELLER_OVERRIDE_EMAILS: process.env.DEV_SELLER_OVERRIDE_EMAILS,
  NODE_ENV: process.env.NODE_ENV,
  X_CONSUMER_KEY: process.env.X_CONSUMER_KEY ?? process.env.TWITTER_CLIENT_ID,
  X_CONSUMER_SECRET: process.env.X_CONSUMER_SECRET ?? process.env.TWITTER_CLIENT_SECRET
};

const validatedEnv = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: runtimeEnv,
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).default(DEFAULT_BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: z.string().url().default(DEFAULT_APP_BASE_URL),
    DATABASE_URL: z.string().url().default(DEFAULT_DATABASE_URL),
    DEV_SELLER_OVERRIDE_EMAILS: z.string().default(""),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    X_CONSUMER_KEY: requireXAuthConfig ? z.string().min(1) : z.string().min(1).optional(),
    X_CONSUMER_SECRET: requireXAuthConfig ? z.string().min(1) : z.string().min(1).optional()
  }
});

export const env = {
  allowDevelopmentOverrides: validatedEnv.NODE_ENV !== "production",
  appBaseUrl: validatedEnv.BETTER_AUTH_URL,
  betterAuthSecret: validatedEnv.BETTER_AUTH_SECRET,
  databaseUrl: validatedEnv.DATABASE_URL,
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
