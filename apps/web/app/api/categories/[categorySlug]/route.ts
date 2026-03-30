import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../../lib/seller/api";
import { serializeCategoryResponse } from "../../../../lib/listing/http";
import { getCategory } from "../../../../lib/listing/service";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      categorySlug: string;
    }>;
  }
) {
  const { categorySlug } = await context.params;
  const result = await getCategory(categorySlug);

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeCategoryResponse(result.data));
}
