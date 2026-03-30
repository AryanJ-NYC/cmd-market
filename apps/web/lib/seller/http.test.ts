import { describe, expect, test } from "vitest";
import {
  sellerApiErrorBodySchema,
  sellerContextResponseSchema,
  sellerPublishabilityResponseSchema,
  serializeSellerApiErrorBody,
  serializeSellerContextResponse,
  serializeSellerPublishabilityResponse
} from "./http";

const sellerContext = {
  actorApiKeyId: null,
  actorType: "user" as const,
  actorUserId: "usr_123",
  eligibilitySource: "x_verification" as const,
  eligibilityStatus: "eligible" as const,
  organizationId: "org_123",
  sellerAccountId: "sel_123"
};

describe("seller/http", () => {
  test("serializes seller context responses with the shared schema", () => {
    const response = serializeSellerContextResponse(sellerContext);

    expect(sellerContextResponseSchema.parse(response)).toEqual(response);
  });

  test("serializes seller publishability responses with the shared schema", () => {
    const response = serializeSellerPublishabilityResponse({
      issues: [],
      publishable: true,
      sellerContext
    });

    expect(sellerPublishabilityResponseSchema.parse(response)).toEqual(response);
  });

  test("serializes seller API error bodies with retry-after support", () => {
    const response = serializeSellerApiErrorBody({
      code: "RATE_LIMITED",
      message: "Try again later.",
      retryAfterMs: 1500
    });

    expect(sellerApiErrorBodySchema.parse(response)).toEqual(response);
  });
});
