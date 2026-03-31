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
          code_verifier: "openclaw-public-client-code-verifier-123456789"
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

    expect(getOpenClawAuthorizationSessionStatus).toHaveBeenCalledWith({
      codeVerifier: "openclaw-public-client-code-verifier-123456789",
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

  it("returns a structured verifier error when the status lookup is invalid", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    getOpenClawAuthorizationSessionStatus.mockRejectedValue(
      new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization verifier is invalid.")
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
        body: JSON.stringify({
          code_verifier: "wrong-openclaw-public-client-code-verifier-1234567890"
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

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized_exchange",
        message: "OpenClaw authorization verifier is invalid.",
        retryAfterMs: null
      }
    });
  });

  it("returns invalid_request when the status request body includes a malformed verifier", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions/auth_123/status", {
        body: JSON.stringify({
          code_verifier: "invalid+openclaw-public-client-code-verifier-1234567890"
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
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
        message: "Request body must include a valid code_verifier.",
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
        message: "Request body must include a valid code_verifier.",
        retryAfterMs: null
      }
    });
  });
});
