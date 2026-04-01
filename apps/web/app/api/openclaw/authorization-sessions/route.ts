import { NextResponse } from "next/server";
import { parseSellerApiRequestBody } from "../../../../lib/seller/api";
import { openClawAuthorizationSessionCreateRequestSchema } from "../../../../lib/seller/http";
import { createOpenClawAuthorizationSession } from "../../../../lib/seller/service";

export async function POST(request: Request) {
  const parsed = await parseSellerApiRequestBody(
    request,
    openClawAuthorizationSessionCreateRequestSchema,
    "Request body must include a valid PKCE code_challenge payload and optional proposed_workspace details."
  );

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await createOpenClawAuthorizationSession(request, {
    codeChallenge: parsed.data.code_challenge,
    codeChallengeMethod: parsed.data.code_challenge_method,
    proposedWorkspace: parsed.data.proposed_workspace
  });

  return NextResponse.json({
    data: {
      browser_url: result.data.browserUrl,
      expires_at: result.data.expiresAt,
      session_id: result.data.sessionId
    }
  });
}
