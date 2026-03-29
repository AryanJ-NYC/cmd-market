import { describe, expect, it } from "vitest";
import { getPrismaCliDatabaseUrl, getRuntimeDatabaseUrl, hasPrismaCliDatabaseUrl } from "./urls";

describe("database urls", () => {
  it("uses the pooled Neon url for app runtime", () => {
    expect(
      getRuntimeDatabaseUrl({
        NEON_DATABASE_URL: "postgres://pooled.example",
        NEON_DATABASE_URL_UNPOOLED: "postgres://unpooled.example"
      })
    ).toBe("postgres://pooled.example");
  });

  it("uses the unpooled Neon url for Prisma CLI work", () => {
    expect(
      getPrismaCliDatabaseUrl({
        NEON_DATABASE_URL: "postgres://pooled.example",
        NEON_DATABASE_URL_UNPOOLED: "postgres://unpooled.example"
      })
    ).toBe("postgres://unpooled.example");
  });

  it("can detect when Prisma CLI database config is unavailable", () => {
    expect(hasPrismaCliDatabaseUrl({})).toBe(false);
    expect(
      hasPrismaCliDatabaseUrl({
        NEON_DATABASE_URL_UNPOOLED: "postgres://unpooled.example"
      })
    ).toBe(true);
  });
});
