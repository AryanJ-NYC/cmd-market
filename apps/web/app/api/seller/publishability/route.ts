import { NextResponse } from "next/server";
import { resolveSellerPublishability } from "../../../../lib/seller/service";

export async function GET(request: Request) {
  const result = await resolveSellerPublishability(request);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message
        }
      },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      data: {
        issues: result.publishability.issues,
        publishable: result.publishability.publishable,
        sellerContext: result.context
      }
    },
    { status: result.publishability.publishable ? 200 : 403 }
  );
}
