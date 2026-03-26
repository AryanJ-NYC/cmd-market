import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../env";

export const prisma = globalThis.__cmdMarketPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__cmdMarketPrisma = prisma;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl
  });

  return new PrismaClient({ adapter });
}

declare global {
  var __cmdMarketPrisma: PrismaClient | undefined;
}
