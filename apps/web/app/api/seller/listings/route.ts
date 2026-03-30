import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseOptionalSellerApiRequestBody
} from "../../../../lib/seller/api";
import { serializeSellerListingResponse } from "../../../../lib/listing/http";
import {
  createDraftListing,
  draftListingMutationSchema,
  parseDraftListingMutationInput
} from "../../../../lib/listing/service";

export async function POST(request: Request) {
  const parsedBody = await parseOptionalSellerApiRequestBody(
    request,
    draftListingMutationSchema,
    "Draft listing request body is invalid.",
    {}
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createDraftListing(request, parseDraftListingMutationInput(parsedBody.data));

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeSellerListingResponse(result.data));
}
