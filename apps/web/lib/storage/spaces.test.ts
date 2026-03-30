import { describe, expect, it } from "vitest";
import { buildDraftAssetKey, getPublicAssetUrl } from "./spaces";

describe("spaces storage helpers", () => {
  it("builds a draft-scoped asset key for uploaded files", () => {
    expect(
      buildDraftAssetKey({
        filename: "front photo!!.jpg",
        listingId: "lst_123",
        uploadId: "asset_123"
      })
    ).toBe("listings/drafts/lst_123/asset_123-front-photo.jpg");
  });

  it("derives a public asset url from the configured base host", () => {
    expect(getPublicAssetUrl("listings/drafts/lst_123/asset_123-front.jpg")).toBe(
      "https://cmd-market-space-dev.nyc3.digitaloceanspaces.com/listings/drafts/lst_123/asset_123-front.jpg"
    );
  });
});
