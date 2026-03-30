import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createMarketplaceId,
  resolveSellerRequestContext,
  listingRepository,
  storage
} = vi.hoisted(() => ({
  createMarketplaceId: vi.fn(),
  resolveSellerRequestContext: vi.fn(),
  listingRepository: {
    createDraftListing: vi.fn(),
    findCategoryById: vi.fn(),
    findCategoryBySlug: vi.fn(),
    findListingById: vi.fn(),
    listActiveCategories: vi.fn(),
    publishDraftListing: vi.fn(),
    updateDraftListing: vi.fn()
  },
  storage: {
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
  listingRepository
}));

vi.mock("../storage/spaces", () => ({
  getPublicAssetUrl: storage.getPublicAssetUrl
}));

import {
  createDraftListing,
  getCategory,
  getPublicListing,
  listCategories,
  publishListing,
  updateDraftListing
} from "./service";

describe("listing service issue #3", () => {
  beforeEach(() => {
    createMarketplaceId.mockReset();
    resolveSellerRequestContext.mockReset();
    listingRepository.createDraftListing.mockReset();
    listingRepository.findCategoryById.mockReset();
    listingRepository.findCategoryBySlug.mockReset();
    listingRepository.findListingById.mockReset();
    listingRepository.listActiveCategories.mockReset();
    listingRepository.publishDraftListing.mockReset();
    listingRepository.updateDraftListing.mockReset();
    storage.getPublicAssetUrl.mockReset();
  });

  it("creates a draft listing with initial fields and returns management validation", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext({ eligibilityStatus: "eligible" }));
    listingRepository.findCategoryById.mockResolvedValue(createCategoryRecord());
    createMarketplaceId.mockReturnValueOnce("lst_123").mockReturnValueOnce("audit_123");
    listingRepository.createDraftListing.mockResolvedValue(
      createListingRecord({
        category: createCategoryRecord(),
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        displayCurrencyCode: "USD",
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    );

    const result = await createDraftListing(new Request("https://example.com/api/seller/listings", { method: "POST" }), {
      categoryId: "cat_cards",
      conditionCode: "used_good",
      description: "Clean slab, no cracks, centered well.",
      price: {
        amountMinor: 125000,
        currencyCode: "USD"
      },
      quantityAvailable: 1,
      title: "1999 Charizard Holo PSA 8"
    });

    expect(result).toEqual({
      data: expect.objectContaining({
        attributes: [],
        category: {
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards"
        },
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        id: "lst_123",
        management: {
          draftValidation: {
            issues: [
              {
                code: "minimum_items_not_met",
                field: "media",
                message: "At least one image is required."
              },
              {
                code: "required",
                field: "attributes.grading_company",
                message: "Grading Company is required for this category."
              },
              {
                code: "required",
                field: "attributes.grade",
                message: "Grade is required for this category."
              }
            ],
            publishable: false
          }
        },
        object: "listing",
        price: {
          amountMinor: 125000,
          currencyCode: "USD"
        },
        quantityAvailable: 1,
        seller: {
          displayName: "Scarce Cards",
          id: "seller_123",
          slug: "scarce-cards"
        },
        status: "draft",
        title: "1999 Charizard Holo PSA 8"
      }),
      ok: true
    });
    expect(listingRepository.createDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "cat_cards",
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        displayCurrencyCode: "USD",
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    );
  });

  it("updates a draft listing with core fields and typed trading-card attributes", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext({ eligibilityStatus: "eligible" }));
    listingRepository.findListingById.mockResolvedValue(createListingRecord({ category: createCategoryRecord() }));
    listingRepository.findCategoryById.mockResolvedValue(createCategoryRecord());
    listingRepository.updateDraftListing.mockResolvedValue(
      createListingRecord({
        attributes: [
          createListingAttributeRecord({
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum"
          }),
          createListingAttributeRecord({
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number"
          })
        ],
        category: createCategoryRecord(),
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        displayCurrencyCode: "USD",
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    );

    const result = await updateDraftListing(
      new Request("https://example.com/api/seller/listings/lst_123", { method: "PATCH" }),
      "lst_123",
      {
        attributes: [
          {
            key: "grading_company",
            value: "psa"
          },
          {
            key: "grade",
            value: 8
          }
        ],
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        price: {
          amountMinor: 125000,
          currencyCode: "USD"
        },
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8"
      }
    );

    expect(result).toEqual({
      data: expect.objectContaining({
        attributes: [
          {
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum"
          },
          {
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number"
          }
        ],
        management: {
          draftValidation: {
            issues: [
              {
                code: "minimum_items_not_met",
                field: "media",
                message: "At least one image is required."
              }
            ],
            publishable: false
          }
        }
      }),
      ok: true
    });
    expect(listingRepository.updateDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: [
          expect.objectContaining({
            categoryAttributeId: "catattr_cards_grading_company",
            key: "grading_company",
            label: "Grading Company",
            valueBoolean: null,
            valueJson: null,
            valueNumber: null,
            valueText: "psa"
          }),
          expect.objectContaining({
            categoryAttributeId: "catattr_cards_grade",
            key: "grade",
            label: "Grade",
            valueBoolean: null,
            valueJson: null,
            valueNumber: 8,
            valueText: null
          })
        ]
      })
    );
  });

  it("returns a conflict when a draft update loses a race to publish", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext({ eligibilityStatus: "eligible" }));
    listingRepository.findListingById
      .mockResolvedValueOnce(createListingRecord({ category: createCategoryRecord() }))
      .mockResolvedValueOnce(
        createListingRecord({
          category: createCategoryRecord(),
          publishedAt: new Date("2026-03-30T19:55:00.000Z"),
          status: "published",
        }),
      );
    listingRepository.updateDraftListing.mockResolvedValue(null);

    const result = await updateDraftListing(
      new Request("https://example.com/api/seller/listings/lst_123", { method: "PATCH" }),
      "lst_123",
      {
        title: "Updated title",
      },
    );

    expect(result).toEqual({
      code: "listing_not_draft",
      message: "Only draft listings can be updated.",
      ok: false,
      status: 409,
    });
  });

  it("removes prior category attribute rows by previous ids when the category changes", async () => {
    const currentCategory = createCategoryRecord();
    const targetCategory = createCategoryRecord({
      attributes: [
        {
          allowedValues: ["psa", "bgs", "cgc"],
          id: "catattr_alt_grading_company",
          isRequired: true,
          key: "grading_company",
          label: "Grading Company",
          valueType: "enum",
        },
        {
          allowedValues: null,
          id: "catattr_alt_grade",
          isRequired: true,
          key: "grade",
          label: "Grade",
          valueType: "number",
        },
      ],
      id: "cat_alt_cards",
      name: "Alternate Trading Cards",
      slug: "alternate-trading-cards",
    });

    resolveSellerRequestContext.mockResolvedValue(createSellerContext({ eligibilityStatus: "eligible" }));
    listingRepository.findListingById.mockResolvedValue(
      createListingRecord({
        attributes: [
          createListingAttributeRecord({
            categoryAttributeId: "catattr_cards_grading_company",
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum",
          }),
          createListingAttributeRecord({
            categoryAttributeId: "catattr_cards_grade",
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number",
          }),
        ],
        category: currentCategory,
      }),
    );
    listingRepository.findCategoryById.mockResolvedValue(targetCategory);
    listingRepository.updateDraftListing.mockResolvedValue(
      createListingRecord({
        attributes: [
          createListingAttributeRecord({
            categoryAttributeId: "catattr_alt_grading_company",
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum",
          }),
          createListingAttributeRecord({
            categoryAttributeId: "catattr_alt_grade",
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number",
          }),
        ],
        category: targetCategory,
      }),
    );

    await updateDraftListing(
      new Request("https://example.com/api/seller/listings/lst_123", { method: "PATCH" }),
      "lst_123",
      {
        categoryId: "cat_alt_cards",
      },
    );

    expect(listingRepository.updateDraftListing).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: [
          expect.objectContaining({
            categoryAttributeId: "catattr_alt_grading_company",
            key: "grading_company",
          }),
          expect.objectContaining({
            categoryAttributeId: "catattr_alt_grade",
            key: "grade",
          }),
        ],
        removeCategoryAttributeIds: [
          "catattr_cards_grading_company",
          "catattr_cards_grade",
        ],
      }),
    );
  });

  it("lists active category metadata for public consumers", async () => {
    listingRepository.listActiveCategories.mockResolvedValue([createCategoryRecord()]);

    const result = await listCategories();

    expect(result).toEqual({
      data: [
        {
          description: "Graded and raw trading cards.",
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards"
        }
      ],
      ok: true
    });
  });

  it("returns full trading-card category metadata by slug", async () => {
    listingRepository.findCategoryBySlug.mockResolvedValue(createCategoryRecord());

    const result = await getCategory("trading-cards");

    expect(result).toEqual({
      data: {
        attributes: [
          {
            allowedValues: ["psa", "bgs", "cgc"],
            isRequired: true,
            key: "grading_company",
            label: "Grading Company",
            valueType: "enum"
          },
          {
            allowedValues: null,
            isRequired: true,
            key: "grade",
            label: "Grade",
            valueType: "number"
          }
        ],
        description: "Graded and raw trading cards.",
        id: "cat_cards",
        name: "Trading Cards",
        slug: "trading-cards"
      },
      ok: true
    });
  });

  it("returns a structured publish validation problem when a required trading-card attribute is missing", async () => {
    resolveSellerRequestContext.mockResolvedValue(createSellerContext({ eligibilityStatus: "eligible" }));
    listingRepository.findListingById.mockResolvedValue(
      createListingRecord({
        attributes: [
          createListingAttributeRecord({
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum"
          })
        ],
        category: createCategoryRecord(),
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        displayCurrencyCode: "USD",
        media: [createListingMediaRecord()],
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    );

    const result = await publishListing(
      new Request("https://example.com/api/seller/listings/lst_123/publish", { method: "POST" }),
      "lst_123"
    );

    expect(result).toEqual({
      ok: false,
      problem: {
        code: "listing_validation_failed",
        detail: "The listing cannot be published until required fields are complete.",
        errors: [
          {
            code: "required",
            field: "attributes.grade",
            message: "Grade is required for this category."
          }
        ],
        instance: "/api/seller/listings/lst_123/publish",
        status: 422,
        title: "Listing validation failed",
        type: "https://cmd.market/problems/listing-validation-failed"
      }
    });
  });

  it("returns a canonical public listing only when the listing is published", async () => {
    storage.getPublicAssetUrl.mockReturnValue("https://cmd-market-space-dev.nyc3.digitaloceanspaces.com/listings/published/lst_123/front.jpg");
    listingRepository.findListingById
      .mockResolvedValueOnce(createListingRecord())
      .mockResolvedValueOnce(
        createListingRecord({
          attributes: [
            createListingAttributeRecord({
              key: "grading_company",
              label: "Grading Company",
              value: "psa",
              valueType: "enum"
            }),
            createListingAttributeRecord({
              key: "grade",
              label: "Grade",
              value: 8,
              valueType: "number"
            })
          ],
          category: createCategoryRecord(),
          conditionCode: "used_good",
          description: "Clean slab, no cracks, centered well.",
          displayCurrencyCode: "USD",
          media: [
            createListingMediaRecord({
              assetKey: "listings/published/lst_123/front.jpg"
            })
          ],
          publishedAt: new Date("2026-03-30T11:00:00.000Z"),
          quantityAvailable: 1,
          status: "published",
          title: "1999 Charizard Holo PSA 8",
          unitPriceMinor: 125000
        })
      );

    await expect(getPublicListing("lst_123")).resolves.toEqual({
      code: "listing_not_found",
      message: "Published listing could not be found.",
      ok: false,
      status: 404
    });

    await expect(getPublicListing("lst_123")).resolves.toEqual({
      data: {
        attributes: [
          {
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum"
          },
          {
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number"
          }
        ],
        category: {
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards"
        },
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        id: "lst_123",
        media: [
          {
            altText: "Front photo",
            id: "med_123",
            sortOrder: 0,
            url: "https://cmd-market-space-dev.nyc3.digitaloceanspaces.com/listings/published/lst_123/front.jpg"
          }
        ],
        object: "listing",
        price: {
          amountMinor: 125000,
          currencyCode: "USD"
        },
        publishedAt: "2026-03-30T11:00:00.000Z",
        quantityAvailable: 1,
        seller: {
          displayName: "Scarce Cards",
          id: "seller_123",
          slug: "scarce-cards"
        },
        status: "published",
        title: "1999 Charizard Holo PSA 8",
        updatedAt: "2026-03-29T20:00:00.000Z"
      },
      ok: true
    });
  });
});

