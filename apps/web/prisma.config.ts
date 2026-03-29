import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getPrismaCliDatabaseUrl } from "./lib/db/urls";

const databaseUrl = getPrismaCliDatabaseUrl(process.env);

export default defineConfig({
  datasource: {
    url: databaseUrl
  },
  migrations: {
    path: "prisma/migrations"
  },
  schema: "prisma/schema.prisma"
});
