import { NextResponse } from "next/server";
import { resolveSellerRequestContext } from "../../../../lib/seller/service";

export async function GET(request: Request) {
  const context = await resolveSellerRequestContext(request);

  if (!context.ok) {
    return NextResponse.json(
      {
        error: {
          code: context.code,
          message: context.message,
          retryAfterMs: context.retryAfterMs ?? null
        }
      },
      {
        headers:
          typeof context.retryAfterMs === "number"
            ? {
                "Retry-After": String(Math.ceil(context.retryAfterMs / 1000))
              }
            : undefined,
        status: context.status
      }
    );
  }

  return NextResponse.json({
    data: context.context
  });
}
