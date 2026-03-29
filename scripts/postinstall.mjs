import { execFileSync } from "node:child_process";

if (!process.env.NEON_DATABASE_URL_UNPOOLED) {
  console.log("Skipping Prisma client generation because NEON_DATABASE_URL_UNPOOLED is not set.");
  process.exit(0);
}

execFileSync("pnpm", ["--filter", "@cmd-market/web", "db:generate"], {
  stdio: "inherit"
});
