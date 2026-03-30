import { describe, expect, test } from "vitest";
import {
  draftListingResponseSchema,
  serializeDraftListingResponse,
  serializeUploadSessionsResponse,
  uploadSessionsResponseSchema
} from "./http";

describe("listing/http", () => {
  test("serializes draft listing responses with the shared schema", () => {
    const response = serializeDraftListingResponse({
      id: "lst_123",
      media: [
        {
          altText: "Front of the card",
          assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
          id: "med_123",
          sortOrder: 0,
          url: "https://assets.cmd.market/listings/drafts/lst_123/asset_123-front.jpg"
        }
      ],
      object: "listing",
      status: "draft"
    });

    expect(draftListingResponseSchema.parse(response)).toEqual(response);
  });

  test("serializes upload session responses with the shared schema", () => {
    const response = serializeUploadSessionsResponse([
      {
        assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
        upload: {
          expiresAt: "2026-03-30T19:00:00.000Z",
          headers: {
            "content-type": "image/jpeg"
          },
          method: "PUT",
          url: "https://spaces.cmd.market/upload"
        }
      }
    ]);

    expect(uploadSessionsResponseSchema.parse(response)).toEqual(response);
  });
});
