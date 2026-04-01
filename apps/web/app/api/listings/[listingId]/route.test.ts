import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicListing } = vi.hoisted(() => ({
  getPublicListing: vi.fn(),
}));

vi.mock("../../../../lib/listing/service", () => ({
  getPublicListing,
}));

describe("GET /api/listings/[listingId]", () => {
  beforeEach(() => {
    getPublicListing.mockReset();
  });

  it("returns canonical public listing and media urls", async () => {
    getPublicListing.mockResolvedValue({
      data: {
        attributes: [],
        category: {
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards",
        },
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        id: "lst_123",
        listingUrl: "https://cmd.market/listings/lst_123",
        media: [
          {
            altText: "Front photo",
            id: "med_123",
            sortOrder: 0,
            url: "https://cmd.market/listings/lst_123/media/med_123",
          },
        ],
        object: "listing",
        price: {
          amountMinor: 125000,
          currencyCode: "USD",
        },
        publishedAt: "2026-03-30T20:00:00.000Z",
        quantityAvailable: 1,
        seller: {
          displayName: "Scarce City",
          id: "sel_123",
          slug: "scarce-city",
        },
        status: "published",
        title: "1999 Charizard Holo PSA 8",
        updatedAt: "2026-03-30T20:00:00.000Z",
      },
      ok: true,
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://cmd.market/api/listings/lst_123"), {
      params: Promise.resolve({
        listingId: "lst_123",
      }),
    });

    expect(getPublicListing).toHaveBeenCalledWith("lst_123", expect.any(Function));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: "lst_123",
        listing_url: "https://cmd.market/listings/lst_123",
        media: [
          {
            id: "med_123",
            url: "https://cmd.market/listings/lst_123/media/med_123",
          },
        ],
      },
    });
  });
});
