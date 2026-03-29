import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  DuplicateListingMediaAssetKeyError,
  buildDraftAssetKey,
  createMarketplaceId,
  resolveSellerRequestContext,
  listingRepository,
  storage
} = vi.hoisted(() => ({
  DuplicateListingMediaAssetKeyError: class DuplicateListingMediaAssetKeyError extends Error {
    constructor() {
      super("duplicate listing media asset key");
      this.name = "DuplicateListingMediaAssetKeyError";
    }
  },
  buildDraftAssetKey: vi.fn(),
  createMarketplaceId: vi.fn(),
  resolveSellerRequestContext: vi.fn(),
  listingRepository: {
    attachMediaToDraftListing: vi.fn(),
    createDraftListing: vi.fn(),
    findListingById: vi.fn()
  },
  storage: {
    createPresignedUploadRequest: vi.fn(),
    getPublicAssetUrl: vi.fn()
  }
}));

vi.mock("../db/ids", () => ({
  createMarketplaceId
}));

vi.mock("../seller/service", () => ({
  resolveSellerRequestContext
}));

vi.mock("./repository", () => ({
  DuplicateListingMediaAssetKeyError,
  listingRepository
}));

vi.mock("../storage/spaces", () => ({
  ...storage,
  buildDraftAssetKey
}));

import {
  attachDraftListingMedia,
  createDraftListing,
  createListingUploadSessions
} from "./service";

