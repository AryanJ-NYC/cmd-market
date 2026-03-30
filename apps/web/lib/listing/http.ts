import "zod-openapi";
import { z } from "zod";
import type { DraftListingResource, UploadSessionResource } from "./service";

export const draftListingMediaItemSchema = z
  .object({
    alt_text: z.string().nullable(),
    asset_key: z.string(),
    id: z.string(),
    sort_order: z.number().int().nonnegative(),
    url: z.url()
  })
  .meta({
    description: "Attached media for a draft listing.",
    id: "DraftListingMediaItem"
  });

export const draftListingResponseSchema = z
  .object({
    data: z.object({
      id: z.string(),
      media: z.array(draftListingMediaItemSchema),
      object: z.literal("listing"),
      status: z.string()
    })
  })
  .meta({
    description: "Draft listing response envelope.",
    id: "DraftListingResponse"
  });

export const uploadSessionSchema = z
  .object({
    asset_key: z.string(),
    upload: z.object({
      expires_at: z.string(),
      headers: z.record(z.string(), z.string()),
      method: z.literal("PUT"),
      url: z.url()
    })
  })
  .meta({
    description: "Direct-upload instructions for one draft media object.",
    id: "UploadSession"
  });

export const uploadSessionsResponseSchema = z
  .object({
    data: z.array(uploadSessionSchema)
  })
  .meta({
    description: "Upload session response envelope.",
    id: "UploadSessionsResponse"
  });

export function serializeDraftListingResponse(listing: DraftListingResource) {
  return draftListingResponseSchema.parse({
    data: {
      id: listing.id,
      media: listing.media.map((item) => ({
        alt_text: item.altText,
        asset_key: item.assetKey,
        id: item.id,
        sort_order: item.sortOrder,
        url: item.url
      })),
      object: listing.object,
      status: listing.status
    }
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
        url: item.upload.url
      }
    }))
  });
}
