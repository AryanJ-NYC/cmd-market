import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../../../lib/seller/api";
import { serializeSellerListingResponse } from "../../../../../../lib/listing/http";
import { publishListing } from "../../../../../../lib/listing/service";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      listingId: string;
    }>;
  }
) {
  const { listingId } = await context.params;
  const result = await publishListing(request, listingId);

  if (!result.ok) {
    if ("problem" in result) {
      return NextResponse.json(result.problem, {
        status: result.problem.status
      });
    }

    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeSellerListingResponse(result.data));
}
