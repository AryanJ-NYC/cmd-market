import { NextResponse } from "next/server";
import { parseOptionalSellerApiRequestBody } from "../../../../lib/seller/api";
import { openClawAuthorizationSessionCreateRequestSchema } from "../../../../lib/seller/http";
import { requireOpenClawClientAuthorization } from "../../../../lib/seller/openclaw-client-auth";
import { createOpenClawAuthorizationSession } from "../../../../lib/seller/service";

export async function POST(request: Request) {
  const unauthorizedResponse = requireOpenClawClientAuthorization(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const parsed = await parseOptionalSellerApiRequestBody(
    request,
    openClawAuthorizationSessionCreateRequestSchema,
    "Request body must include a valid optional proposed_workspace payload.",
    {}
  );

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await createOpenClawAuthorizationSession(request, parsed.data.proposed_workspace);

  return NextResponse.json({
    data: {
      browser_url: result.data.browserUrl,
      exchange_code: result.data.exchangeCode,
      expires_at: result.data.expiresAt,
      session_id: result.data.sessionId
    }
  });
}
