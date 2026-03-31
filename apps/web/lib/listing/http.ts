import "zod-openapi";
import { z } from "zod";
import type {
  CategoryResource,
  CategorySummaryResource,
  PublicListingResource,
  SellerListingResource,
  UploadSessionResource,
} from "./service";

const listingAttributeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

const listingAttributeSchema = z
  .object({
    key: z.string(),
    label: z.string(),
    value: listingAttributeValueSchema,
    value_type: z.enum(["boolean", "enum", "json", "number", "text"]),
  })
  .meta({
    description: "Typed listing attribute value.",
    id: "ListingAttribute",
  });

const listingCategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .meta({
    description: "Listing category summary.",
    id: "ListingCategory",
  });

const listingPriceSchema = z
  .object({
    amount_minor: z.number().int().nonnegative(),
    currency_code: z.string().length(3),
  })
  .meta({
    description: "Listing price in minor units.",
    id: "ListingPrice",
  });

const listingSellerSchema = z
  .object({
    display_name: z.string(),
    id: z.string(),
    slug: z.string(),
  })
  .meta({
    description: "Seller summary for listing responses.",
    id: "ListingSeller",
  });

const draftValidationIssueSchema = z
  .object({
    code: z.string(),
    field: z.string(),
    message: z.string(),
  })
  .meta({
    description: "Field-level draft validation issue.",
    id: "DraftValidationIssue",
  });

const sellerListingMediaItemSchema = z
  .object({
    alt_text: z.string().nullable(),
    asset_key: z.string(),
    id: z.string(),
    sort_order: z.number().int().nonnegative(),
    url: z.url(),
  })
  .meta({
    description: "Attached media for a seller-owned listing.",
    id: "SellerListingMediaItem",
  });

const publicListingMediaItemSchema = z
  .object({
    alt_text: z.string().nullable(),
    id: z.string(),
    sort_order: z.number().int().nonnegative(),
    url: z.url(),
  })
  .meta({
    description: "Public listing media item.",
    id: "PublicListingMediaItem",
  });

export const sellerListingResponseSchema = z
  .object({
    data: z.object({
      attributes: z.array(listingAttributeSchema),
      category: listingCategorySchema.nullable(),
      condition_code: z.string().nullable(),
      created_at: z.string(),
      description: z.string().nullable(),
      id: z.string(),
      management: z.object({
        draft_validation: z.object({
          issues: z.array(draftValidationIssueSchema),
          publishable: z.boolean(),
        }),
      }),
      media: z.array(sellerListingMediaItemSchema),
      object: z.literal("listing"),
      price: listingPriceSchema.nullable(),
      published_at: z.string().nullable(),
      quantity_available: z.number().int().nullable(),
      seller: listingSellerSchema,
      status: z.string(),
      title: z.string().nullable(),
      updated_at: z.string(),
    }),
  })
  .meta({
    description: "Seller listing response envelope.",
    id: "SellerListingResponse",
  });

export const publicListingResponseSchema = z
  .object({
    data: z.object({
      attributes: z.array(listingAttributeSchema),
      category: listingCategorySchema.nullable(),
      condition_code: z.string().nullable(),
      description: z.string().nullable(),
      id: z.string(),
      media: z.array(publicListingMediaItemSchema),
      object: z.literal("listing"),
      price: listingPriceSchema.nullable(),
      published_at: z.string().nullable(),
      quantity_available: z.number().int().nullable(),
      seller: listingSellerSchema,
      status: z.string(),
      title: z.string().nullable(),
      updated_at: z.string(),
    }),
  })
  .meta({
    description: "Public listing response envelope.",
    id: "PublicListingResponse",
  });

export const uploadSessionSchema = z
  .object({
    asset_key: z.string(),
    upload: z.object({
      expires_at: z.string(),
      headers: z.record(z.string(), z.string()),
      method: z.literal("PUT"),
      url: z.url(),
    }),
  })
  .meta({
    description: "Direct-upload instructions for one draft media object.",
    id: "UploadSession",
  });

export const uploadSessionsResponseSchema = z
  .object({
    data: z.array(uploadSessionSchema),
  })
  .meta({
    description: "Upload session response envelope.",
    id: "UploadSessionsResponse",
  });

