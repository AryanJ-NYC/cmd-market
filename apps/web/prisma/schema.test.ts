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

  it("creates seller eligibility enum types in the checked-in migration", () => {
    const migration = readPrismaFile("migrations/20260326094109_issue1_seller_workspace/migration.sql");

    expect(migration).toContain(
      'CREATE TYPE "SellerEligibilityStatus" AS ENUM (\'pending\', \'eligible\', \'revoked\', \'suspended\');'
    );
    expect(migration).toContain(
      'CREATE TYPE "SellerEligibilitySource" AS ENUM (\'manual_override\', \'x_verification\');'
    );
    expect(migration).toContain('"listing_eligibility_status" "SellerEligibilityStatus" NOT NULL');
    expect(migration).toContain('"listing_eligibility_source" "SellerEligibilitySource"');
  });
});

function readPrismaFile(relativePath: string) {
  return readFileSync(join(prismaDirectory.pathname, relativePath), "utf8");
}