describe("listing service", () => {
  beforeEach(() => {
    buildDraftAssetKey.mockReset();
    createMarketplaceId.mockReset();
    resolveSellerRequestContext.mockReset();
    listingRepository.attachMediaToDraftListing.mockReset();
    listingRepository.createDraftListing.mockReset();
    listingRepository.findListingById.mockReset();
    storage.createPresignedUploadRequest.mockReset();
    storage.getPublicAssetUrl.mockReset();
  });

  it("creates a blank draft listing for a seller browser session", async () => {
    resolveSellerRequestContext.mockResolvedValue(
      createSellerContext({
        actorType: "user",
        actorUserId: "user_123"
      })
    );
    createMarketplaceId.mockReturnValueOnce("lst_123");
    listingRepository.createDraftListing.mockResolvedValue(
      createListingRecord({
        createdByUserId: "user_123",
        id: "lst_123",
        updatedByUserId: "user_123"
      })
    );

    const result = await createDraftListing(new Request("https://example.com/api/seller/listings", { method: "POST" }));

    expect(result).toEqual({
      data: {
        id: "lst_123",
        media: [],
        object: "listing",
        status: "draft"
      },
      ok: true
    });
    expect(listingRepository.createDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        createdByApiKeyId: null,
        createdByUserId: "user_123",
        id: "lst_123",
        sellerAccountId: "seller_123",
        updatedByApiKeyId: null,
        updatedByUserId: "user_123"
      })
    );
  });

  it("creates a blank draft listing for a seller api key", async () => {
    resolveSellerRequestContext.mockResolvedValue(
      createSellerContext({
        actorApiKeyId: "key_123",
        actorType: "api_key",
        actorUserId: null
      })
    );
    createMarketplaceId.mockReturnValueOnce("lst_456");
    listingRepository.createDraftListing.mockResolvedValue(
      createListingRecord({
        createdByApiKeyId: "key_123",
        id: "lst_456",
        updatedByApiKeyId: "key_123"
      })
    );

    const result = await createDraftListing(new Request("https://example.com/api/seller/listings", { method: "POST" }));

    expect(result).toEqual({
      data: {
        id: "lst_456",
        media: [],
        object: "listing",
        status: "draft"
      },
      ok: true
    });
    expect(listingRepository.createDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        createdByApiKeyId: "key_123",
        createdByUserId: null,
        updatedByApiKeyId: "key_123",
        updatedByUserId: null
      })
    );
  });

  it("creates presigned image upload sessions with stable asset keys", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());
    createMarketplaceId.mockReturnValueOnce("asset_123").mockReturnValueOnce("asset_456");
    buildDraftAssetKey
      .mockReturnValueOnce("listings/drafts/lst_123/asset_123-front.jpg")
      .mockReturnValueOnce("listings/drafts/lst_123/asset_456-back.png");
    storage.createPresignedUploadRequest
      .mockResolvedValueOnce({
        expiresAt: new Date("2026-03-29T22:00:00.000Z"),
        headers: { "content-type": "image/jpeg" },
        method: "PUT",
        url: "https://example-spaces/asset_123"
      })
      .mockResolvedValueOnce({
        expiresAt: new Date("2026-03-29T22:00:00.000Z"),
        headers: { "content-type": "image/png" },
        method: "PUT",
        url: "https://example-spaces/asset_456"
      });

    const result = await createListingUploadSessions(
      new Request("https://example.com/api/seller/upload-sessions", { method: "POST" }),
      {
        files: [
          {
            contentType: "image/jpeg",
            filename: "front.jpg",
            sizeBytes: 2488331
          },
          {
            contentType: "image/png",
            filename: "back.png",
            sizeBytes: 31234
          }
        ],
        listingId: "lst_123"
      }
    );

    expect(result).toEqual({
      data: [
        {
          assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
          upload: {
            expiresAt: "2026-03-29T22:00:00.000Z",
            headers: { "content-type": "image/jpeg" },
            method: "PUT",
            url: "https://example-spaces/asset_123"
          }
        },
        {
          assetKey: "listings/drafts/lst_123/asset_456-back.png",
          upload: {
            expiresAt: "2026-03-29T22:00:00.000Z",
            headers: { "content-type": "image/png" },
            method: "PUT",
            url: "https://example-spaces/asset_456"
          }
        }
      ],
      ok: true
    });
    expect(storage.createPresignedUploadRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
        contentType: "image/jpeg"
      })
    );
    expect(buildDraftAssetKey).toHaveBeenNthCalledWith(1, {
      filename: "front.jpg",
      listingId: "lst_123",
      uploadId: "asset_123"
    });
  });

  it("rejects non-image upload session requests", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());

    const result = await createListingUploadSessions(
      new Request("https://example.com/api/seller/upload-sessions", { method: "POST" }),
      {
        files: [
          {
            contentType: "application/pdf",
            filename: "front.pdf",
            sizeBytes: 2488331
          }
        ],
        listingId: "lst_123"
      }
    );

    expect(result).toEqual({
      code: "invalid_media_type",
      message: "Only image uploads are supported.",
      ok: false,
      status: 400
    });
  });

  it("rejects upload session requests for another seller's draft", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(
      createListingRecord({
        sellerAccountId: "seller_other"
      })
    );

    const result = await createListingUploadSessions(
      new Request("https://example.com/api/seller/upload-sessions", { method: "POST" }),
      {
        files: [
          {
            contentType: "image/jpeg",
            filename: "front.jpg",
            sizeBytes: 2488331
          }
        ],
        listingId: "lst_123"
      }
    );

    expect(result).toEqual({
      code: "forbidden",
      message: "Authenticated seller cannot create upload sessions for that draft listing.",
      ok: false,
      status: 403
    });
  });

  it("attaches uploaded media to a seller-owned draft and derives public urls", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());
    listingRepository.attachMediaToDraftListing.mockResolvedValue(
      createListingRecord({
        media: [
          createListingMediaRecord({
            assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
            id: "med_123",
            sortOrder: 0
          })
        ]
      })
    );
    storage.getPublicAssetUrl.mockReturnValue(
      "https://cmd-market-assets.nyc3.cdn.digitaloceanspaces.com/listings/drafts/lst_123/asset_123-front.jpg"
    );

    const result = await attachDraftListingMedia(
      new Request("https://example.com/api/seller/listings/lst_123/media", { method: "POST" }),
      "lst_123",
      {
        media: [
          {
            altText: "Front photo",
            assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
            sortOrder: 0
          }
        ]
      }
    );

    expect(result).toEqual({
      data: {
        id: "lst_123",
        media: [
          {
            altText: "Front photo",
            assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
            id: "med_123",
            sortOrder: 0,
            url: "https://cmd-market-assets.nyc3.cdn.digitaloceanspaces.com/listings/drafts/lst_123/asset_123-front.jpg"
          }
        ],
        object: "listing",
        status: "draft"
      },
      ok: true
    });
    expect(listingRepository.attachMediaToDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "lst_123",
        sellerAccountId: "seller_123"
      })
    );
  });

  it("rejects attaching media to another seller's draft", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(
      createListingRecord({
        sellerAccountId: "seller_other"
      })
    );

    const result = await attachDraftListingMedia(
      new Request("https://example.com/api/seller/listings/lst_123/media", { method: "POST" }),
      "lst_123",
      {
        media: [
          {
            altText: "Front photo",
            assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
            sortOrder: 0
          }
        ]
      }
    );

    expect(result).toEqual({
      code: "forbidden",
      message: "Authenticated seller cannot modify that draft listing.",
      ok: false,
      status: 403
    });
  });

  it("rejects attaching media from outside the draft asset prefix", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());

    const result = await attachDraftListingMedia(
      new Request("https://example.com/api/seller/listings/lst_123/media", { method: "POST" }),
      "lst_123",
      {
        media: [
          {
            altText: "Front photo",
            assetKey: "listings/drafts/lst_other/asset_123-front.jpg",
            sortOrder: 0
          }
        ]
      }
    );

    expect(result).toEqual({
      code: "invalid_asset_key",
      message: "Attached media must belong to the target draft listing upload prefix.",
      ok: false,
      status: 400
    });
  });

  it("rejects duplicate media attachment for the same draft cleanly", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());
    listingRepository.attachMediaToDraftListing.mockRejectedValue(
      new DuplicateListingMediaAssetKeyError()
    );

    const result = await attachDraftListingMedia(
      new Request("https://example.com/api/seller/listings/lst_123/media", { method: "POST" }),
      "lst_123",
      {
        media: [
          {
            altText: "Front photo",
            assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
            sortOrder: 0
          }
        ]
      }
    );

    expect(result).toEqual({
      code: "duplicate_media_asset_key",
      message: "This asset is already attached to the draft listing.",
      ok: false,
      status: 409
    });
  });
});

