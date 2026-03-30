import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../lib/seller/api";
import { serializePublicListingResponse } from "../../../../lib/listing/http";
import { getPublicListing } from "../../../../lib/listing/service";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      listingId: string;
    }>;
  }
) {
  const { listingId } = await context.params;
  const result = await getPublicListing(listingId);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializePublicListingResponse(result.data));
}
