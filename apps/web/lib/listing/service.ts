import { z } from "zod";
import { createMarketplaceId } from "../db/ids";
import { resolveSellerRequestContext } from "../seller/service";
import {
  buildDraftAssetKey,
  createPresignedUploadRequest,
  getPublicAssetUrl
} from "../storage/spaces";
import {
  DuplicateListingMediaAssetKeyError,
  type ListingRecord,
  listingRepository
} from "./repository";

const IMAGE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export async function createDraftListing(request: Request): Promise<ListingActionResult<DraftListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const now = new Date();
  const listingId = createMarketplaceId();
  const listing = await listingRepository.createDraftListing({
    auditEventId: createMarketplaceId(),
    createdAt: now,
    createdByApiKeyId: sellerContext.context.actorApiKeyId,
    createdByUserId: sellerContext.context.actorUserId,
    id: listingId,
    sellerAccountId: sellerContext.context.sellerAccountId,
    updatedAt: now,
    updatedByApiKeyId: sellerContext.context.actorApiKeyId,
    updatedByUserId: sellerContext.context.actorUserId
  });

  return {
    data: serializeDraftListing(listing),
    ok: true
  };
}

export async function createListingUploadSessions(
  request: Request,
  input: UploadSessionsInput
): Promise<ListingActionResult<UploadSessionResource[]>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const listing = await listingRepository.findListingById(input.listingId);

  if (!listing) {
    return {
      code: "listing_not_found",
      message: "Draft listing could not be found.",
      ok: false,
      status: 404
    };
  }

  if (listing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return {
      code: "forbidden",
      message: "Authenticated seller cannot create upload sessions for that draft listing.",
      ok: false,
      status: 403
    };
  }

  if (listing.status !== "draft") {
    return {
      code: "listing_not_draft",
      message: "Only draft listings can accept media uploads.",
      ok: false,
      status: 409
    };
  }

  for (const file of input.files) {
    if (!IMAGE_CONTENT_TYPES.has(file.contentType)) {
      return {
        code: "invalid_media_type",
        message: "Only image uploads are supported.",
        ok: false,
        status: 400
      };
    }
  }

  const uploadSessions = await Promise.all(
    input.files.map(async (file) => {
      const assetKey = buildDraftAssetKey({
        filename: file.filename,
        listingId: input.listingId,
        uploadId: createMarketplaceId()
      });
      const upload = await createPresignedUploadRequest({
        assetKey,
        contentType: file.contentType
      });

      return {
        assetKey,
        upload: {
          expiresAt: upload.expiresAt.toISOString(),
          headers: upload.headers,
          method: upload.method,
          url: upload.url
        }
      };
    })
  );

  return {
    data: uploadSessions,
    ok: true
  };
}

export async function attachDraftListingMedia(
  request: Request,
  listingId: string,
  input: AttachListingMediaInput
): Promise<ListingActionResult<DraftListingResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const existingListing = await listingRepository.findListingById(listingId);

  if (!existingListing) {
    return {
      code: "listing_not_found",
      message: "Draft listing could not be found.",
      ok: false,
      status: 404
    };
  }

  if (existingListing.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return {
      code: "forbidden",
      message: "Authenticated seller cannot modify that draft listing.",
      ok: false,
      status: 403
    };
  }

  if (existingListing.status !== "draft") {
    return {
      code: "listing_not_draft",
      message: "Only draft listings can accept media attachments.",
      ok: false,
      status: 409
    };
  }

  const expectedAssetPrefix = `listings/drafts/${listingId}/`;

  if (input.media.some((item) => !item.assetKey.startsWith(expectedAssetPrefix))) {
    return {
      code: "invalid_asset_key",
      message: "Attached media must belong to the target draft listing upload prefix.",
      ok: false,
      status: 400
    };
  }

  const now = new Date();

  try {
    const listing = await listingRepository.attachMediaToDraftListing({
      auditEventId: createMarketplaceId(),
      listingId,
      media: input.media.map((item) => ({
        altText: item.altText,
        assetKey: item.assetKey,
        assetType: "image",
        createdAt: now,
        id: createMarketplaceId(),
        sortOrder: item.sortOrder
      })),
      sellerAccountId: sellerContext.context.sellerAccountId,
      updatedAt: now,
      updatedByApiKeyId: sellerContext.context.actorApiKeyId,
      updatedByUserId: sellerContext.context.actorUserId
    });

    return {
      data: serializeDraftListing(listing),
      ok: true
    };
  } catch (error) {
    if (error instanceof DuplicateListingMediaAssetKeyError) {
      return {
        code: "duplicate_media_asset_key",
        message: "This asset is already attached to the draft listing.",
        ok: false,
        status: 409
      };
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
        size_bytes: z.number().int().positive()
      })
    )
    .min(1)
});

export const attachListingMediaSchema = z.object({
  media: z
    .array(
      z.object({
        alt_text: z.string().trim().min(1).nullable().optional(),
        asset_key: z.string().min(1),
        sort_order: z.number().int().nonnegative()
      })
    )
    .min(1)
});

export function parseUploadSessionsInput(input: z.infer<typeof uploadSessionsSchema>): UploadSessionsInput {
  return {
    listingId: input.listing_id,
    files: input.files.map((file) => ({
      contentType: file.content_type,
      filename: file.filename,
      sizeBytes: file.size_bytes
    }))
  };
}

export function parseAttachListingMediaInput(
  input: z.infer<typeof attachListingMediaSchema>
): AttachListingMediaInput {
  return {
    media: input.media.map((item) => ({
      altText: item.alt_text ?? null,
      assetKey: item.asset_key,
      sortOrder: item.sort_order
    }))
  };
}

function serializeDraftListing(listing: ListingRecord): DraftListingResource {
  return {
    id: listing.id,
    media: listing.media.map((item) => ({
      altText: item.altText,
      assetKey: item.assetKey,
      id: item.id,
      sortOrder: item.sortOrder,
      url: getPublicAssetUrl(item.assetKey)
    })),
    object: "listing",
    status: listing.status
  };
}

type UploadSessionsInput = {
  listingId: string;
  files: Array<{
    contentType: string;
    filename: string;
    sizeBytes: number;
  }>;
};

type AttachListingMediaInput = {
  media: Array<{
    altText: string | null;
    assetKey: string;
    sortOrder: number;
  }>;
};

export type DraftListingResource = {
  id: string;
  media: Array<{
    altText: string | null;
    assetKey: string;
    id: string;
    sortOrder: number;
    url: string;
  }>;
  object: "listing";
  status: string;
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

type ListingActionResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      code: string;
      message: string;
      ok: false;
      retryAfterMs?: number;
      status: 400 | 401 | 403 | 404 | 409 | 429;
    };
