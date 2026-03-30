import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { createMarketplaceId } from "../db/ids";
import { resolveSellerRequestContext } from "../seller/service";
import {
  assertUploadedAssetExists,
  buildDraftAssetKey,
  createPresignedUploadRequest,
  getPublicAssetUrl,
  MissingUploadedAssetError,
} from "../storage/spaces";
import {
  createListingValidationProblem,
  getDraftListingValidation,
  type DraftListingValidationIssue,
  type ListingValidationProblem,
} from "./domain";
import {
  DuplicateListingMediaAssetKeyError,
  type CategoryAttributeRecord,
  type CategoryRecord,
  type ListingAttributeValueRecord,
  type ListingRecord,
  listingRepository,
} from "./repository";

const IMAGE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function createDraftListing(
  request: Request,
  input: DraftListingMutationInput = {},
): Promise<ListingActionResult<SellerListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const categoryResult = input.categoryId
    ? await getRequiredCategory(input.categoryId, "Category could not be found.")
    : {
        data: null,
        ok: true as const,
      };

  if (!categoryResult.ok) {
    return categoryResult;
  }

  const now = new Date();
  const listingId = createMarketplaceId();
  const listing = await listingRepository.createDraftListing({
    auditEventId: createMarketplaceId(),
    categoryId: categoryResult.data?.id ?? null,
    conditionCode: input.conditionCode ?? null,
    createdAt: now,
    createdByApiKeyId: sellerContext.context.actorApiKeyId,
    createdByUserId: sellerContext.context.actorUserId,
    description: input.description ?? null,
    displayCurrencyCode: input.price?.currencyCode ?? "USD",
    id: listingId,
    quantityAvailable: input.quantityAvailable ?? null,
    sellerAccountId: sellerContext.context.sellerAccountId,
    title: input.title ?? null,
    unitPriceMinor: input.price?.amountMinor ?? null,
    updatedAt: now,
    updatedByApiKeyId: sellerContext.context.actorApiKeyId,
    updatedByUserId: sellerContext.context.actorUserId,
  });

  return {
    data: serializeSellerListing(listing, sellerContext.context.eligibilityStatus),
    ok: true,
  };
}

export async function getSellerListing(
  request: Request,
  listingId: string,
): Promise<ListingActionResult<SellerListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const listing = await listingRepository.findListingById(listingId);

  if (!listing) {
    return notFound("Draft listing could not be found.");
  }

  if (listing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot access that listing.");
  }

  return {
    data: serializeSellerListing(listing, sellerContext.context.eligibilityStatus),
    ok: true,
  };
}

