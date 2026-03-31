import { NextResponse } from "next/server";
import { createOpenClawAuthorizationSession } from "../../../../lib/seller/service";

export async function POST(request: Request) {
  const result = await createOpenClawAuthorizationSession(request);

  return NextResponse.json({
    data: {
      browser_url: result.data.browserUrl,
      exchange_code: result.data.exchangeCode,
      expires_at: result.data.expiresAt,
      session_id: result.data.sessionId
    }
  });
}
