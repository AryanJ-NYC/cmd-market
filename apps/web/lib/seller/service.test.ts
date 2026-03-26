import { beforeEach, describe, expect, it, vi } from "vitest";

const { authApi, createMarketplaceId, sellerAccountRepository } = vi.hoisted(() => ({
  authApi: {
    createApiKey: vi.fn(),
    createOrganization: vi.fn(),
    getSession: vi.fn(),
    listApiKeys: vi.fn(),
    listOrganizations: vi.fn(),
    setActiveOrganization: vi.fn(),
    verifyApiKey: vi.fn()
  },
  createMarketplaceId: vi.fn(() => "seller_123"),
  sellerAccountRepository: {
    createIfMissing: vi.fn(),
    createAuditEvent: vi.fn(),
    findByOrganizationId: vi.fn(),
    findBySellerAccountId: vi.fn(),
    updateEligibility: vi.fn()
  }
}));

vi.mock("../auth", () => ({
  auth: {
    api: authApi
  }
}));

vi.mock("../db/ids", () => ({
  createMarketplaceId
}));

vi.mock("../env", () => ({
  env: {
    allowDevelopmentOverrides: true,
    developmentSellerOverrideEmails: ["allowlisted@example.com"]
  }
}));

vi.mock("./repository", () => ({
  sellerAccountRepository
}));

import {
  activateSellerWorkspace,
  createOpenClawApiKey,
  createSellerWorkspace,
  overrideSellerEligibility,
  resolveSellerPublishability,
  resolveSellerRequestContext
} from "./service";
import { env } from "../env";

