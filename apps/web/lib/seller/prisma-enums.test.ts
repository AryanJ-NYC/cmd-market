import {
  SellerEligibilitySource as PrismaSellerEligibilitySource,
  SellerEligibilityStatus as PrismaSellerEligibilityStatus
} from "@prisma/client";
import { describe, expect, it } from "vitest";

describe("seller prisma enums", () => {
  it("exposes seller eligibility status as a generated prisma enum", () => {
    expect(PrismaSellerEligibilityStatus.pending).toBe("pending");
    expect(PrismaSellerEligibilityStatus.eligible).toBe("eligible");
    expect(PrismaSellerEligibilityStatus.revoked).toBe("revoked");
    expect(PrismaSellerEligibilityStatus.suspended).toBe("suspended");
  });

  it("exposes seller eligibility source as a generated prisma enum", () => {
    expect(PrismaSellerEligibilitySource.manual_override).toBe("manual_override");
    expect(PrismaSellerEligibilitySource.x_verification).toBe("x_verification");
  });
});
