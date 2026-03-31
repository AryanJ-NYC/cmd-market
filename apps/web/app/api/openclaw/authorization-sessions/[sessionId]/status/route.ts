import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../../../lib/seller/api";
import { SellerDomainError } from "../../../../../../lib/seller/domain";
import { openClawAuthorizationSessionVerifierRequestSchema } from "../../../../../../lib/seller/http";
import { getOpenClawAuthorizationSessionStatus } from "../../../../../../lib/seller/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const parsed = await parseSellerApiRequestBody(
    request,
    openClawAuthorizationSessionVerifierRequestSchema,
    "Request body must include a valid code_verifier."
  );

  if (!parsed.ok) {
    return parsed.response;
  }

  const resolvedParams = await params;

  try {
    const result = await getOpenClawAuthorizationSessionStatus({
      codeVerifier: parsed.data.code_verifier,
      sessionId: resolvedParams.sessionId
    });

    return NextResponse.json({
      data: {
        expires_at: result.data.expiresAt,
        session_id: result.data.sessionId,
        status: result.data.status
      }
    });
  } catch (caughtError) {
    if (caughtError instanceof SellerDomainError) {
      return createSellerApiErrorResponse({
        code: caughtError.code,
        message: caughtError.message,
        status: caughtError.status
      });
    }

    throw caughtError;
  }
}
