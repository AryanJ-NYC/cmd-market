import { NextResponse } from "next/server";
import { getPublishedListingMedia } from "../../../../../lib/listing/service";
import { createSellerApiErrorResponse } from "../../../../../lib/seller/api";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      listingId: string;
      mediaId: string;
    }>;
  },
) {
  const { listingId, mediaId } = await context.params;
  const result = await getPublishedListingMedia(listingId, mediaId);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.redirect(result.data.assetUrl, {
    status: 307,
  });
}
