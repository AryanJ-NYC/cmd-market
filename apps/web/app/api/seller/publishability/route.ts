import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../lib/seller/api";
import { resolveSellerPublishability } from "../../../../lib/seller/service";
import { serializeSellerPublishabilityResponse } from "../../../../lib/seller/http";

export async function GET(request: Request) {
  const result = await resolveSellerPublishability(request);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(
    serializeSellerPublishabilityResponse({
      issues: result.publishability.issues,
      publishable: result.publishability.publishable,
      sellerContext: result.context
    }),
    { status: result.publishability.publishable ? 200 : 403 }
  );
}
