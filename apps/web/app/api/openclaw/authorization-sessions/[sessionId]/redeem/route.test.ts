import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SellerDomainError } from "../../../../../../lib/seller/domain";

const { redeemOpenClawAuthorizationSession } = vi.hoisted(() => ({
  redeemOpenClawAuthorizationSession: vi.fn()
}));

vi.mock("../../../../../../lib/seller/service", () => ({
  redeemOpenClawAuthorizationSession
}));

describe("POST /api/openclaw/authorization-sessions/[sessionId]/redeem", () => {
  beforeEach(() => {
    redeemOpenClawAuthorizationSession.mockReset();
  });

  it("returns the redeemed seller-scoped API key and seller context", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    redeemOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        apiKey: "cmdmkt_secret",
        sellerContext: {
          eligibilitySource: null,
          eligibilityStatus: "eligible",
          organizationId: "org_123",
          sellerAccountId: "seller_123"
        },
        sessionId: "auth_123"
      },
      ok: true
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/redeem", {
        body: JSON.stringify({
          exchange_code: "exchange_secret"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      {
        params: Promise.resolve({
          sessionId: "auth_123"
        })
      }
    );

    expect(redeemOpenClawAuthorizationSession).toHaveBeenCalledWith({
      exchangeCode: "exchange_secret",
      sessionId: "auth_123"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        api_key: "cmdmkt_secret",
        seller_context: {
          eligibility_source: null,
          eligibility_status: "eligible",
          organization_id: "org_123",
          seller_account_id: "seller_123"
        },
        session_id: "auth_123"
      }
    });
  });

  it("returns a structured pending error when the session is not ready to redeem", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    redeemOpenClawAuthorizationSession.mockRejectedValue(
      new SellerDomainError(409, "authorization_pending", "OpenClaw authorization is not ready to redeem yet.")
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/redeem", {
        body: JSON.stringify({
          exchange_code: "exchange_secret"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      {
        params: Promise.resolve({
          sessionId: "auth_123"
        })
      }
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "authorization_pending",
        message: "OpenClaw authorization is not ready to redeem yet.",
        retryAfterMs: null
      }
    });
  });

  it("returns invalid_request when the redeem request body is malformed json", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/redeem", {
        body: "{not-json",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      {
        params: Promise.resolve({
          sessionId: "auth_123"
        })
      }
    );

    expect(redeemOpenClawAuthorizationSession).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
        message: "Request body must include a valid exchange_code.",
        retryAfterMs: null
      }
    });
  });
});
