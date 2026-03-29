import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../lib/seller/api";
import { serializeUploadSessionsResponse } from "../../../../lib/listing/http";
import {
  createListingUploadSessions,
  parseUploadSessionsInput,
  uploadSessionsSchema
} from "../../../../lib/listing/service";

export async function POST(request: Request) {
  const parsedBody = await parseSellerApiRequestBody(
    request,
    uploadSessionsSchema,
    "Upload session request body is invalid."
  );

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = await createListingUploadSessions(request, parseUploadSessionsInput(parsedBody.data));

  if (!result.ok) {
    return createSellerApiErrorResponse(result);
  }

  return NextResponse.json(serializeUploadSessionsResponse(result.data));
}
