import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const prismaDirectory = new URL(".", import.meta.url);

describe("prisma seller eligibility schema", () => {
  it("defines seller eligibility enums in the schema", () => {
    const schema = readPrismaFile("schema.prisma");

    expect(schema).toContain([
      "enum SellerEligibilityStatus {",
      "  pending",
      "  eligible",
      "  revoked",
      "  suspended",
      "}",
    ].join("\n"));
    expect(schema).toContain([
      "enum SellerEligibilitySource {",
      "  manual_override",
      "  x_verification",
      "}",
    ].join("\n"));
    expect(schema).toContain("listingEligibilityStatus   SellerEligibilityStatus");
    expect(schema).toContain("listingEligibilitySource   SellerEligibilitySource?");
  });

  it("creates seller eligibility enum types in the initial migration", () => {
    const migration = readPrismaFile("migrations/20260330183247_initial_marketplace/migration.sql");

    expect(migration).toContain(
      'CREATE TYPE "SellerEligibilityStatus" AS ENUM (\'pending\', \'eligible\', \'revoked\', \'suspended\');'
    );
    expect(migration).toContain(
      'CREATE TYPE "SellerEligibilitySource" AS ENUM (\'manual_override\', \'x_verification\');'
    );
    expect(migration).toContain('"listing_eligibility_status" "SellerEligibilityStatus" NOT NULL');
    expect(migration).toContain('"listing_eligibility_source" "SellerEligibilitySource"');
  });

  it("defines thin listing and listing media models in the schema", () => {
    const schema = readPrismaFile("schema.prisma");

    expect(schema).toContain("model listing {");
    expect(schema).toContain("sellerAccountId");
    expect(schema).toContain('@map("seller_account_id")');
    expect(schema).toContain('@default("draft")');
    expect(schema).toContain("model listingMedia {");
    expect(schema).toContain("assetKey");
    expect(schema).toContain('@map("asset_key")');
    expect(schema).toContain("@unique([listingId, assetKey])");
  });

  it("creates listing and listing_media tables in the initial migration", () => {
    const migration = readPrismaFile("migrations/20260330183247_initial_marketplace/migration.sql");

    expect(migration).toContain('CREATE TABLE "listing"');
    expect(migration).toContain('"seller_account_id" TEXT NOT NULL');
    expect(migration).toContain('CREATE TABLE "listing_media"');
    expect(migration).toContain('"listing_id" TEXT NOT NULL');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "listing_media_listing_id_asset_key_key" ON "listing_media"("listing_id", "asset_key");'
    );
  });

});

function readPrismaFile(relativePath: string) {
  return readFileSync(join(prismaDirectory.pathname, relativePath), "utf8");
}