export async function updateDraftListing(
  request: Request,
  listingId: string,
  input: DraftListingMutationInput,
): Promise<ListingActionResult<SellerListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const existingListing = await listingRepository.findListingById(listingId);

  if (!existingListing) {
    return notFound("Draft listing could not be found.");
  }

  if (existingListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot modify that draft listing.");
  }

  if (existingListing.status !== "draft") {
    return conflict("listing_not_draft", "Only draft listings can be updated.");
  }

  const targetCategory = input.categoryId
    ? await getRequiredCategory(input.categoryId, "Category could not be found.")
    : {
        data: existingListing.category,
        ok: true as const,
      };

  if (!targetCategory.ok) {
    return targetCategory;
  }

  const attributeBuild = buildAttributeMutation({
    attributes: input.attributes,
    currentListingAttributes: existingListing.attributes,
    targetCategory: targetCategory.data,
  });

  if (!attributeBuild.ok) {
    return attributeBuild;
  }

  const now = new Date();
  const updated = await listingRepository.updateDraftListing({
    attributes: attributeBuild.data.attributes,
    auditEventId: createMarketplaceId(),
    categoryId: targetCategory.data?.id ?? null,
    conditionCode: input.conditionCode ?? existingListing.conditionCode,
    description: input.description ?? existingListing.description,
    displayCurrencyCode: input.price?.currencyCode ?? existingListing.displayCurrencyCode,
    expectedUpdatedAt: existingListing.updatedAt,
    listingId,
    quantityAvailable: input.quantityAvailable ?? existingListing.quantityAvailable,
    removeCategoryAttributeIds: attributeBuild.data.removeCategoryAttributeIds,
    sellerAccountId: sellerContext.context.sellerAccountId,
    title: input.title ?? existingListing.title,
    unitPriceMinor: input.price?.amountMinor ?? existingListing.unitPriceMinor,
    updatedAt: now,
    updatedByApiKeyId: sellerContext.context.actorApiKeyId,
    updatedByUserId: sellerContext.context.actorUserId,
  });

  if (!updated) {
    const latestListing = await listingRepository.findListingById(listingId);

    if (!latestListing) {
      return notFound("Draft listing could not be found.");
    }

    if (latestListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
      return forbidden("Authenticated seller cannot modify that draft listing.");
    }

    if (latestListing.status !== "draft") {
      return conflict("listing_not_draft", "Only draft listings can be updated.");
    }

    return conflict(
      "listing_update_conflict",
      "Draft listing could not be updated because it changed during the request.",
    );
  }

  return {
    data: serializeSellerListing(updated, sellerContext.context.eligibilityStatus),
    ok: true,
  };
}

export async function publishListing(
  request: Request,
  listingId: string,
): Promise<PublishListingResult> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const listing = await listingRepository.findListingById(listingId);

  if (!listing) {
    return notFound("Draft listing could not be found.");
  }

  if (listing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot publish that draft listing.");
  }

  const validationIssues = getPublishValidationIssues(
    sellerContext.context.eligibilityStatus,
    listing,
  );

  if (validationIssues.length > 0) {
    return {
      ok: false,
      problem: createListingValidationProblem({
        errors: validationIssues,
        instance: new URL(request.url).pathname,
      }),
    };
  }

  const now = new Date();
  const published = await listingRepository.publishDraftListing({
    auditEventId: createMarketplaceId(),
    expectedUpdatedAt: listing.updatedAt,
    listingId,
    publishedAt: now,
    sellerAccountId: sellerContext.context.sellerAccountId,
    updatedAt: now,
    updatedByApiKeyId: sellerContext.context.actorApiKeyId,
    updatedByUserId: sellerContext.context.actorUserId,
  });

  if (!published) {
    const latestListing = await listingRepository.findListingById(listingId);

    if (!latestListing) {
      return notFound("Draft listing could not be found.");
    }

    if (latestListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
      return forbidden("Authenticated seller cannot publish that draft listing.");
    }

    if (latestListing.status !== "draft") {
      return conflict("listing_not_draft", "Only draft listings can be published.");
    }

    return conflict(
      "listing_publish_conflict",
      "Draft listing could not be published because it changed during the request.",
    );
  }

  return {
    data: serializeSellerListing(published, sellerContext.context.eligibilityStatus),
    ok: true,
  };
}

export async function listCategories(): Promise<PublicResult<CategorySummaryResource[]>> {
  const categories = await listingRepository.listActiveCategories();

  return {
    data: categories.map(serializeCategorySummary),
    ok: true,
  };
}

export async function getCategory(categorySlug: string): Promise<PublicResult<CategoryResource>> {
  const category = await listingRepository.findCategoryBySlug(categorySlug);

  if (!category) {
    return {
      code: "category_not_found",
      message: "Category could not be found.",
      ok: false,
      status: 404,
    };
  }

  return {
    data: serializeCategory(category),
    ok: true,
  };
}

export async function getPublicListing(
  listingId: string,
): Promise<PublicResult<PublicListingResource>> {
  const listing = await listingRepository.findListingById(listingId);

  if (!listing || listing.status !== "published") {
    return {
      code: "listing_not_found",
      message: "Published listing could not be found.",
      ok: false,
      status: 404,
    };
  }

  return {
    data: serializePublicListing(listing),
    ok: true,
  };
}

