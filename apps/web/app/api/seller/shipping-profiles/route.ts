import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody,
} from "../../../../lib/seller/api";
import {
  serializeShippingProfileListResponse,
  serializeShippingProfileResponse,
} from "../../../../lib/shipping-profile/http";
import {
  createShippingProfile,
  createShippingProfileSchema,
  listShippingProfiles,
  parseCreateShippingProfileInput,
} from "../../../../lib/shipping-profile/service";

export async function GET(request: Request) {
  const result = await listShippingProfiles(request);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeShippingProfileListResponse(result.data));
}

export async function POST(request: Request) {
  const parsedBody = await parseSellerApiRequestBody(
    request,
    createShippingProfileSchema,
    "Shipping profile request body is invalid.",
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createShippingProfile(request, parseCreateShippingProfileInput(parsedBody.data));

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeShippingProfileResponse(result.data));
}
