import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseOptionalSellerApiRequestBody,
} from "../../../../../lib/seller/api";
import { serializeShippingProfileResponse } from "../../../../../lib/shipping-profile/http";
import {
  getShippingProfile,
  parseUpdateShippingProfileInput,
  updateShippingProfile,
  updateShippingProfileSchema,
} from "../../../../../lib/shipping-profile/service";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      shippingProfileId: string;
    }>;
  },
) {
  const { shippingProfileId } = await context.params;
  const result = await getShippingProfile(request, shippingProfileId);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeShippingProfileResponse(result.data));
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      shippingProfileId: string;
    }>;
  },
) {
  const parsedBody = await parseOptionalSellerApiRequestBody(
    request,
    updateShippingProfileSchema,
    "Shipping profile update body is invalid.",
    {},
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { shippingProfileId } = await context.params;
  const result = await updateShippingProfile(
    request,
    shippingProfileId,
    parseUpdateShippingProfileInput(parsedBody.data),
  );

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeShippingProfileResponse(result.data));
}
