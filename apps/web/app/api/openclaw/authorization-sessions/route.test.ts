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
        exchangeCode: "exchange_secret",
        expiresAt: "2026-03-31T03:20:00.000Z",
        sessionId: "auth_123"
      },
      ok: true
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://cmd.market/api/openclaw/authorization-sessions", {
        method: "POST"
      })
    );

    expect(createOpenClawAuthorizationSession).toHaveBeenCalledWith(expect.any(Request));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        browser_url: "https://cmd.market/seller/authorize/openclaw/browser_token",
        exchange_code: "exchange_secret",
        expires_at: "2026-03-31T03:20:00.000Z",
        session_id: "auth_123"
      }
    });
  });
});
