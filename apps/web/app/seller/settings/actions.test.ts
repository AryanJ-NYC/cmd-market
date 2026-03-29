import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSellerWorkspacePageData, createOpenClawApiKey, overrideSellerEligibility, revalidatePath } =
  vi.hoisted(() => ({
    createOpenClawApiKey: vi.fn(),
    getSellerWorkspacePageData: vi.fn(),
    overrideSellerEligibility: vi.fn(),
    revalidatePath: vi.fn()
  }));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("../../../lib/auth", () => ({
  auth: {
    api: {
      signOut: vi.fn()
    }
  }
}));

vi.mock("../../../lib/seller/service", () => ({
  createOpenClawApiKey,
  getSellerWorkspacePageData,
  overrideSellerEligibility
}));

import { createOpenClawApiKeyAction } from "./actions";

describe("seller settings actions", () => {
  beforeEach(() => {
    createOpenClawApiKey.mockReset();
    getSellerWorkspacePageData.mockReset();
    overrideSellerEligibility.mockReset();
    revalidatePath.mockReset();
  });

  it("refreshes api key state after OpenClaw creation fails", async () => {
    getSellerWorkspacePageData
      .mockResolvedValueOnce({
        activeOrganization: { id: "org_123", name: "Acme", slug: "acme" },
        apiKeys: [],
        developmentOverrideAllowed: false,
        flow: { kind: "ready", organizationId: "org_123" },
        organizations: [{ id: "org_123", name: "Acme", slug: "acme" }],
        session: {
          email: "seller@example.com",
          id: "user_123",
          name: "Seller"
        }
      })
      .mockResolvedValueOnce({
        activeOrganization: { id: "org_123", name: "Acme", slug: "acme" },
        apiKeys: [
          {
            configId: "openclaw",
            createdAt: new Date("2026-03-25T12:00:00.000Z"),
            id: "key_123",
            lastRequest: null,
            metadata: { integration: "openclaw" },
            name: "OpenClaw",
            permissions: { seller: ["manage"] },
            prefix: "cmdmkt_",
            start: "cmdmkt_abcd"
          }
        ],
        developmentOverrideAllowed: false,
        flow: { kind: "ready", organizationId: "org_123" },
        organizations: [{ id: "org_123", name: "Acme", slug: "acme" }],
        session: {
          email: "seller@example.com",
          id: "user_123",
          name: "Seller"
        }
      });
    createOpenClawApiKey.mockRejectedValue(new Error("OpenClaw is already authorized for this seller workspace."));

    const result = await createOpenClawApiKeyAction(
      {
        apiKeys: [],
        message: null,
        plaintextKey: null,
        status: "idle"
      },
      new FormData()
    );

    expect(result).toEqual({
      apiKeys: [
        {
          configId: "openclaw",
          createdAt: "2026-03-25T12:00:00.000Z",
          id: "key_123",
          lastRequest: null,
          metadata: { integration: "openclaw" },
          name: "OpenClaw",
          permissions: { seller: ["manage"] },
          prefix: "cmdmkt_",
          start: "cmdmkt_abcd"
        }
      ],
      message: "OpenClaw is already authorized for this seller workspace.",
      plaintextKey: null,
      status: "error"
    });
  });
});
