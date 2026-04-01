import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublishedListingMedia } = vi.hoisted(() => ({
  getPublishedListingMedia: vi.fn(),
}));

vi.mock("../../../../../lib/listing/service", () => ({
  getPublishedListingMedia,
}));

describe("GET /listings/[listingId]/media/[mediaId]", () => {
  beforeEach(() => {
    getPublishedListingMedia.mockReset();
  });

  it("redirects to the current backing asset url", async () => {
    getPublishedListingMedia.mockResolvedValue({
      data: {
        altText: "Front photo",
        assetUrl: "https://cmd-market-space-dev.nyc3.digitaloceanspaces.com/listings/published/lst_123/front.jpg",
        id: "med_123",
        listingId: "lst_123",
        sortOrder: 0,
      },
      ok: true,
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://cmd.market/listings/lst_123/media/med_123"), {
      params: Promise.resolve({
        listingId: "lst_123",
        mediaId: "med_123",
      }),
    });

    expect(getPublishedListingMedia).toHaveBeenCalledWith("lst_123", "med_123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://cmd-market-space-dev.nyc3.digitaloceanspaces.com/listings/published/lst_123/front.jpg",
    );
  });

  it("returns 404 when the media item is not public", async () => {
    getPublishedListingMedia.mockResolvedValue({
      code: "listing_media_not_found",
      message: "Published listing media could not be found.",
      ok: false,
      status: 404,
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://cmd.market/listings/lst_123/media/med_404"), {
      params: Promise.resolve({
        listingId: "lst_123",
        mediaId: "med_404",
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "listing_media_not_found",
        message: "Published listing media could not be found.",
        retryAfterMs: null,
      },
    });
  });
});
