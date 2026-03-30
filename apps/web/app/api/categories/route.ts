import { NextResponse } from "next/server";
import { createSellerApiErrorResponse } from "../../../lib/seller/api";
import { serializeCategorySummariesResponse } from "../../../lib/listing/http";
import { listCategories } from "../../../lib/listing/service";

export async function GET() {
  const result = await listCategories();

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeCategorySummariesResponse(result.data));
}