function createSellerContext(
  overrides: Partial<{
    actorApiKeyId: string | null;
    actorType: "api_key" | "user";
    actorUserId: string | null;
    eligibilitySource: null;
    eligibilityStatus: "eligible" | "pending";
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

function createCategoryRecord(
  overrides: Partial<{
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
  }> = {},
) {
  return {
    attributes: [
      {
        allowedValues: ["psa", "bgs", "cgc"],
        id: "catattr_cards_grading_company",
        isRequired: true,
        key: "grading_company",
        label: "Grading Company",
        valueType: "enum" as const
      },
      {
        allowedValues: null,
        id: "catattr_cards_grade",
        isRequired: true,
        key: "grade",
        label: "Grade",
        valueType: "number" as const
      }
    ],
    description: "Graded and raw trading cards.",
    id: "cat_cards",
    name: "Trading Cards",
    slug: "trading-cards",
    ...overrides,
  };
}

function createListingRecord(
  overrides: Partial<{
    attributes: Array<{
      categoryAttributeId: string;
      key: string;
      label: string;
      value: boolean | number | string | Record<string, unknown>;
      valueType: "boolean" | "enum" | "json" | "number" | "text";
    }>;
    category: ReturnType<typeof createCategoryRecord> | null;
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
    assetKey: "listings/drafts/lst_123/front.jpg",
    assetType: "image",
    createdAt: new Date("2026-03-29T20:00:00.000Z"),
    id: "med_123",
    sortOrder: 0,
    ...overrides
  };
}

function createListingAttributeRecord(
  overrides: Partial<{
    categoryAttributeId: string;
    key: string;
    label: string;
    value: boolean | number | string | Record<string, unknown>;
    valueType: "boolean" | "enum" | "json" | "number" | "text";
  }>
) {
  return {
    categoryAttributeId: "catattr_cards_grading_company",
    key: "grading_company",
    label: "Grading Company",
    value: "psa",
    valueType: "enum" as const,
    ...overrides
  };
}
