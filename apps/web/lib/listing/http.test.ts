import { describe, expect, test } from "vitest";
import {
  categoryResponseSchema,
  categorySummariesResponseSchema,
  publicListingResponseSchema,
  sellerListingResponseSchema,
  serializeCategoryResponse,
  serializeCategorySummariesResponse,
  serializePublicListingResponse,
  serializeSellerListingResponse,
  serializeUploadSessionsResponse,
  uploadSessionsResponseSchema
} from "./http";

describe("listing/http", () => {
  test("serializes seller listing responses with the shared schema", () => {
    const response = serializeSellerListingResponse({
      attributes: [
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
      createdAt: "2026-03-30T19:00:00.000Z",
      description: "Clean slab, no cracks, centered well.",
      id: "lst_123",
      management: {
        draftValidation: {
          issues: [],
          publishable: true
        }
      },
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
      price: {
        amountMinor: 125000,
        currencyCode: "USD"
      },
      publishedAt: null,
      quantityAvailable: 1,
      shipping: {
        currencyCode: "USD",
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        mode: "flat",
        scope: "us_50_states"
      },
      shippingProfileId: "shp_123",
      seller: {
        displayName: "Scarce City",
        id: "sel_123",
        slug: "scarce-city"
      },
      status: "draft",
      title: "1999 Charizard Holo PSA 8",
      updatedAt: "2026-03-30T19:00:00.000Z"
    });

    expect(sellerListingResponseSchema.parse(response)).toEqual(response);
  });

  test("serializes public listing responses with the shared schema", () => {
    const response = serializePublicListingResponse({
      attributes: [],
      category: {
        id: "cat_cards",
        name: "Trading Cards",
        slug: "trading-cards"
      },
      conditionCode: "used_good",
      description: "Clean slab, no cracks, centered well.",
      id: "lst_123",
      listingUrl: "https://cmd.market/listings/lst_123",
      media: [
        {
          altText: "Front of the card",
          id: "med_123",
          sortOrder: 0,
          url: "https://cmd.market/listings/lst_123/media/med_123"
        }
      ],
      object: "listing",
      price: {
        amountMinor: 125000,
        currencyCode: "USD"
      },
      publishedAt: "2026-03-30T20:00:00.000Z",
      quantityAvailable: 1,
      shipping: {
        currencyCode: "USD",
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        mode: "flat",
        scope: "us_50_states"
      },
      seller: {
        displayName: "Scarce City",
        id: "sel_123",
        slug: "scarce-city"
      },
      status: "published",
      title: "1999 Charizard Holo PSA 8",
      updatedAt: "2026-03-30T20:00:00.000Z"
    });

    expect(publicListingResponseSchema.parse(response)).toEqual({
      data: {
        attributes: [],
        category: {
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards",
        },
        condition_code: "used_good",
        description: "Clean slab, no cracks, centered well.",
        id: "lst_123",
        listing_url: "https://cmd.market/listings/lst_123",
        media: [
          {
            alt_text: "Front of the card",
            id: "med_123",
            sort_order: 0,
            url: "https://cmd.market/listings/lst_123/media/med_123",
          },
        ],
        object: "listing",
        price: {
          amount_minor: 125000,
          currency_code: "USD",
        },
        published_at: "2026-03-30T20:00:00.000Z",
        quantity_available: 1,
        shipping: {
          currency_code: "USD",
          domestic_rate_minor: 499,
          handling_time_days: 2,
          mode: "flat",
          scope: "us_50_states",
        },
        seller: {
          display_name: "Scarce City",
          id: "sel_123",
          slug: "scarce-city",
        },
        status: "published",
        title: "1999 Charizard Holo PSA 8",
        updated_at: "2026-03-30T20:00:00.000Z",
      },
    });
  });

  test("serializes category responses with the shared schemas", () => {
    const summaries = serializeCategorySummariesResponse([
      {
        description: "Physical trading cards and graded slabs.",
        id: "cat_cards",
        name: "Trading Cards",
        slug: "trading-cards"
      }
    ]);
    const detail = serializeCategoryResponse({
      attributes: [
        {
          allowedValues: ["psa", "bgs"],
          isRequired: true,
          key: "grading_company",
          label: "Grading Company",
          valueType: "enum"
        }
      ],
      description: "Physical trading cards and graded slabs.",
      id: "cat_cards",
      name: "Trading Cards",
      slug: "trading-cards"
    });

    expect(categorySummariesResponseSchema.parse(summaries)).toEqual(summaries);
    expect(categoryResponseSchema.parse(detail)).toEqual(detail);
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