function createSellerContext(
  overrides: Partial<{
    actorApiKeyId: string | null;
    actorType: "api_key" | "user";
    actorUserId: string | null;
    eligibilitySource: null;
    eligibilityStatus: "pending";
    organizationId: string;
    sellerAccountId: string;
  }> = {}
) {
  return {
    context: {
      actorApiKeyId: null,
      actorType: "user" as const,
      actorUserId: "user_123",
      eligibilitySource: null,
      eligibilityStatus: "pending" as const,
      organizationId: "org_123",
      sellerAccountId: "seller_123",
      ...overrides
    },
    ok: true as const
  };
}

function createListingRecord(
  overrides: Partial<{
    createdAt: Date;
    createdByApiKeyId: string | null;
    createdByUserId: string | null;
    id: string;
    media: Array<{
      altText: string | null;
      assetKey: string;
      assetType: string;
      createdAt: Date;
      id: string;
      sortOrder: number;
    }>;
    sellerAccountId: string;
    status: "draft";
    updatedAt: Date;
    updatedByApiKeyId: string | null;
    updatedByUserId: string | null;
  }> = {}
) {
  return {
    createdAt: new Date("2026-03-29T20:00:00.000Z"),
    createdByApiKeyId: null,
    createdByUserId: "user_123",
    id: "lst_123",
    media: [],
    sellerAccountId: "seller_123",
    status: "draft" as const,
    updatedAt: new Date("2026-03-29T20:00:00.000Z"),
    updatedByApiKeyId: null,
    updatedByUserId: "user_123",
    ...overrides
  };
}

function createListingMediaRecord(
  overrides: Partial<{
    altText: string | null;
    assetKey: string;
    assetType: string;
    createdAt: Date;
    id: string;
    sortOrder: number;
  }> = {}
) {
  return {
    altText: "Front photo",
    assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
    assetType: "image",
    createdAt: new Date("2026-03-29T20:00:00.000Z"),
    id: "med_123",
    sortOrder: 0,
    ...overrides
  };
}
