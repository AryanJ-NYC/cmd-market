import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../../../lib/seller/api";
import { SellerDomainError } from "../../../../../../lib/seller/domain";
import { redeemOpenClawAuthorizationSession } from "../../../../../../lib/seller/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const parsed = await parseSellerApiRequestBody(
    request,
    z.object({
      exchange_code: z.string().trim().min(1)
    }),
    "Request body must include a valid exchange_code."
  );

  if (!parsed.ok) {
    return parsed.response;
  }

  const resolvedParams = await params;

  try {
    const result = await redeemOpenClawAuthorizationSession({
      exchangeCode: parsed.data.exchange_code,
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
