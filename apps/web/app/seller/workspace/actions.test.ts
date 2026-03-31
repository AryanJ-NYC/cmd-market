import { beforeEach, describe, expect, it, vi } from "vitest";

const { activateSellerWorkspace, createSellerWorkspace, headers, redirect } = vi.hoisted(() => ({
  activateSellerWorkspace: vi.fn(),
  createSellerWorkspace: vi.fn(),
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

vi.mock("../../../lib/seller/service", () => ({
  activateSellerWorkspace,
  createSellerWorkspace
}));

import { activateWorkspaceAction, createWorkspaceAction } from "./actions";

describe("seller workspace actions", () => {
  beforeEach(() => {
    activateSellerWorkspace.mockReset();
    createSellerWorkspace.mockReset();
    headers.mockReset();
    headers.mockResolvedValue(new Headers());
    redirect.mockClear();
  });

  it("returns to the OpenClaw browser handoff after workspace creation when next is provided", async () => {
    createSellerWorkspace.mockResolvedValue({
      id: "org_123",
      name: "Acme",
      slug: "acme"
    });

    const formData = new FormData();
    formData.set("name", "Acme");
    formData.set("next", "/seller/authorize/openclaw/browser_token");
    formData.set("slug", "acme");

    await expect(createWorkspaceAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });

  it("returns to the OpenClaw browser handoff after workspace activation when next is provided", async () => {
    activateSellerWorkspace.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("next", "/seller/authorize/openclaw/browser_token");
    formData.set("organizationId", "org_123");

    await expect(activateWorkspaceAction(formData)).rejects.toThrow(
      "redirect:/seller/authorize/openclaw/browser_token"
    );
  });
});
