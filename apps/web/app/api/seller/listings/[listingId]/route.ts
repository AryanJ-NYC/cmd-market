import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseOptionalSellerApiRequestBody
} from "../../../../../lib/seller/api";
import { serializeSellerListingResponse } from "../../../../../lib/listing/http";
import {
  draftListingMutationSchema,
  getSellerListing,
  parseDraftListingMutationInput,
  updateDraftListing
} from "../../../../../lib/listing/service";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      listingId: string;
    }>;
  }
) {
  const { listingId } = await context.params;
  const result = await getSellerListing(request, listingId);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeSellerListingResponse(result.data));
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      listingId: string;
    }>;
  }
) {
  const parsedBody = await parseOptionalSellerApiRequestBody(
    request,
    draftListingMutationSchema,
    "Draft listing update body is invalid.",
    {}
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { listingId } = await context.params;
  const result = await updateDraftListing(
    request,
    listingId,
    parseDraftListingMutationInput(parsedBody.data)
  );

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeSellerListingResponse(result.data));
}
