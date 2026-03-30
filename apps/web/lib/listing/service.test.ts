import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  DuplicateListingMediaAssetKeyError,
  MissingUploadedAssetError,
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
  MissingUploadedAssetError: class MissingUploadedAssetError extends Error {
    constructor(assetKey: string) {
      super(`missing uploaded asset: ${assetKey}`);
      this.name = "MissingUploadedAssetError";
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
    assertUploadedAssetExists: vi.fn(),
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
  MissingUploadedAssetError,
  ...storage,
  buildDraftAssetKey
}));

import {
  attachListingMediaSchema,
  attachDraftListingMedia,
  createDraftListing,
  createListingUploadSessions,
  parseAttachListingMediaInput
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
    storage.assertUploadedAssetExists.mockReset();
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
      data: expect.objectContaining({
        attributes: [],
        category: null,
        conditionCode: null,
        createdAt: "2026-03-29T20:00:00.000Z",
        id: "lst_123",
        management: {
          draftValidation: {
            issues: expect.arrayContaining([
              {
                code: "seller_not_eligible",
                field: "seller",
                message: "Seller workspace is not eligible to publish listings."
              },
              {
                code: "minimum_items_not_met",
                field: "media",
                message: "At least one image is required."
              },
              {
                code: "required",
                field: "category",
                message: "Category is required."
              }
            ]),
            publishable: false
          }
        },
        media: [],
        object: "listing",
        price: null,
        seller: {
          displayName: "Scarce Cards",
          id: "seller_123",
          slug: "scarce-cards"
        },
        status: "draft"
      }),
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
      data: expect.objectContaining({
        attributes: [],
        category: null,
        id: "lst_456",
        management: {
          draftValidation: {
            issues: expect.arrayContaining([
              {
                code: "seller_not_eligible",
                field: "seller",
                message: "Seller workspace is not eligible to publish listings."
              }
            ]),
            publishable: false
          }
        },
        media: [],
        object: "listing",
        seller: {
          displayName: "Scarce Cards",
          id: "seller_123",
          slug: "scarce-cards"
        },
        status: "draft"
      }),
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
            filename: "front.jpg"
          },
          {
            contentType: "image/png",
            filename: "back.png"
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
            filename: "front.pdf"
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
            filename: "front.jpg"
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

  it("accepts minimal media attachment payloads and defaults sort order by array position", () => {
    const parsed = attachListingMediaSchema.parse({
      media: [
        {
          asset_key: "listings/drafts/lst_123/asset_123-front.jpg"
        },
        {
          alt_text: "Back photo",
          asset_key: "listings/drafts/lst_123/asset_456-back.jpg"
        }
      ]
    });

    expect(parseAttachListingMediaInput(parsed)).toEqual({
      media: [
        {
          altText: null,
          assetKey: "listings/drafts/lst_123/asset_123-front.jpg",
          sortOrder: 0
        },
        {
          altText: "Back photo",
          assetKey: "listings/drafts/lst_123/asset_456-back.jpg",
          sortOrder: 1
        }
      ]
    });
  });

  it("attaches uploaded media to a seller-owned draft and derives public urls", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());
    storage.assertUploadedAssetExists.mockResolvedValue(undefined);
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
      data: expect.objectContaining({
        attributes: [],
        category: null,
        id: "lst_123",
        management: {
          draftValidation: {
            issues: expect.arrayContaining([
              {
                code: "seller_not_eligible",
                field: "seller",
                message: "Seller workspace is not eligible to publish listings."
              },
              {
                code: "required",
                field: "category",
                message: "Category is required."
              },
              {
                code: "required",
                field: "title",
                message: "Title is required."
              }
            ]),
            publishable: false
          }
        },
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
        seller: {
          displayName: "Scarce Cards",
          id: "seller_123",
          slug: "scarce-cards"
        },
        status: "draft"
      }),
      ok: true
    });
    expect(listingRepository.attachMediaToDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: "lst_123",
        sellerAccountId: "seller_123"
      })
    );
    expect(storage.assertUploadedAssetExists).toHaveBeenCalledWith(
      "listings/drafts/lst_123/asset_123-front.jpg"
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
    storage.assertUploadedAssetExists.mockResolvedValue(undefined);
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

  it("returns a conflict when media attachment loses a race to publish", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById
      .mockResolvedValueOnce(createListingRecord())
      .mockResolvedValueOnce(
        createListingRecord({
          publishedAt: new Date("2026-03-30T20:35:00.000Z"),
          status: "published"
        })
      );
    storage.assertUploadedAssetExists.mockResolvedValue(undefined);
    listingRepository.attachMediaToDraftListing.mockResolvedValue(null);

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
      code: "listing_not_draft",
      message: "Only draft listings can accept media attachments.",
      ok: false,
      status: 409
    });
  });

  it("rejects media attachment when the uploaded asset does not exist in storage", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext());
    listingRepository.findListingById.mockResolvedValue(createListingRecord());
    storage.assertUploadedAssetExists.mockRejectedValue(
      new MissingUploadedAssetError("listings/drafts/lst_123/asset_123-front.jpg")
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
      code: "asset_not_uploaded",
      message: "Uploaded media must exist in storage before it can be attached.",
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
    attributes: Array<{
      categoryAttributeId?: string;
      key: string;
      label: string;
      value: boolean | number | string | Record<string, unknown>;
      valueType: "boolean" | "enum" | "json" | "number" | "text";
    }>;
    category: {
      attributes: Array<{
        allowedValues: string[] | null;
        id: string;
        isRequired: boolean;
        key: string;
        label: string;
        valueType: "boolean" | "enum" | "json" | "number" | "text";
      }>;
      description: string | null;
      id: string;
      name: string;
      slug: string;
    } | null;
    conditionCode: string | null;
    createdAt: Date;
    createdByApiKeyId: string | null;
    createdByUserId: string | null;
    description: string | null;
    displayCurrencyCode: string;
    id: string;
    media: Array<{
      altText: string | null;
      assetKey: string;
      assetType: string;
      createdAt: Date;
      id: string;
      sortOrder: number;
    }>;
    publishedAt: Date | null;
    quantityAvailable: number | null;
    seller: {
      displayName: string;
      id: string;
      slug: string;
    };
    sellerAccountId: string;
    status: "draft" | "published";
    title: string | null;
    unitPriceMinor: number | null;
    updatedAt: Date;
    updatedByApiKeyId: string | null;
    updatedByUserId: string | null;
  }> = {}
) {
  return {
    attributes: [],
    category: null,
    conditionCode: null,
    createdAt: new Date("2026-03-29T20:00:00.000Z"),
    createdByApiKeyId: null,
    createdByUserId: "user_123",
    description: null,
    displayCurrencyCode: "USD",
    id: "lst_123",
    media: [],
    publishedAt: null,
    quantityAvailable: null,
    seller: {
      displayName: "Scarce Cards",
      id: "seller_123",
      slug: "scarce-cards"
    },
    sellerAccountId: "seller_123",
    status: "draft" as const,
    title: null,
    unitPriceMinor: null,
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
