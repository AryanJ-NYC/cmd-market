import "dotenv/config";
import { defineConfig } from "prisma/config";

const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/cmd_market";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
  },
  migrations: {
    path: "prisma/migrations"
  },
  schema: "prisma/schema.prisma"
});
