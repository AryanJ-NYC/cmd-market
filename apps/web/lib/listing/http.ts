import type {
  CategoryResource,
  CategorySummaryResource,
  PublicListingResource,
  SellerListingResource,
  UploadSessionResource,
} from "./service";

export function serializeSellerListingResponse(listing: SellerListingResource) {
  return {
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
  };
}

export function serializePublicListingResponse(listing: PublicListingResource) {
  return {
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
  };
}

export function serializeUploadSessionsResponse(uploadSessions: UploadSessionResource[]) {
  return {
    data: uploadSessions.map((item) => ({
      asset_key: item.assetKey,
      upload: {
        expires_at: item.upload.expiresAt,
        headers: item.upload.headers,
        method: item.upload.method,
        url: item.upload.url,
      },
    })),
  };
}

export function serializeCategorySummariesResponse(categories: CategorySummaryResource[]) {
  return {
    data: categories.map((category) => ({
      description: category.description,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  };
}

export function serializeCategoryResponse(category: CategoryResource) {
  return {
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
  };
}