export async function createListingUploadSessions(
  request: Request,
  input: UploadSessionsInput,
): Promise<ListingActionResult<UploadSessionResource[]>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const listing = await listingRepository.findListingById(input.listingId);

  if (!listing) {
    return notFound("Draft listing could not be found.");
  }

  if (listing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot create upload sessions for that draft listing.");
  }

  if (listing.status !== "draft") {
    return conflict("listing_not_draft", "Only draft listings can accept media uploads.");
  }

  for (const file of input.files) {
    if (!IMAGE_CONTENT_TYPES.has(file.contentType)) {
      return invalidRequest("invalid_media_type", "Only image uploads are supported.");
    }
  }

  const uploadSessions = await Promise.all(
    input.files.map(async (file) => {
      const assetKey = buildDraftAssetKey({
        filename: file.filename,
        listingId: input.listingId,
        uploadId: createMarketplaceId(),
      });
      const upload = await createPresignedUploadRequest({
        assetKey,
        contentType: file.contentType,
      });

      return {
        assetKey,
        upload: {
          expiresAt: upload.expiresAt.toISOString(),
          headers: upload.headers,
          method: upload.method,
          url: upload.url,
        },
      };
    }),
  );

  return {
    data: uploadSessions,
    ok: true,
  };
}

export async function attachDraftListingMedia(
  request: Request,
  listingId: string,
  input: AttachListingMediaInput,
): Promise<ListingActionResult<SellerListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const existingListing = await listingRepository.findListingById(listingId);

  if (!existingListing) {
    return notFound("Draft listing could not be found.");
  }

  if (existingListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot modify that draft listing.");
  }

  if (existingListing.status !== "draft") {
    return conflict("listing_not_draft", "Only draft listings can accept media attachments.");
  }

  const expectedAssetPrefix = `listings/drafts/${listingId}/`;

  if (input.media.some((item) => !item.assetKey.startsWith(expectedAssetPrefix))) {
    return invalidRequest(
      "invalid_asset_key",
      "Attached media must belong to the target draft listing upload prefix.",
    );
  }

  const now = new Date();

  try {
    await Promise.all(input.media.map((item) => assertUploadedAssetExists(item.assetKey)));

    const listing = await listingRepository.attachMediaToDraftListing({
      auditEventId: createMarketplaceId(),
      listingId,
      media: input.media.map((item) => ({
        altText: item.altText,
        assetKey: item.assetKey,
        assetType: "image",
        createdAt: now,
        id: createMarketplaceId(),
        sortOrder: item.sortOrder,
      })),
      sellerAccountId: sellerContext.context.sellerAccountId,
      updatedAt: now,
      updatedByApiKeyId: sellerContext.context.actorApiKeyId,
      updatedByUserId: sellerContext.context.actorUserId,
    });

    if (!listing) {
      const latestListing = await listingRepository.findListingById(listingId);

      if (!latestListing) {
        return notFound("Draft listing could not be found.");
      }

      if (latestListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
        return forbidden("Authenticated seller cannot modify that draft listing.");
      }

      if (latestListing.status !== "draft") {
        return conflict("listing_not_draft", "Only draft listings can accept media attachments.");
      }

      return conflict(
        "listing_media_attach_conflict",
        "Draft listing media could not be attached because it changed during the request.",
      );
    }

    return {
      data: serializeSellerListing(listing, sellerContext.context.eligibilityStatus),
      ok: true,
    };
  } catch (error) {
    if (error instanceof MissingUploadedAssetError) {
      return conflict(
        "asset_not_uploaded",
        "Uploaded media must exist in storage before it can be attached.",
      );
    }

    if (error instanceof DuplicateListingMediaAssetKeyError) {
      return conflict(
        "duplicate_media_asset_key",
        "This asset is already attached to the draft listing.",
      );
    }

    throw error;
  }
}

