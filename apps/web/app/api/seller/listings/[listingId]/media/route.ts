import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../../../lib/seller/api";
import { serializeSellerListingResponse } from "../../../../../../lib/listing/http";
import {
  attachDraftListingMedia,
  attachListingMediaSchema,
  parseAttachListingMediaInput
} from "../../../../../../lib/listing/service";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      listingId: string;
    }>;
  }
) {
  const parsedBody = await parseSellerApiRequestBody(
    request,
    attachListingMediaSchema,
    "Listing media attachment body is invalid."
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { listingId } = await context.params;
  const result = await attachDraftListingMedia(
    request,
    listingId,
    parseAttachListingMediaInput(parsedBody.data)
  );

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeSellerListingResponse(result.data));
}
