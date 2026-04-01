import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMarketplaceId, resolveSellerRequestContext, shippingProfileRepository } = vi.hoisted(
  () => ({
    createMarketplaceId: vi.fn(),
    resolveSellerRequestContext: vi.fn(),
    shippingProfileRepository: {
      createShippingProfile: vi.fn(),
      findShippingProfileById: vi.fn(),
      listShippingProfilesBySellerAccountId: vi.fn(),
      updateShippingProfile: vi.fn(),
    },
  }),
);

vi.mock("../db/ids", () => ({
  createMarketplaceId,
}));

vi.mock("../seller/service", () => ({
  resolveSellerRequestContext,
}));

vi.mock("./repository", () => ({
  shippingProfileRepository,
}));

import {
  createShippingProfile,
  createShippingProfileSchema,
  getShippingProfile,
  listShippingProfiles,
  parseCreateShippingProfileInput,
  parseUpdateShippingProfileInput,
  updateShippingProfile,
  updateShippingProfileSchema,
} from "./service";

describe("shipping profile service", () => {
  beforeEach(() => {
    createMarketplaceId.mockReset();
    resolveSellerRequestContext.mockReset();
    shippingProfileRepository.createShippingProfile.mockReset();
    shippingProfileRepository.findShippingProfileById.mockReset();
    shippingProfileRepository.listShippingProfilesBySellerAccountId.mockReset();
    shippingProfileRepository.updateShippingProfile.mockReset();
  });

  it("creates a seller-owned flat domestic shipping profile", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    createMarketplaceId.mockReturnValueOnce("shp_123");
    shippingProfileRepository.createShippingProfile.mockResolvedValue(createShippingProfileRecord());

    const result = await createShippingProfile(
      new Request("https://example.com/api/seller/shipping-profiles", { method: "POST" }),
      {
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        name: "Card mailer",
      },
    );

    expect(result).toEqual({
      data: {
        createdAt: "2026-04-01T12:00:00.000Z",
        currencyCode: "USD",
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        id: "shp_123",
        name: "Card mailer",
        object: "shipping_profile",
        scope: "us_50_states",
        updatedAt: "2026-04-01T12:00:00.000Z",
      },
      ok: true,
    });
    expect(shippingProfileRepository.createShippingProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        id: "shp_123",
        name: "Card mailer",
        sellerAccountId: "seller_123",
      }),
    );
  });

  it("lists seller-owned shipping profiles", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    shippingProfileRepository.listShippingProfilesBySellerAccountId.mockResolvedValue([
      createShippingProfileRecord(),
    ]);

    const result = await listShippingProfiles(
      new Request("https://example.com/api/seller/shipping-profiles", { method: "GET" }),
    );

    expect(result).toEqual({
      data: [
        {
          createdAt: "2026-04-01T12:00:00.000Z",
          currencyCode: "USD",
          domesticRateMinor: 499,
          handlingTimeDays: 2,
          id: "shp_123",
          name: "Card mailer",
          object: "shipping_profile",
          scope: "us_50_states",
          updatedAt: "2026-04-01T12:00:00.000Z",
        },
      ],
      ok: true,
    });
  });

  it("rejects reading another seller's shipping profile", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    shippingProfileRepository.findShippingProfileById.mockResolvedValue(
      createShippingProfileRecord({
        sellerAccountId: "seller_other",
      }),
    );

    const result = await getShippingProfile(
      new Request("https://example.com/api/seller/shipping-profiles/shp_123", { method: "GET" }),
      "shp_123",
    );

    expect(result).toEqual({
      code: "forbidden",
      message: "Authenticated seller cannot access that shipping profile.",
      ok: false,
      status: 403,
    });
  });

  it("updates a seller-owned shipping profile", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    shippingProfileRepository.findShippingProfileById.mockResolvedValue(createShippingProfileRecord());
    shippingProfileRepository.updateShippingProfile.mockResolvedValue(
      createShippingProfileRecord({
        domesticRateMinor: 0,
        handlingTimeDays: 1,
        name: "Free shipping cards",
      }),
    );

    const result = await updateShippingProfile(
      new Request("https://example.com/api/seller/shipping-profiles/shp_123", { method: "PATCH" }),
      "shp_123",
      {
        domesticRateMinor: 0,
        handlingTimeDays: 1,
        name: "Free shipping cards",
      },
    );

    expect(result).toEqual({
      data: {
        createdAt: "2026-04-01T12:00:00.000Z",
        currencyCode: "USD",
        domesticRateMinor: 0,
        handlingTimeDays: 1,
        id: "shp_123",
        name: "Free shipping cards",
        object: "shipping_profile",
        scope: "us_50_states",
        updatedAt: "2026-04-01T12:00:00.000Z",
      },
      ok: true,
    });
  });

  it("rejects negative rates and unsupported handling windows", () => {
    expect(
      createShippingProfileSchema.safeParse({
        domestic_rate_minor: -1,
        handling_time_days: 2,
        name: "Bad profile",
      }).success,
    ).toBe(false);

    expect(
      updateShippingProfileSchema.safeParse({
        handling_time_days: 4,
      }).success,
    ).toBe(false);
  });

  it("parses shipping profile inputs into runtime shape", () => {
    const parsed = createShippingProfileSchema.parse({
      domestic_rate_minor: 499,
      handling_time_days: 2,
      name: "Card mailer",
    });

    expect(parseCreateShippingProfileInput(parsed)).toEqual({
      domesticRateMinor: 499,
      handlingTimeDays: 2,
      name: "Card mailer",
    });

    const updated = updateShippingProfileSchema.parse({
      domestic_rate_minor: 0,
    });

    expect(parseUpdateShippingProfileInput(updated)).toEqual({
      domesticRateMinor: 0,
      handlingTimeDays: undefined,
      name: undefined,
    });
  });
});

function createSellerContext() {
  return {
    context: {
      actorApiKeyId: null,
      actorType: "user" as const,
      actorUserId: "user_123",
      eligibilitySource: null,
      eligibilityStatus: "eligible" as const,
      organizationId: "org_123",
      sellerAccountId: "seller_123",
    },
    ok: true as const,
  };
}

function createShippingProfileRecord(
  overrides: Partial<{
    createdAt: Date;
    domesticRateMinor: number;
    handlingTimeDays: 1 | 2 | 3;
    id: string;
    name: string;
    sellerAccountId: string;
    updatedAt: Date;
  }> = {},
) {
  return {
    createdAt: new Date("2026-04-01T12:00:00.000Z"),
    domesticRateMinor: 499,
    handlingTimeDays: 2 as const,
    id: "shp_123",
    name: "Card mailer",
    sellerAccountId: "seller_123",
    updatedAt: new Date("2026-04-01T12:00:00.000Z"),
    ...overrides,
  };
}