export const uploadSessionsSchema = z.object({
  listing_id: z.string().min(1),
  files: z
    .array(
      z.object({
        content_type: z.string().min(1),
        filename: z.string().min(1),
        size_bytes: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const attachListingMediaSchema = z.object({
  media: z
    .array(
      z.object({
        alt_text: z.string().trim().min(1).nullable().optional(),
        asset_key: z.string().min(1),
        sort_order: z.number().int().nonnegative().optional(),
      }),
    )
    .min(1),
});

const draftListingFieldsSchema = z.object({
  category_id: z.string().trim().min(1).optional(),
  condition_code: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price: z
    .object({
      amount_minor: z.number().int().nonnegative(),
      currency_code: z.string().trim().length(3),
    })
    .optional(),
  quantity_available: z.number().int().nonnegative().optional(),
  title: z.string().trim().min(1).optional(),
});

export const createDraftListingSchema = draftListingFieldsSchema.strict();

export const updateDraftListingSchema = draftListingFieldsSchema
  .extend({
  attributes: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        value: z.union([
          z.string(),
          z.number().finite(),
          z.boolean(),
          z.array(z.unknown()),
          z.record(z.string(), z.unknown()),
          z.null(),
        ]),
      }),
    )
    .optional(),
  })
  .strict();

export function parseUploadSessionsInput(
  input: z.infer<typeof uploadSessionsSchema>,
): UploadSessionsInput {
  return {
    files: input.files.map((file) => ({
      contentType: file.content_type,
      filename: file.filename,
    })),
    listingId: input.listing_id,
  };
}

export function parseAttachListingMediaInput(
  input: z.infer<typeof attachListingMediaSchema>,
): AttachListingMediaInput {
  return {
    media: input.media.map((item, index) => ({
      altText: item.alt_text ?? null,
      assetKey: item.asset_key,
      sortOrder: item.sort_order ?? index,
    })),
  };
}

export function parseDraftListingMutationInput(
  input: z.infer<typeof createDraftListingSchema> | z.infer<typeof updateDraftListingSchema>,
): DraftListingMutationInput {
  return {
    attributes:
      "attributes" in input
        ? input.attributes?.map((attribute) => ({
            key: attribute.key,
            value: attribute.value,
          }))
        : undefined,
    categoryId: input.category_id,
    conditionCode: input.condition_code,
    description: input.description,
    price: input.price
      ? {
          amountMinor: input.price.amount_minor,
          currencyCode: input.price.currency_code.toUpperCase(),
        }
      : undefined,
    quantityAvailable: input.quantity_available,
    title: input.title,
  };
}

function serializeSellerListing(
  listing: ListingRecord,
  eligibilityStatus: SellerEligibilityStatus,
): SellerListingResource {
  return {
    attributes: listing.attributes.map(serializeListingAttribute),
    category: listing.category
      ? {
          id: listing.category.id,
          name: listing.category.name,
          slug: listing.category.slug,
        }
      : null,
    conditionCode: listing.conditionCode,
    createdAt: listing.createdAt.toISOString(),
    description: listing.description,
    id: listing.id,
    management: {
      draftValidation: getDraftListingValidation({
        eligibilityStatus,
        listing,
      }),
    },
    media: listing.media.map((item) => ({
      altText: item.altText,
      assetKey: item.assetKey,
      id: item.id,
      sortOrder: item.sortOrder,
      url: getPublicAssetUrl(item.assetKey),
    })),
    object: "listing",
    price:
      listing.unitPriceMinor == null
        ? null
        : {
            amountMinor: listing.unitPriceMinor,
            currencyCode: listing.displayCurrencyCode,
          },
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    quantityAvailable: listing.quantityAvailable,
    seller: listing.seller,
    status: listing.status,
    title: listing.title,
    updatedAt: listing.updatedAt.toISOString(),
  };
}

function serializePublicListing(listing: ListingRecord): PublicListingResource {
  return {
    attributes: listing.attributes.map(serializeListingAttribute),
    category: listing.category
      ? {
          id: listing.category.id,
          name: listing.category.name,
          slug: listing.category.slug,
        }
      : null,
    conditionCode: listing.conditionCode,
    description: listing.description,
    id: listing.id,
    media: listing.media.map((item) => ({
      altText: item.altText,
      id: item.id,
      sortOrder: item.sortOrder,
      url: getPublicAssetUrl(item.assetKey),
    })),
    object: "listing",
    price:
      listing.unitPriceMinor == null
        ? null
        : {
            amountMinor: listing.unitPriceMinor,
            currencyCode: listing.displayCurrencyCode,
          },
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    quantityAvailable: listing.quantityAvailable,
    seller: listing.seller,
    status: listing.status,
    title: listing.title,
    updatedAt: listing.updatedAt.toISOString(),
  };
}

function serializeCategorySummary(category: CategoryRecord): CategorySummaryResource {
  return {
    description: category.description,
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

function serializeCategory(category: CategoryRecord): CategoryResource {
  return {
    attributes: category.attributes.map((attribute) => ({
      allowedValues: attribute.allowedValues,
      isRequired: attribute.isRequired,
      key: attribute.key,
      label: attribute.label,
      valueType: attribute.valueType,
    })),
    description: category.description,
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

function serializeListingAttribute(
  attribute: ListingAttributeValueRecord,
): ListingAttributeResource {
  return {
    key: attribute.key,
    label: attribute.label,
    value: attribute.value,
    valueType: attribute.valueType,
  };
}

function getPublishValidationIssues(
  eligibilityStatus: SellerEligibilityStatus,
  listing: ListingRecord,
) {
  const issues = [...getDraftListingValidation({ eligibilityStatus, listing }).issues];

  if (listing.status !== "draft") {
    issues.unshift({
      code: "invalid_state",
      field: "status",
      message: "Only draft listings can be published.",
    });
  }

  return issues;
}

function buildAttributeMutation({
  attributes,
  currentListingAttributes,
  targetCategory,
}: BuildAttributeMutationInput): BuildAttributeMutationResult {
  if (!targetCategory) {
    if (attributes && attributes.length > 0) {
      return invalidRequest(
        "invalid_request",
        "A category must be set before listing attributes can be updated.",
      );
    }

    return {
      data: {
        attributes: [],
        removeCategoryAttributeIds: [],
      },
      ok: true,
    };
  }

  const categoryAttributesByKey = new Map(
    targetCategory.attributes.map((attribute) => [attribute.key, attribute]),
  );
  const nextAttributes = new Map<
    string,
    UpdateStoredAttributeInput
  >();
  const explicitRemoveCategoryAttributeIds: string[] = [];

  for (const existing of currentListingAttributes) {
    const categoryAttribute = categoryAttributesByKey.get(existing.key);

    if (!categoryAttribute) {
      continue;
    }

    const stored = buildStoredAttributeFromValue(categoryAttribute, existing.value);

    if (!stored.ok) {
      return stored;
    }

    nextAttributes.set(existing.key, stored.data);
  }

  for (const attribute of attributes ?? []) {
    const categoryAttribute = categoryAttributesByKey.get(attribute.key);

    if (!categoryAttribute) {
      return invalidRequest(
        "invalid_request",
        `Attribute "${attribute.key}" is not valid for the selected category.`,
      );
    }

    if (attribute.value === null) {
      nextAttributes.delete(attribute.key);
      explicitRemoveCategoryAttributeIds.push(categoryAttribute.id);
      continue;
    }

    const stored = buildStoredAttributeFromValue(categoryAttribute, attribute.value);

    if (!stored.ok) {
      return stored;
    }

    nextAttributes.set(attribute.key, stored.data);
  }

  const targetCategoryAttributeIds = new Set(
    targetCategory.attributes.map((attribute) => attribute.id),
  );
  const removeCategoryAttributeIds = currentListingAttributes
    .filter((attribute) => !targetCategoryAttributeIds.has(attribute.categoryAttributeId))
    .map((attribute) => attribute.categoryAttributeId);

  return {
    data: {
      attributes: [...nextAttributes.values()],
      removeCategoryAttributeIds: dedupeStrings([
        ...removeCategoryAttributeIds,
        ...explicitRemoveCategoryAttributeIds,
      ]),
    },
    ok: true,
  };
}

function buildStoredAttributeFromValue(
  categoryAttribute: CategoryAttributeRecord,
  value: DraftListingAttributeMutation["value"],
): ListingActionResult<UpdateStoredAttributeInput> {
  const common = {
    categoryAttributeId: categoryAttribute.id,
    id: createMarketplaceId(),
    key: categoryAttribute.key,
    label: categoryAttribute.label,
  };

  switch (categoryAttribute.valueType) {
    case "text":
      if (typeof value !== "string") {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be provided as text.`,
        );
      }

      return {
        data: {
          ...common,
          normalizedText: normalizeTextValue(value),
          valueBoolean: null,
          valueJson: null,
          valueNumber: null,
          valueText: value,
        },
        ok: true,
      };

    case "enum":
      if (typeof value !== "string") {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be provided as text.`,
        );
      }

      if (
        categoryAttribute.allowedValues &&
        !categoryAttribute.allowedValues.includes(value)
      ) {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be one of: ${categoryAttribute.allowedValues.join(", ")}.`,
        );
      }

      return {
        data: {
          ...common,
          normalizedText: normalizeTextValue(value),
          valueBoolean: null,
          valueJson: null,
          valueNumber: null,
          valueText: value,
        },
        ok: true,
      };

    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be provided as a number.`,
        );
      }

      return {
        data: {
          ...common,
          normalizedText: null,
          valueBoolean: null,
          valueJson: null,
          valueNumber: value,
          valueText: null,
        },
        ok: true,
      };

    case "boolean":
      if (typeof value !== "boolean") {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be provided as a boolean.`,
        );
      }

      return {
        data: {
          ...common,
          normalizedText: null,
          valueBoolean: value,
          valueJson: null,
          valueNumber: null,
          valueText: null,
        },
        ok: true,
      };

    case "json":
      if (
        typeof value !== "object" ||
        value === null ||
        (!Array.isArray(value) && !isPlainObject(value))
      ) {
        return invalidRequest(
          "invalid_request",
          `${categoryAttribute.label} must be provided as structured JSON.`,
        );
      }

      return {
        data: {
          ...common,
          normalizedText: null,
          valueBoolean: null,
          valueJson: value as Prisma.InputJsonValue,
          valueNumber: null,
          valueText: null,
        },
        ok: true,
      };
  }
}

async function getRequiredCategory(categoryId: string, message: string) {
  const category = await listingRepository.findCategoryById(categoryId);

  if (!category) {
    return invalidRequest("invalid_category", message);
  }

  return {
    data: category,
    ok: true as const,
  };
}

function normalizeTextValue(value: string) {
  return value.trim().toLowerCase();
}

function dedupeStrings(values: string[]) {
  return [...new Set(values)];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidRequest(code: string, message: string): ListingActionError {
  return {
    code,
    message,
    ok: false,
    status: 400,
  };
}

function forbidden(message: string): ListingActionError {
  return {
    code: "forbidden",
    message,
    ok: false,
    status: 403,
  };
}

function notFound(message: string): ListingActionError {
  return {
    code: "listing_not_found",
    message,
    ok: false,
    status: 404,
  };
}

function conflict(code: string, message: string): ListingActionError {
  return {
    code,
    message,
    ok: false,
    status: 409,
  };
}

type UploadSessionsInput = {
  files: Array<{
    contentType: string;
    filename: string;
  }>;
  listingId: string;
};

type AttachListingMediaInput = {
  media: Array<{
    altText: string | null;
    assetKey: string;
    sortOrder: number;
  }>;
};

type DraftListingMutationInput = {
  attributes?: DraftListingAttributeMutation[];
  categoryId?: string;
  conditionCode?: string;
  description?: string;
  price?: {
    amountMinor: number;
    currencyCode: string;
  };
  quantityAvailable?: number;
  title?: string;
};

type DraftListingAttributeMutation = {
  key: string;
  value: boolean | number | string | Record<string, unknown> | unknown[] | null;
};

type UpdateStoredAttributeInput = {
  categoryAttributeId: string;
  id: string;
  key: string;
  label: string;
  normalizedText: string | null;
  valueBoolean: boolean | null;
  valueJson: Prisma.InputJsonValue | null;
  valueNumber: number | null;
  valueText: string | null;
};

type BuildAttributeMutationInput = {
  attributes: DraftListingAttributeMutation[] | undefined;
  currentListingAttributes: ListingAttributeValueRecord[];
  targetCategory: CategoryRecord | null;
};

type BuildAttributeMutationResult =
  | {
      data: {
        attributes: UpdateStoredAttributeInput[];
        removeCategoryAttributeIds: string[];
      };
      ok: true;
    }
  | ListingActionError;

type ListingAttributeResource = {
  key: string;
  label: string;
  value: boolean | number | string | Record<string, unknown> | unknown[];
  valueType: "boolean" | "enum" | "json" | "number" | "text";
};

type BaseListingResource = {
  attributes: ListingAttributeResource[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  conditionCode: string | null;
  description: string | null;
  id: string;
  object: "listing";
  price: {
    amountMinor: number;
    currencyCode: string;
  } | null;
  publishedAt: string | null;
  quantityAvailable: number | null;
  seller: {
    displayName: string;
    id: string;
    slug: string;
  };
  status: string;
  title: string | null;
  updatedAt: string;
};

export type SellerListingResource = BaseListingResource & {
  createdAt: string;
  management: {
    draftValidation: {
      issues: DraftListingValidationIssue[];
      publishable: boolean;
    };
  };
  media: Array<{
    altText: string | null;
    assetKey: string;
    id: string;
    sortOrder: number;
    url: string;
  }>;
};

export type PublicListingResource = BaseListingResource & {
  media: Array<{
    altText: string | null;
    id: string;
    sortOrder: number;
    url: string;
  }>;
};

export type UploadSessionResource = {
  assetKey: string;
  upload: {
    expiresAt: string;
    headers: Record<string, string>;
    method: "PUT";
    url: string;
  };
};

export type CategorySummaryResource = {
  description: string | null;
  id: string;
  name: string;
  slug: string;
};

export type CategoryResource = CategorySummaryResource & {
  attributes: Array<{
    allowedValues: string[] | null;
    isRequired: boolean;
    key: string;
    label: string;
    valueType: "boolean" | "enum" | "json" | "number" | "text";
  }>;
};

type SellerEligibilityStatus = "eligible" | "pending" | "revoked" | "suspended";

type ListingActionResult<T> =
  | {
      data: T;
      ok: true;
    }
  | ListingActionError;

type PublishListingResult =
  | {
      data: SellerListingResource;
      ok: true;
    }
  | ListingActionError
  | {
      ok: false;
      problem: ListingValidationProblem;
    };

type PublicResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      code: string;
      message: string;
      ok: false;
      status: 404;
    };

type ListingActionError = {
  code: string;
  message: string;
  ok: false;
  retryAfterMs?: number;
  status: 400 | 401 | 403 | 404 | 409 | 429;
};
