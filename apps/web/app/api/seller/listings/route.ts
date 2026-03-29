import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../lib/seller/api";
import { serializeDraftListingResponse } from "../../../../lib/listing/http";
import { createDraftListing } from "../../../../lib/listing/service";

export async function POST(request: Request) {
  const result = await createDraftListing(request);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeDraftListingResponse(result.data));
}
