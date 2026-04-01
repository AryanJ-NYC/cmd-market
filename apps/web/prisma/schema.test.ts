import { readdirSync, readFileSync } from "node:fs";
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
    expect(schema).toContain("@default(draft)");
    expect(schema).toContain("model listingMedia {");
    expect(schema).toContain("assetKey");
    expect(schema).toContain('@map("asset_key")');
    expect(schema).toContain("@unique([listingId, assetKey])");
  });

  it("defines seller-owned shipping profiles and listing shipping references in the schema", () => {
    const schema = readPrismaFile("schema.prisma");

    expect(schema).toContain("model shippingProfile {");
    expect(schema).toContain("sellerAccountId");
    expect(schema).toContain('@map("seller_account_id")');
    expect(schema).toContain("domesticRateMinor");
    expect(schema).toContain('@map("domestic_rate_minor")');
    expect(schema).toContain("handlingTimeDays");
    expect(schema).toContain('@map("handling_time_days")');
    expect(schema).toContain("shippingProfileId");
    expect(schema).toContain('@map("shipping_profile_id")');
  });

  it("creates listing and listing_media tables in the initial migration", () => {
    const migration = readAllMigrationSql();

    expect(migration).toContain('CREATE TABLE "listing"');
    expect(migration).toContain('"seller_account_id" TEXT NOT NULL');
    expect(migration).toContain('CREATE TABLE "listing_media"');
    expect(migration).toContain('"listing_id" TEXT NOT NULL');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "listing_media_listing_id_asset_key_key" ON "listing_media"("listing_id", "asset_key");'
    );
  });

  it("creates shipping_profile persistence and listing shipping foreign keys in migrations", () => {
    const migration = readAllMigrationSql();

    expect(migration).toContain('CREATE TABLE "shipping_profile"');
    expect(migration).toContain('"seller_account_id" TEXT NOT NULL');
    expect(migration).toContain('"domestic_rate_minor" INTEGER NOT NULL');
    expect(migration).toContain('"handling_time_days" INTEGER NOT NULL');
    expect(migration).toContain('CREATE INDEX "shipping_profile_seller_account_id_idx"');
    expect(migration).toContain('CREATE INDEX "listing_shipping_profile_id_idx"');
    expect(migration).toContain('ALTER TABLE "listing" ADD CONSTRAINT "listing_shipping_profile_id_fkey"');
  });

  it("defines marketplace category metadata and listing attribute models", () => {
    const schema = readPrismaFile("schema.prisma");

    expect(schema).toContain([
      "enum ListingStatus {",
      "  draft",
      "  published",
      "  reserved",
      "  sold",
      "  cancelled",
      "  expired",
      "}",
    ].join("\n"));
    expect(schema).toContain([
      "enum AttributeValueType {",
      "  text",
      "  number",
      "  boolean",
      "  enum",
      "  json",
      "}",
    ].join("\n"));
    expect(schema).toContain("model category {");
    expect(schema).toContain("model attributeDefinition {");
    expect(schema).toContain("model categoryAttribute {");
    expect(schema).toContain("model listingAttributeValue {");
    expect(schema).toContain("categoryId");
    expect(schema).toContain('@map("category_id")');
    expect(schema).toContain("unitPriceMinor");
    expect(schema).toContain('@map("unit_price_minor")');
    expect(schema).toContain("publishedAt");
    expect(schema).toContain('@map("published_at")');
    expect(schema).toContain("@unique([categoryId, attributeDefinitionId])");
    expect(schema).toContain("@unique([listingId, categoryAttributeId])");
  });

  it("creates category metadata tables, listing columns, and seeded trading-card metadata in migrations", () => {
    const migration = readAllMigrationSql();

    expect(migration).toContain('CREATE TYPE "ListingStatus" AS ENUM');
    expect(migration).toContain('CREATE TYPE "AttributeValueType" AS ENUM');
    expect(migration).toContain('CREATE TABLE "category"');
    expect(migration).toContain('CREATE TABLE "attribute_definition"');
    expect(migration).toContain('CREATE TABLE "category_attribute"');
    expect(migration).toContain('CREATE TABLE "listing_attribute_value"');
    expect(migration).toContain('"category_id" TEXT');
    expect(migration).toContain('"unit_price_minor"');
    expect(migration).toContain('"published_at" TIMESTAMP(3)');
    expect(migration).toContain('INSERT INTO "category"');
    expect(migration).toContain("'cat_cards'");
    expect(migration).toContain("'trading-cards'");
    expect(migration).toContain("'grading_company'");
    expect(migration).toContain("'grade'");
  });

  it("defines OpenClaw authorization session status and persistence in the schema", () => {
    const schema = readPrismaFile("schema.prisma");

    expect(schema).toContain([
      "enum OpenClawAuthorizationSessionStatus {",
      "  pending",
      "  authorized",
      "  rejected",
      "  cancelled",
      "  expired",
      "  redeemed",
      "}",
    ].join("\n"));
    expect(schema).toContain("model openClawAuthorizationSession {");
    expect(schema).toContain("browserTokenHash");
    expect(schema).toContain('@map("browser_token_hash")');
    expect(schema).toContain("codeChallenge");
    expect(schema).toContain('@map("code_challenge")');
    expect(schema).toContain("codeChallengeMethod");
    expect(schema).toContain('@map("code_challenge_method")');
    expect(schema).toContain("organizationId");
    expect(schema).toContain("authorizedByUserId");
    expect(schema).toContain("proposedWorkspaceName");
    expect(schema).toContain('@map("proposed_workspace_name")');
    expect(schema).toContain("proposedWorkspaceSlug");
    expect(schema).toContain('@map("proposed_workspace_slug")');
    expect(schema).toContain("status               OpenClawAuthorizationSessionStatus");
    expect(schema).toContain('@map("openclaw_authorization_session")');
  });

  it("creates OpenClaw authorization session enum and table in migrations", () => {
    const migration = readAllMigrationSql();

    expect(migration).toContain(
      'CREATE TYPE "OpenClawAuthorizationSessionStatus" AS ENUM (\'pending\', \'authorized\', \'rejected\', \'cancelled\', \'expired\', \'redeemed\');'
    );
    expect(migration).toContain('CREATE TABLE "openclaw_authorization_session"');
    expect(migration).toContain('"browser_token_hash" TEXT NOT NULL');
    expect(migration).toContain('"code_challenge" TEXT NOT NULL');
    expect(migration).toContain('"code_challenge_method" TEXT NOT NULL');
    expect(migration).toContain('"organization_id" TEXT');
    expect(migration).toContain('"authorized_by_user_id" TEXT');
    expect(migration).toContain('"proposed_workspace_name" TEXT');
    expect(migration).toContain('"proposed_workspace_slug" TEXT');
  });

});

function readPrismaFile(relativePath: string) {
  return readFileSync(join(prismaDirectory.pathname, relativePath), "utf8");
}

function readAllMigrationSql() {
  const migrationsDirectory = join(prismaDirectory.pathname, "migrations");

  return readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(join(migrationsDirectory, entry.name, "migration.sql"), "utf8"))
    .join("\n");
}
