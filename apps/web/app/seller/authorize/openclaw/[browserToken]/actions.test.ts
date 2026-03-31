import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SellerDomainError } from "../../../../../lib/seller/domain";

const {
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  createWorkspaceAndAuthorizeOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession,
  headers,
  redirect
} = vi.hoisted(() => ({
    authorizeOpenClawAuthorizationSession: vi.fn(),
    cancelOpenClawAuthorizationSession: vi.fn(),
    createWorkspaceAndAuthorizeOpenClawAuthorizationSession: vi.fn(),
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
  createWorkspaceAndAuthorizeOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession
}));

describe("openclaw authorization actions", () => {
  beforeEach(() => {
    authorizeOpenClawAuthorizationSession.mockReset();
    cancelOpenClawAuthorizationSession.mockReset();
    createWorkspaceAndAuthorizeOpenClawAuthorizationSession.mockReset();
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

  it("creates the first seller workspace and returns to the same handoff page", async () => {
    createWorkspaceAndAuthorizeOpenClawAuthorizationSession.mockResolvedValue({
      data: {
        sessionId: "auth_123",
        status: "authorized",
        workspace: {
          id: "org_123",
          name: "OpenClaw Seller Studio",
          slug: "openclaw-seller-studio"
        }
      },
      ok: true
    });

    const formData = new FormData();
    formData.set("browserToken", "browser_token");
    formData.set("name", "OpenClaw Seller Studio");
    formData.set("slug", "openclaw-seller-studio");

    const { createWorkspaceAndAuthorizeOpenClawAuthorizationAction } = await import("./actions");

    await expect(createWorkspaceAndAuthorizeOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
    expect(createWorkspaceAndAuthorizeOpenClawAuthorizationSession).toHaveBeenCalledWith(
      expect.any(Headers),
      "browser_token",
      {
        name: "OpenClaw Seller Studio",
        slug: "openclaw-seller-studio"
      }
    );
  });

  it("keeps workspace creation validation errors inline on the handoff page", async () => {
    const formData = new FormData();
    formData.set("browserToken", "browser_token");
    formData.set("name", "OpenClaw Seller Studio");
    formData.set("slug", "Bad Slug");

    const { createWorkspaceAndAuthorizeOpenClawAuthorizationAction } = await import("./actions");

    await expect(createWorkspaceAndAuthorizeOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token?error=Workspace+slug+must+use+lowercase+letters%2C+numbers%2C+and+hyphens.&name=OpenClaw+Seller+Studio&slug=Bad+Slug"
    );
    expect(createWorkspaceAndAuthorizeOpenClawAuthorizationSession).not.toHaveBeenCalled();
  });

  it("preserves edited workspace values when handoff creation fails", async () => {
    createWorkspaceAndAuthorizeOpenClawAuthorizationSession.mockRejectedValue(
      new Error("Workspace slug is already taken.")
    );

    const formData = new FormData();
    formData.set("browserToken", "browser_token");
    formData.set("name", "OpenClaw Seller Studio");
    formData.set("slug", "openclaw-seller-studio");

    const { createWorkspaceAndAuthorizeOpenClawAuthorizationAction } = await import("./actions");

    await expect(createWorkspaceAndAuthorizeOpenClawAuthorizationAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token?error=Workspace+slug+is+already+taken.&name=OpenClaw+Seller+Studio&slug=openclaw-seller-studio"
    );
  });
});
