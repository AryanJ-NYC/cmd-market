import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const DEFAULT_APP_BASE_URL = "http://localhost:3000";
const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/cmd_market";
const DEFAULT_BETTER_AUTH_SECRET = "development-only-secret-change-me";

const validatedEnv = createEnv({
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).default(DEFAULT_BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: z.string().url().default(DEFAULT_APP_BASE_URL),
    DATABASE_URL: z.string().url().default(DEFAULT_DATABASE_URL),
    DEV_SELLER_OVERRIDE_EMAILS: z.string().default(""),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    TWITTER_CLIENT_ID: z.string().min(1).optional(),
    TWITTER_CLIENT_SECRET: z.string().min(1).optional()
  }
});

export const env = {
  allowDevelopmentOverrides: validatedEnv.NODE_ENV !== "production",
  appBaseUrl: validatedEnv.BETTER_AUTH_URL,
  betterAuthSecret: validatedEnv.BETTER_AUTH_SECRET,
  databaseUrl: validatedEnv.DATABASE_URL,
  twitterClientId: validatedEnv.TWITTER_CLIENT_ID ?? null,
  twitterClientSecret: validatedEnv.TWITTER_CLIENT_SECRET ?? null,
  developmentSellerOverrideEmails: splitCsv(validatedEnv.DEV_SELLER_OVERRIDE_EMAILS)
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
