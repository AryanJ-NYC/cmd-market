import { NextResponse } from "next/server";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../../../lib/seller/api";
import { SellerDomainError } from "../../../../../../lib/seller/domain";
import { openClawAuthorizationSessionVerifierRequestSchema } from "../../../../../../lib/seller/http";
import { redeemOpenClawAuthorizationSession } from "../../../../../../lib/seller/service";

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
    const result = await redeemOpenClawAuthorizationSession({
      codeVerifier: parsed.data.code_verifier,
      sessionId: resolvedParams.sessionId
    });

    return NextResponse.json({
      data: {
        api_key: result.data.apiKey,
        seller_context: {
          eligibility_source: result.data.sellerContext.eligibilitySource,
          eligibility_status: result.data.sellerContext.eligibilityStatus,
          organization_id: result.data.sellerContext.organizationId,
          seller_account_id: result.data.sellerContext.sellerAccountId
        },
        session_id: result.data.sessionId
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
