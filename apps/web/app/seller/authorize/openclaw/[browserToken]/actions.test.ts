import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SellerDomainError } from "../../../../../lib/seller/domain";

const {
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession,
  headers,
  redirect
} = vi.hoisted(() => ({
    authorizeOpenClawAuthorizationSession: vi.fn(),
    cancelOpenClawAuthorizationSession: vi.fn(),
    rejectOpenClawAuthorizationSession: vi.fn(),
    headers: vi.fn(async () => new Headers()),
    redirect: vi.fn((target: string) => {
      throw new Error(`redirect:${target}`);
    })
  }));

vi.mock("next/headers", () => ({
  headers
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("../../../../../lib/seller/service", () => ({
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession
}));

describe("openclaw authorization actions", () => {
  beforeEach(() => {
    authorizeOpenClawAuthorizationSession.mockReset();
    cancelOpenClawAuthorizationSession.mockReset();
    rejectOpenClawAuthorizationSession.mockReset();
    headers.mockReset();
    headers.mockResolvedValue(new Headers());
    redirect.mockClear();
  });

  it("authorizes the browser handoff and returns to the same handoff page", async () => {
    const actionsPath = new URL("./actions.ts", import.meta.url);

    expect(existsSync(actionsPath)).toBe(true);

    if (!existsSync(actionsPath)) {
      return;
    }

    authorizeOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        sessionId: "auth_123",
        status: "authorized",
        workspace: {
          id: "org_123",
          name: "Acme",
          slug: "acme"
        }
      },
      ok: true
    });

    const formData = new FormData();
    formData.set("browserToken", "browser_token");

    const { authorizeOpenClawAuthorizationAction } = await import("./actions");

    await expect(authorizeOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });

  it("rejects the browser handoff and returns to the same handoff page", async () => {
    const actionsPath = new URL("./actions.ts", import.meta.url);

    expect(existsSync(actionsPath)).toBe(true);

    if (!existsSync(actionsPath)) {
      return;
    }

    rejectOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        sessionId: "auth_123",
        status: "rejected"
      },
      ok: true
    });

    const formData = new FormData();
    formData.set("browserToken", "browser_token");

    const { rejectOpenClawAuthorizationAction } = await import("./actions");

    await expect(rejectOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });

  it("cancels the browser handoff and returns to the same handoff page", async () => {
    const actionsPath = new URL("./actions.ts", import.meta.url);

    expect(existsSync(actionsPath)).toBe(true);

    if (!existsSync(actionsPath)) {
      return;
    }

    cancelOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        sessionId: "auth_123",
        status: "cancelled"
      },
      ok: true
    });

    const formData = new FormData();
    formData.set("browserToken", "browser_token");

    const { cancelOpenClawAuthorizationAction } = await import("./actions");

    await expect(cancelOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });

  it("redirects back to the handoff page when authorize hits a recoverable seller-domain error", async () => {
    const actionsPath = new URL("./actions.ts", import.meta.url);

    expect(existsSync(actionsPath)).toBe(true);

    if (!existsSync(actionsPath)) {
      return;
    }

    authorizeOpenClawAuthorizationSession.mockRejectedValue(
      new SellerDomainError(409, "authorization_expired", "OpenClaw authorization session has expired.")
    );

    const formData = new FormData();
    formData.set("browserToken", "browser_token");

    const { authorizeOpenClawAuthorizationAction } = await import("./actions");

    await expect(authorizeOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });
});