export const categorySummarySchema = z
  .object({
    description: z.string().nullable(),
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .meta({
    description: "Public category summary.",
    id: "CategorySummary",
  });

export const categorySummariesResponseSchema = z
  .object({
    data: z.array(categorySummarySchema),
  })
  .meta({
    description: "Category summary list response envelope.",
    id: "CategorySummariesResponse",
  });

export const categoryAttributeSchema = z
  .object({
    allowed_values: z.array(z.string()).nullable(),
    is_required: z.boolean(),
    key: z.string(),
    label: z.string(),
    value_type: z.enum(["boolean", "enum", "json", "number", "text"]),
  })
  .meta({
    description: "Category attribute definition.",
    id: "CategoryAttribute",
  });

export const categoryResponseSchema = z
  .object({
    data: z.object({
      attributes: z.array(categoryAttributeSchema),
      description: z.string().nullable(),
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
  })
  .meta({
    description: "Category detail response envelope.",
    id: "CategoryResponse",
  });

export const listingValidationProblemSchema = z
  .object({
    code: z.literal("listing_validation_failed"),
    detail: z.string(),
    errors: z.array(draftValidationIssueSchema),
    instance: z.string(),
    status: z.literal(422),
    title: z.literal("Listing validation failed"),
    type: z.literal("https://cmd.market/problems/listing-validation-failed"),
  })
  .meta({
    description: "Problem Details payload returned when a listing draft cannot be published yet.",
    id: "ListingValidationProblem",
  });

export function serializeSellerListingResponse(listing: SellerListingResource) {
  return sellerListingResponseSchema.parse({
    data: {
      attributes: listing.attributes.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        value: attribute.value,
        value_type: attribute.valueType,
      })),
      category: listing.category
        ? {
            id: listing.category.id,
            name: listing.category.name,
            slug: listing.category.slug,
          }
        : null,
      condition_code: listing.conditionCode,
      created_at: listing.createdAt,
      description: listing.description,
      id: listing.id,
      management: {
        draft_validation: {
          issues: listing.management.draftValidation.issues,
          publishable: listing.management.draftValidation.publishable,
        },
      },
      media: listing.media.map((item) => ({
        alt_text: item.altText,
        asset_key: item.assetKey,
        id: item.id,
        sort_order: item.sortOrder,
        url: item.url,
      })),
      object: listing.object,
      price: listing.price
        ? {
            amount_minor: listing.price.amountMinor,
            currency_code: listing.price.currencyCode,
          }
        : null,
      published_at: listing.publishedAt,
      quantity_available: listing.quantityAvailable,
      seller: {
        display_name: listing.seller.displayName,
        id: listing.seller.id,
        slug: listing.seller.slug,
      },
      status: listing.status,
      title: listing.title,
      updated_at: listing.updatedAt,
    },
  });
}

export function serializePublicListingResponse(listing: PublicListingResource) {
  return publicListingResponseSchema.parse({
    data: {
      attributes: listing.attributes.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        value: attribute.value,
        value_type: attribute.valueType,
      })),
      category: listing.category
        ? {
            id: listing.category.id,
            name: listing.category.name,
            slug: listing.category.slug,
          }
        : null,
      condition_code: listing.conditionCode,
      description: listing.description,
      id: listing.id,
      media: listing.media.map((item) => ({
        alt_text: item.altText,
        id: item.id,
        sort_order: item.sortOrder,
        url: item.url,
      })),
      object: listing.object,
      price: listing.price
        ? {
            amount_minor: listing.price.amountMinor,
            currency_code: listing.price.currencyCode,
          }
        : null,
      published_at: listing.publishedAt,
      quantity_available: listing.quantityAvailable,
      seller: {
        display_name: listing.seller.displayName,
        id: listing.seller.id,
        slug: listing.seller.slug,
      },
      status: listing.status,
      title: listing.title,
      updated_at: listing.updatedAt,
    },
  });
}

export function serializeUploadSessionsResponse(uploadSessions: UploadSessionResource[]) {
  return uploadSessionsResponseSchema.parse({
    data: uploadSessions.map((item) => ({
      asset_key: item.assetKey,
      upload: {
        expires_at: item.upload.expiresAt,
        headers: item.upload.headers,
        method: item.upload.method,
        url: item.upload.url,
      },
    })),
  });
}

export function serializeCategorySummariesResponse(categories: CategorySummaryResource[]) {
  return categorySummariesResponseSchema.parse({
    data: categories.map((category) => ({
      description: category.description,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  });
}

export function serializeCategoryResponse(category: CategoryResource) {
  return categoryResponseSchema.parse({
    data: {
      attributes: category.attributes.map((attribute) => ({
        allowed_values: attribute.allowedValues,
        is_required: attribute.isRequired,
        key: attribute.key,
        label: attribute.label,
        value_type: attribute.valueType,
      })),
      description: category.description,
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
  });
}
