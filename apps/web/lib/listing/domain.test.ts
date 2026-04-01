import { describe, expect, it } from "vitest";
import { createListingValidationProblem, getDraftListingValidation } from "./domain";

describe("listing domain", () => {
  it("marks a complete eligible trading-card draft as publishable", () => {
    const result = getDraftListingValidation({
      eligibilityStatus: "eligible",
      listing: createDraftListingRecord({
        attributes: [
          {
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum",
          },
          {
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number",
          },
        ],
        category: {
          attributes: [
            {
              isRequired: true,
              key: "grading_company",
              label: "Grading Company",
            },
            {
              isRequired: true,
              key: "grade",
              label: "Grade",
            },
          ],
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards",
        },
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        media: [
          {
            altText: "Front of slab",
            assetKey: "listings/drafts/lst_123/front.jpg",
            assetType: "image",
            createdAt: new Date("2026-03-30T10:00:00.000Z"),
            id: "med_123",
            sortOrder: 0,
          },
        ],
        quantityAvailable: 1,
        shippingProfileId: "shp_123",
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000,
      }),
    });

    expect(result).toEqual({
      issues: [],
      publishable: true,
    });
  });

  it("serializes publish validation failures as problem details", () => {
    const problem = createListingValidationProblem({
      errors: [
        {
          code: "required",
          field: "attributes.grade",
          message: "Grade is required for this category.",
        },
      ],
      instance: "/api/seller/listings/lst_123/publish",
    });

    expect(problem).toEqual({
      code: "listing_validation_failed",
      detail: "The listing cannot be published until required fields are complete.",
      errors: [
        {
          code: "required",
          field: "attributes.grade",
          message: "Grade is required for this category.",
        },
      ],
      instance: "/api/seller/listings/lst_123/publish",
      status: 422,
      title: "Listing validation failed",
      type: "https://cmd.market/problems/listing-validation-failed",
    });
  });

  it("marks drafts without a shipping profile as not publishable", () => {
    const result = getDraftListingValidation({
      eligibilityStatus: "eligible",
      listing: createDraftListingRecord({
        attributes: [
          {
            key: "grading_company",
            label: "Grading Company",
            value: "psa",
            valueType: "enum",
          },
          {
            key: "grade",
            label: "Grade",
            value: 8,
            valueType: "number",
          },
        ],
        category: {
          attributes: [
            {
              isRequired: true,
              key: "grading_company",
              label: "Grading Company",
            },
            {
              isRequired: true,
              key: "grade",
              label: "Grade",
            },
          ],
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards",
        },
        conditionCode: "used_good",
        description: "Clean slab, no cracks, centered well.",
        media: [
          {
            altText: "Front of slab",
            assetKey: "listings/drafts/lst_123/front.jpg",
            assetType: "image",
            createdAt: new Date("2026-03-30T10:00:00.000Z"),
            id: "med_123",
            sortOrder: 0,
          },
        ],
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000,
      }),
    });

    expect(result).toEqual({
      issues: [
        {
          code: "required",
          field: "shipping_profile",
          message: "Shipping profile is required.",
        },
      ],
      publishable: false,
    });
  });
});

function createDraftListingRecord(
  overrides: Partial<{
    attributes: Array<{
      key: string;
      label: string;
      value: boolean | number | string | Record<string, unknown>;
      valueType: "boolean" | "enum" | "json" | "number" | "text";
    }>;
    category: {
      attributes: Array<{
        isRequired: boolean;
        key: string;
        label: string;
      }>;
      id: string;
      name: string;
      slug: string;
    } | null;
    conditionCode: string | null;
    description: string | null;
    media: Array<{
      altText: string | null;
      assetKey: string;
      assetType: string;
      createdAt: Date;
      id: string;
      sortOrder: number;
    }>;
    quantityAvailable: number | null;
    shippingProfileId: string | null;
    title: string | null;
    unitPriceMinor: number | null;
  }> = {},
) {
  return {
    attributes: [],
    category: null,
    conditionCode: null,
    description: null,
    media: [],
    quantityAvailable: null,
    shippingProfileId: null,
    title: null,
    unitPriceMinor: null,
    ...overrides,
  };
}
