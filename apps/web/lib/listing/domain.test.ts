import { describe, expect, it } from "vitest";
import {
  createListingValidationProblem,
  getDraftListingValidation
} from "./domain";

describe("listing domain", () => {
  it("marks an eligible trading-card draft with media and required fields as publishable", () => {
    const result = getDraftListingValidation({
      eligibilityStatus: "eligible",
      listing: createDraftListingRecord({
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
          attributes: [
            {
              isRequired: true,
              key: "grading_company",
              label: "Grading Company"
            },
            {
              isRequired: true,
              key: "grade",
              label: "Grade"
            }
          ],
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards"
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
            sortOrder: 0
          }
        ],
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    });

    expect(result).toEqual({
      issues: [],
      publishable: true
    });
  });

  it("returns seller, media, and base field issues for an incomplete draft", () => {
    const result = getDraftListingValidation({
      eligibilityStatus: "pending",
      listing: createDraftListingRecord()
    });

    expect(result.publishable).toBe(false);
    expect(result.issues).toEqual([
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
      },
      {
        code: "required",
        field: "title",
        message: "Title is required."
      },
      {
        code: "required",
        field: "description",
        message: "Description is required."
      },
      {
        code: "required",
        field: "condition_code",
        message: "Condition code is required."
      },
      {
        code: "required",
        field: "quantity_available",
        message: "Quantity available is required."
      },
      {
        code: "required",
        field: "price.amount_minor",
        message: "Price amount is required."
      }
    ]);
  });

  it("returns trading-card attribute issues when the category is set but required attributes are missing", () => {
    const result = getDraftListingValidation({
      eligibilityStatus: "eligible",
      listing: createDraftListingRecord({
        category: {
          attributes: [
            {
              isRequired: true,
              key: "grading_company",
              label: "Grading Company"
            },
            {
              isRequired: true,
              key: "grade",
              label: "Grade"
            }
          ],
          id: "cat_cards",
          name: "Trading Cards",
          slug: "trading-cards"
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
            sortOrder: 0
          }
        ],
        quantityAvailable: 1,
        title: "1999 Charizard Holo PSA 8",
        unitPriceMinor: 125000
      })
    });

    expect(result).toEqual({
      issues: [
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
    });
  });

  it("serializes publish validation failures as problem details", () => {
    const problem = createListingValidationProblem({
      errors: [
        {
          code: "required",
          field: "attributes.grade",
          message: "Grade is required for this category."
        }
      ],
      instance: "/api/seller/listings/lst_123/publish"
    });

    expect(problem).toEqual({
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
    title: string | null;
    unitPriceMinor: number | null;
  }> = {}
) {
  return {
    attributes: [],
    category: null,
    conditionCode: null,
    description: null,
    media: [],
    quantityAvailable: null,
    title: null,
    unitPriceMinor: null,
    ...overrides
  };
}
