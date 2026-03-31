import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSellerApiErrorResponse,
  parseSellerApiRequestBody
} from "../../../../../../lib/seller/api";
import { SellerDomainError } from "../../../../../../lib/seller/domain";
import { requireOpenClawClientAuthorization } from "../../../../../../lib/seller/openclaw-client-auth";
import { getOpenClawAuthorizationSessionStatus } from "../../../../../../lib/seller/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const unauthorizedResponse = requireOpenClawClientAuthorization(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

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
    const result = await getOpenClawAuthorizationSessionStatus({
      exchangeCode: parsed.data.exchange_code,
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
