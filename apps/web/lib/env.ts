const DEFAULT_APP_BASE_URL = "http://localhost:3000";
const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/cmd_market";
const DEFAULT_BETTER_AUTH_SECRET = "development-only-secret-change-me";

export const env = {
  allowDevelopmentOverrides: process.env.NODE_ENV !== "production",
  appBaseUrl: process.env.BETTER_AUTH_URL ?? DEFAULT_APP_BASE_URL,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? DEFAULT_BETTER_AUTH_SECRET,
  databaseUrl: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  twitterClientId: process.env.TWITTER_CLIENT_ID ?? null,
  twitterClientSecret: process.env.TWITTER_CLIENT_SECRET ?? null,
  developmentSellerOverrideEmails: splitCsv(process.env.DEV_SELLER_OVERRIDE_EMAILS ?? "")
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
