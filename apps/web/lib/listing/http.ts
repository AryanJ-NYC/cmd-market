import type { DraftListingResource, UploadSessionResource } from "./service";

export function serializeDraftListingResponse(listing: DraftListingResource) {
  return {
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
        url: item.upload.url
      }
    }))
  };
}
