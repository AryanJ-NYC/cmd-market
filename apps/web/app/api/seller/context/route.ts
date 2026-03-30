import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../lib/seller/api";
import { resolveSellerRequestContext } from "../../../../lib/seller/service";
import { serializeSellerContextResponse } from "../../../../lib/seller/http";

export async function GET(request: Request) {
  const context = await resolveSellerRequestContext(request);

  if (!context.ok) {
    return createSellerApiErrorResponse(context);
  }

  return NextResponse.json(serializeSellerContextResponse(context.context));
}
