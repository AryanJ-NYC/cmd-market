import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createOpenClawAuthorizationSession } = vi.hoisted(() => ({
  createOpenClawAuthorizationSession: vi.fn()
}));

vi.mock("../../../../lib/seller/service", () => ({
  createOpenClawAuthorizationSession
}));

describe("POST /api/openclaw/authorization-sessions", () => {
  beforeEach(() => {
    createOpenClawAuthorizationSession.mockReset();
  });

  it("returns the OpenClaw browser handoff session payload", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    createOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        browserUrl: "https://cmd.market/seller/authorize/openclaw/browser_token",
        expiresAt: "2026-03-31T03:20:00.000Z",
        sessionId: "auth_123"
      },
      ok: true
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions", {
        body: JSON.stringify({
          code_challenge: "G7m1R8wQ0cGvT9r2xH6d4sN1pL5uY3jK8bA6eF2qWz0",
          code_challenge_method: "S256",
          proposed_workspace: {
            name: "OpenClaw Seller Studio",
            slug: "openclaw-seller-studio"
          }
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(createOpenClawAuthorizationSession).toHaveBeenCalledWith(
      expect.any(Request),
      {
        codeChallenge: "G7m1R8wQ0cGvT9r2xH6d4sN1pL5uY3jK8bA6eF2qWz0",
        codeChallengeMethod: "S256",
        proposedWorkspace: {
          name: "OpenClaw Seller Studio",
          slug: "openclaw-seller-studio"
        }
      }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        browser_url: "https://cmd.market/seller/authorize/openclaw/browser_token",
        expires_at: "2026-03-31T03:20:00.000Z",
        session_id: "auth_123"
      }
    });
  });

  it("returns invalid_request when the PKCE request payload is malformed", async () => {
    const routePath = new URL("./route.ts", import.meta.url);

    expect(existsSync(routePath)).toBe(true);

    if (!existsSync(routePath)) {
      return;
    }

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions", {
        body: JSON.stringify({
          code_challenge: "a".repeat(129),
          code_challenge_method: "S256"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(createOpenClawAuthorizationSession).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
        message:
          "Request body must include a valid PKCE code_challenge payload and optional proposed_workspace details.",
        retryAfterMs: null
      }
    });
  });
});