describe("seller service", () => {
  beforeEach(() => {
    createMarketplaceId.mockReset();
    createMarketplaceId.mockReturnValue("seller_123");

    authApi.createApiKey.mockReset();
    authApi.createOrganization.mockReset();
    authApi.getSession.mockReset();
    authApi.listApiKeys.mockReset();
    authApi.listOrganizations.mockReset();
    authApi.setActiveOrganization.mockReset();
    authApi.verifyApiKey.mockReset();

    sellerAccountRepository.createIfMissing.mockReset();
    sellerAccountRepository.createAuditEvent.mockReset();
    sellerAccountRepository.findByOrganizationId.mockReset();
    sellerAccountRepository.findBySellerAccountId.mockReset();
    sellerAccountRepository.updateEligibility.mockReset();

    env.allowDevelopmentOverrides = true;
  });

  it("creates exactly one seller account mapping when a workspace is created", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([]);
    authApi.createOrganization.mockResolvedValue({
      id: "org_123",
      name: "Acme",
      slug: "acme"
    });
    authApi.setActiveOrganization.mockResolvedValue(undefined);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    );

    await createSellerWorkspace(new Headers(), {
      name: "Acme",
      slug: "acme"
    });

    expect(sellerAccountRepository.createIfMissing).toHaveBeenCalledTimes(1);
    expect(sellerAccountRepository.createIfMissing).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "seller_123",
        organizationId: "org_123"
      })
    );
    expect(authApi.setActiveOrganization).toHaveBeenCalledWith({
      body: { organizationId: "org_123" },
      headers: expect.any(Headers)
    });
  });

  it("resolves seller context from the active organization on a browser session", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    const result = await resolveSellerRequestContext(new Request("https://example.com/api/seller/context"));

    expect(result).toEqual({
      context: {
        actorApiKeyId: null,
        actorType: "user",
        actorUserId: "user_123",
        eligibilitySource: null,
        eligibilityStatus: "pending",
        organizationId: "org_123",
        sellerAccountId: "seller_123"
      },
      ok: true
    });
  });

  it("activates a seller workspace through the shared service path", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    authApi.setActiveOrganization.mockResolvedValue(undefined);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    await activateSellerWorkspace(new Headers(), "org_123");

    expect(authApi.setActiveOrganization).toHaveBeenCalledWith({
      body: { organizationId: "org_123" },
      headers: expect.any(Headers)
    });
    expect(sellerAccountRepository.createIfMissing).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "seller_123",
        organizationId: "org_123"
      })
    );
  });

  it("returns a 409 when a browser session has no active organization", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    const result = await resolveSellerRequestContext(new Request("https://example.com/api/seller/context"));

    expect(result).toEqual({
      code: "organization_context_required",
      message: "An active seller workspace is required for this request.",
      ok: false,
      status: 409
    });
  });

  it("resolves seller context from an organization API key", async () => {
    authApi.verifyApiKey.mockResolvedValue({
      key: {
        id: "key_123",
        referenceId: "org_123"
      },
      valid: true
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    const result = await resolveSellerRequestContext(
      new Request("https://example.com/api/seller/context", {
        headers: {
          "x-api-key": "cmdmkt_secret"
        }
      })
    );

    expect(result).toEqual({
      context: {
        actorApiKeyId: "key_123",
        actorType: "api_key",
        actorUserId: null,
        eligibilitySource: null,
        eligibilityStatus: "pending",
        organizationId: "org_123",
        sellerAccountId: "seller_123"
      },
      ok: true
    });
  });

  it("creates a single OpenClaw api key for the active workspace", async () => {
    authApi.listApiKeys
      .mockResolvedValueOnce({ apiKeys: [] })
      .mockResolvedValueOnce({
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
        ]
      });
    authApi.createApiKey.mockResolvedValue({
      id: "key_123",
      key: "cmdmkt_secret"
    });

    const result = await createOpenClawApiKey(new Headers(), "org_123");

    expect(authApi.createApiKey).toHaveBeenCalledWith({
      body: {
        configId: "openclaw",
        metadata: { integration: "openclaw" },
        name: "OpenClaw",
        organizationId: "org_123",
        permissions: { seller: ["manage"] },
        prefix: "cmdmkt_"
      },
      headers: expect.any(Headers)
    });
    expect(result.createdKey.key).toBe("cmdmkt_secret");
    expect(result.keys).toHaveLength(1);
  });

  it("returns the shared publishability policy for an ineligible seller", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    sellerAccountRepository.findBySellerAccountId.mockResolvedValue(
      createSellerAccount({
        listingEligibilityStatus: "pending",
        organizationId: "org_123"
      })
    );

    const result = await resolveSellerPublishability(
      new Request("https://example.com/api/seller/publishability")
    );

    expect(result).toEqual({
      context: {
        actorApiKeyId: null,
        actorType: "user",
        actorUserId: "user_123",
        eligibilitySource: null,
        eligibilityStatus: "pending",
        organizationId: "org_123",
        sellerAccountId: "seller_123"
      },
      ok: true,
      publishability: {
        issues: [
          {
            code: "seller_not_eligible",
            message: "Seller workspace is not eligible to publish listings."
          }
        ],
        publishable: false
      },
      sellerAccount: createSellerAccount({
        listingEligibilityStatus: "pending",
        organizationId: "org_123"
      })
    });
  });

  it("blocks the manual override path when development overrides are disabled", async () => {
    env.allowDevelopmentOverrides = false;

    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "allowlisted@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    await expect(overrideSellerEligibility(new Headers(), "approved for development")).rejects.toMatchObject({
      code: "forbidden",
      message: "Development seller override is unavailable in production.",
      status: 403
    });
    expect(sellerAccountRepository.updateEligibility).not.toHaveBeenCalled();
    expect(sellerAccountRepository.createAuditEvent).not.toHaveBeenCalled();
  });
});

function createSellerAccount(overrides: Partial<SellerAccountLike>) {
  return {
    createdAt: new Date("2026-03-25T12:00:00.000Z"),
    defaultDisplayCurrencyCode: "USD",
    id: "seller_123",
    listingEligibilityNote: null,
    listingEligibilitySource: null,
    listingEligibilityStatus: "pending",
    organizationId: "org_123",
    status: "active",
    updatedAt: new Date("2026-03-25T12:00:00.000Z"),
    ...overrides
  } satisfies SellerAccountLike;
}

type SellerAccountLike = {
  createdAt: Date;
  defaultDisplayCurrencyCode: string;
  id: string;
  listingEligibilityNote: string | null;
  listingEligibilitySource: "manual_override" | "x_verification" | null;
  listingEligibilityStatus: "pending" | "eligible" | "revoked" | "suspended";
  organizationId: string;
  status: "active" | "suspended" | "closed";
  updatedAt: Date;
};
