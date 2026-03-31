import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SellerDomainError } from "../../../../../../lib/seller/domain";

const { getOpenClawAuthorizationSessionStatus } = vi.hoisted(() => ({
  getOpenClawAuthorizationSessionStatus: vi.fn()
}));

vi.mock("../../../../../../lib/seller/service", () => ({
  getOpenClawAuthorizationSessionStatus
}));

describe("POST /api/openclaw/authorization-sessions/[sessionId]/status", () => {
  beforeEach(() => {
    getOpenClawAuthorizationSessionStatus.mockReset();
  });

  it("returns the structured OpenClaw authorization session status", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    getOpenClawAuthorizationSessionStatus.mockResolvedValue({
      data: {
        expiresAt: "2026-03-31T03:20:00.000Z",
        sessionId: "auth_123",
        status: "pending"
      },
      ok: true
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
        body: JSON.stringify({
          exchange_code: "exchange_secret"
        }),
        headers: {
          authorization: "Bearer test-openclaw-client-secret",
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

    expect(getOpenClawAuthorizationSessionStatus).toHaveBeenCalledWith({
      exchangeCode: "exchange_secret",
      sessionId: "auth_123"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        expires_at: "2026-03-31T03:20:00.000Z",
        session_id: "auth_123",
        status: "pending"
      }
    });
  });

  it("returns unauthorized when the OpenClaw client secret is missing", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
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

    expect(getOpenClawAuthorizationSessionStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "Valid OpenClaw client authorization is required.",
        retryAfterMs: null
      }
    });
  });

  it("returns a structured exchange error when the status lookup is invalid", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    getOpenClawAuthorizationSessionStatus.mockRejectedValue(
      new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization exchange is invalid.")
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
        body: JSON.stringify({
          exchange_code: "bad_exchange"
        }),
        headers: {
          authorization: "Bearer test-openclaw-client-secret",
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

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized_exchange",
        message: "OpenClaw authorization exchange is invalid.",
        retryAfterMs: null
      }
    });
  });

  it("returns invalid_request when the status request body is malformed json", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
        body: "{not-json",
        headers: {
          authorization: "Bearer test-openclaw-client-secret",
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

    expect(getOpenClawAuthorizationSessionStatus).not.toHaveBeenCalled();
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
