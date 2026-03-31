import type {
  SellerEligibilitySource as PrismaSellerEligibilitySource,
  SellerEligibilityStatus as PrismaSellerEligibilityStatus
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authApi, createMarketplaceId, openClawAuthorizationSessionRepository, sellerAccountRepository } = vi.hoisted(() => ({
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
  openClawAuthorizationSessionRepository: {
    createAuditEvent: vi.fn(),
    createSession: vi.fn(),
    deleteApiKeyById: vi.fn(),
    findApiKeyByOrganizationId: vi.fn(),
    findSessionByBrowserTokenHash: vi.fn(),
    findSessionByIdAndExchangeCodeHash: vi.fn(),
    markAuthorized: vi.fn(),
    markCancelled: vi.fn(),
    markExpired: vi.fn(),
    markRejected: vi.fn(),
    markRedeemed: vi.fn(),
    redeemSessionWithApiKeyRotation: vi.fn()
  },
  sellerAccountRepository: {
    applyDevelopmentEligibilityOverride: vi.fn(),
    createIfMissing: vi.fn(),
    findByOrganizationId: vi.fn(),
    findBySellerAccountId: vi.fn()
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

vi.mock("./openclaw-authorization-repository", () => ({
  openClawAuthorizationSessionRepository
}));

import {
  activateSellerWorkspace,
  createOpenClawApiKey,
  createSellerWorkspace,
  overrideSellerEligibility,
  resolveSellerPublishability,
  resolveSellerRequestContext
} from "./service";
import * as sellerService from "./service";
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

    openClawAuthorizationSessionRepository.createAuditEvent.mockReset();
    openClawAuthorizationSessionRepository.createSession.mockReset();
    openClawAuthorizationSessionRepository.deleteApiKeyById.mockReset();
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockReset();
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockReset();
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockReset();
    openClawAuthorizationSessionRepository.markAuthorized.mockReset();
    openClawAuthorizationSessionRepository.markCancelled.mockReset();
    openClawAuthorizationSessionRepository.markExpired.mockReset();
    openClawAuthorizationSessionRepository.markRejected.mockReset();
    openClawAuthorizationSessionRepository.markRedeemed.mockReset();
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockReset();
    sellerAccountRepository.applyDevelopmentEligibilityOverride.mockReset();
    sellerAccountRepository.createIfMissing.mockReset();
    sellerAccountRepository.findByOrganizationId.mockReset();
    sellerAccountRepository.findBySellerAccountId.mockReset();

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

    expect(authApi.createOrganization).toHaveBeenCalledWith({
      body: {
        keepCurrentActiveOrganization: false,
        name: "Acme",
        slug: "acme",
        userId: "user_123"
      }
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

  it("creates an OpenClaw authorization session with a browser handoff url", async () => {
    createMarketplaceId.mockReturnValueOnce("auth_123");
    openClawAuthorizationSessionRepository.createSession.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiresAt: new Date("2026-03-31T03:20:00.000Z"),
        id: "auth_123"
      })
    );

    if (typeof sellerService.createOpenClawAuthorizationSession !== "function") {
      expect(typeof sellerService.createOpenClawAuthorizationSession).toBe("function");
      return;
    }

    const result = await sellerService.createOpenClawAuthorizationSession(
      new Request("https://cmd.market/api/openclaw/authorization-sessions", {
        method: "POST"
      })
    );

    expect(result).toEqual({
      data: {
        browserUrl: expect.stringMatching(
          /^https:\/\/cmd\.market\/seller\/authorize\/openclaw\/[A-Za-z0-9_-]+$/
        ),
        exchangeCode: expect.any(String),
        expiresAt: "2026-03-31T03:20:00.000Z",
        sessionId: "auth_123"
      },
      ok: true
    });
    expect(openClawAuthorizationSessionRepository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        browserTokenHash: expect.any(String),
        exchangeCodeHash: expect.any(String),
        expiresAt: expect.any(Date),
        id: "auth_123",
        proposedWorkspaceName: "OpenClaw Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio",
        status: "pending"
      })
    );
  });

  it("persists proposed workspace values when OpenClaw provides them at session creation time", async () => {
    createMarketplaceId.mockReturnValueOnce("auth_123");
    openClawAuthorizationSessionRepository.createSession.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiresAt: new Date("2026-03-31T03:20:00.000Z"),
        id: "auth_123",
        proposedWorkspaceName: "Custom Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio"
      })
    );

    const result = await sellerService.createOpenClawAuthorizationSession(
      new Request("https://cmd.market/api/openclaw/authorization-sessions", {
        method: "POST"
      }),
      {
        name: "Custom Seller Studio"
      }
    );

    expect(openClawAuthorizationSessionRepository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "auth_123",
        proposedWorkspaceName: "Custom Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio"
      })
    );
    expect(result).toEqual({
      data: {
        browserUrl: expect.stringMatching(
          /^https:\/\/cmd\.market\/seller\/authorize\/openclaw\/[A-Za-z0-9_-]+$/
        ),
        exchangeCode: expect.any(String),
        expiresAt: "2026-03-31T03:20:00.000Z",
        sessionId: "auth_123"
      },
      ok: true
    });
  });

  it("returns pending while an OpenClaw authorization session is waiting for consent", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        status: "pending"
      })
    );

    if (typeof sellerService.getOpenClawAuthorizationSessionStatus !== "function") {
      expect(typeof sellerService.getOpenClawAuthorizationSessionStatus).toBe("function");
      return;
    }

    const result = await sellerService.getOpenClawAuthorizationSessionStatus({
      exchangeCode: "exchange_secret",
      sessionId: "auth_123"
    });

    expect(result).toEqual({
      data: {
        expiresAt: "2099-03-31T03:20:00.000Z",
        sessionId: "auth_123",
        status: "pending"
      },
      ok: true
    });
  });

  it("marks a stale OpenClaw authorization session as expired during polling", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiresAt: new Date("2000-01-01T00:00:00.000Z"),
        id: "auth_123",
        status: "pending"
      })
    );
    openClawAuthorizationSessionRepository.markExpired.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiredAt: new Date("2000-01-01T00:00:01.000Z"),
        expiresAt: new Date("2000-01-01T00:00:00.000Z"),
        failureCode: "authorization_expired",
        failureMessage: "OpenClaw authorization session expired before completion.",
        id: "auth_123",
        status: "expired"
      })
    );

    const result = await sellerService.getOpenClawAuthorizationSessionStatus({
      exchangeCode: "exchange_secret",
      sessionId: "auth_123"
    });

    expect(openClawAuthorizationSessionRepository.markExpired).toHaveBeenCalledWith({
      expiredAt: expect.any(Date),
      failureCode: "authorization_expired",
      failureMessage: "OpenClaw authorization session expired before completion.",
      id: "auth_123"
    });
    expect(result).toEqual({
      data: {
        expiresAt: "2000-01-01T00:00:00.000Z",
        sessionId: "auth_123",
        status: "expired"
      },
      ok: true
    });
  });

  it("requests sign-in for the OpenClaw browser handoff when no browser session exists", async () => {
    authApi.getSession.mockResolvedValue(null);
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );

    if (typeof sellerService.getOpenClawAuthorizationPageState !== "function") {
      expect(typeof sellerService.getOpenClawAuthorizationPageState).toBe("function");
      return;
    }

    const result = await sellerService.getOpenClawAuthorizationPageState(new Headers(), "browser_token");

    expect(result).toEqual({
      kind: "sign_in_required",
      nextPath: "/seller/authorize/openclaw/browser_token"
    });
  });

  it("returns an explicit consent state for the active seller workspace", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listApiKeys.mockResolvedValue({ apiKeys: [] });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );

    if (typeof sellerService.getOpenClawAuthorizationPageState !== "function") {
      expect(typeof sellerService.getOpenClawAuthorizationPageState).toBe("function");
      return;
    }

    const result = await sellerService.getOpenClawAuthorizationPageState(new Headers(), "browser_token");

    expect(result).toEqual({
      email: "seller@example.com",
      kind: "consent",
      sessionId: "auth_123",
      workspace: {
        id: "org_123",
        name: "Acme",
        slug: "acme"
      }
    });
  });

  it("returns an in-handoff workspace creation state for signed-in first-run sellers", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([]);
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        proposedWorkspaceName: "Custom Seller Studio",
        proposedWorkspaceSlug: "custom-seller-studio"
      })
    );

    const result = await sellerService.getOpenClawAuthorizationPageState(new Headers(), "browser_token");

    expect(result).toEqual({
      email: "seller@example.com",
      kind: "workspace_creation",
      proposedWorkspace: {
        name: "Custom Seller Studio",
        slug: "custom-seller-studio"
      },
      sessionId: "auth_123"
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

  it("preserves rate-limited api key failures as 429 responses", async () => {
    authApi.verifyApiKey.mockResolvedValue({
      error: {
        code: "RATE_LIMITED",
        details: {
          tryAgainIn: 60000
        },
        message: "Rate limit exceeded."
      },
      key: null,
      valid: false
    });

    const result = await resolveSellerRequestContext(
      new Request("https://example.com/api/seller/context", {
        headers: {
          "x-api-key": "cmdmkt_secret"
        }
      })
    );

    expect(result).toEqual({
      code: "RATE_LIMITED",
      message: "Rate limit exceeded.",
      ok: false,
      retryAfterMs: 60000,
      status: 429
    });
  });

  it("does not create a seller account for a stale active organization outside the user's memberships", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_stale" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );

    const result = await resolveSellerRequestContext(new Request("https://example.com/api/seller/context"));

    expect(result).toEqual({
      code: "forbidden",
      message: "Authenticated user is not a member of the active seller workspace.",
      ok: false,
      status: 403
    });
    expect(sellerAccountRepository.createIfMissing).toHaveBeenCalledTimes(1);
    expect(sellerAccountRepository.createIfMissing).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_123"
      })
    );
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

    expect(authApi.createApiKey).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          configId: "openclaw",
          metadata: { integration: "openclaw" },
          name: "OpenClaw",
          organizationId: "org_123",
          prefix: "cmdmkt_"
        }
      })
    );
    expect(result.createdKey.key).toBe("cmdmkt_secret");
    expect(result.keys).toHaveLength(1);
  });

  it("redeems an authorized OpenClaw authorization session by rotating the existing OpenClaw key", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        status: "authorized"
      })
    );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    authApi.createApiKey.mockResolvedValue({
      id: "key_new",
      key: "cmdmkt_secret"
    });
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockResolvedValue({
      applied: true,
      session: createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        redeemedAt: new Date("2026-03-31T03:11:00.000Z"),
        status: "redeemed",
        updatedAt: new Date("2026-03-31T03:11:00.000Z")
      })
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        listingEligibilityStatus: "eligible",
        organizationId: "org_123"
      })
    );

    if (typeof sellerService.redeemOpenClawAuthorizationSession !== "function") {
      expect(typeof sellerService.redeemOpenClawAuthorizationSession).toBe("function");
      return;
    }

    const result = await sellerService.redeemOpenClawAuthorizationSession({
      exchangeCode: "exchange_secret",
      sessionId: "auth_123"
    });

    expect(authApi.createApiKey).toHaveBeenCalledWith({
      body: {
        configId: "openclaw_pending_rotation",
        metadata: { integration: "openclaw" },
        name: "OpenClaw",
        organizationId: "org_123",
        prefix: "cmdmkt_",
        userId: "user_123"
      }
    });
    expect(openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation).toHaveBeenCalledWith({
      auditEvent: {
        action: "openclaw_authorization.redeemed",
        actorApiKeyId: null,
        actorType: "system",
        actorUserId: null,
        createdAt: expect.any(Date),
        entityId: "auth_123",
        entityTable: "openclaw_authorization_session",
        id: "seller_123",
        metadata: {
          newApiKeyId: "key_new",
          organizationId: "org_123",
          replacedApiKeyId: "key_existing",
          sessionStatus: "redeemed"
        },
        note: "OpenClaw authorization session was redeemed into a seller API key.",
        sellerAccountId: "seller_123"
      },
      newApiKeyId: "key_new",
      previousApiKeyId: "key_existing",
      redeemedAt: expect.any(Date),
      sessionId: "auth_123"
    });
    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).not.toHaveBeenCalled();
    expect(result).toEqual({
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
  });

  it("does not delete the current OpenClaw key if redeem cannot mint a replacement", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        status: "authorized"
      })
    );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    authApi.createApiKey.mockRejectedValue(new Error("failed to create api key"));

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toThrow("failed to create api key");

    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).not.toHaveBeenCalled();
    expect(openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation).not.toHaveBeenCalled();
  });

  it("returns authorization_pending when staged-key creation races with another redeem", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash
      .mockResolvedValueOnce(
        createOpenClawAuthorizationSessionRecord({
          authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
          authorizedByUserId: "user_123",
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          organizationId: "org_123",
          status: "authorized"
        })
      )
      .mockResolvedValueOnce(
        createOpenClawAuthorizationSessionRecord({
          authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
          authorizedByUserId: "user_123",
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          organizationId: "org_123",
          status: "authorized"
        })
      );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    authApi.createApiKey.mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed on the fields: (`configId`,`referenceId`)",
      meta: {
        target: ["configId", "referenceId"]
      }
    });

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toMatchObject({
      code: "authorization_pending",
      message: "OpenClaw authorization is not ready to redeem yet."
    });

    expect(openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation).not.toHaveBeenCalled();
    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).not.toHaveBeenCalled();
  });

  it("cleans up the temporary OpenClaw key if redeem fails after key creation", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        status: "authorized"
      })
    );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    authApi.createApiKey.mockResolvedValue({
      id: "key_new",
      key: "cmdmkt_secret"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockRejectedValue(
      new Error("rotation transaction failed")
    );

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toThrow("rotation transaction failed");

    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).toHaveBeenCalledWith("key_new");
  });

  it("returns authorization_redeemed when key promotion races with another issued OpenClaw key", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash
      .mockResolvedValueOnce(
        createOpenClawAuthorizationSessionRecord({
          authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
          authorizedByUserId: "user_123",
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          organizationId: "org_123",
          status: "authorized"
        })
      )
      .mockResolvedValueOnce(
        createOpenClawAuthorizationSessionRecord({
          authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
          authorizedByUserId: "user_123",
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          organizationId: "org_123",
          status: "authorized"
        })
      );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        configId: "openclaw",
        id: "key_other"
      });
    authApi.createApiKey.mockResolvedValue({
      id: "key_new",
      key: "cmdmkt_secret"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed on the fields: (`configId`,`referenceId`)",
      meta: {
        target: ["configId", "referenceId"]
      }
    });

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toMatchObject({
      code: "authorization_redeemed",
      message: "OpenClaw authorization session has already been redeemed."
    });

    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).toHaveBeenCalledWith("key_new");
    expect(openClawAuthorizationSessionRepository.findApiKeyByOrganizationId).toHaveBeenCalledTimes(2);
  });

  it("cleans up the staged OpenClaw key and returns a terminal error when redeem loses the race", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        status: "authorized"
      })
    );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    authApi.createApiKey.mockResolvedValue({
      id: "key_new",
      key: "cmdmkt_secret"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockResolvedValue({
      applied: false,
      session: createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiredAt: new Date("2026-03-31T03:11:00.000Z"),
        failureCode: "authorization_expired",
        failureMessage: "OpenClaw authorization session expired before completion.",
        id: "auth_123",
        organizationId: "org_123",
        status: "expired",
        updatedAt: new Date("2026-03-31T03:11:00.000Z")
      })
    });

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toMatchObject({
      code: "authorization_expired",
      message: "OpenClaw authorization session has expired."
    });

    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).toHaveBeenCalledTimes(1);
    expect(openClawAuthorizationSessionRepository.deleteApiKeyById).toHaveBeenCalledWith("key_new");
  });

  it("surfaces cleanup failures when staged-key rollback also fails", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        status: "authorized"
      })
    );
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId.mockResolvedValue({
      configId: "openclaw",
      id: "key_existing"
    });
    authApi.createApiKey.mockResolvedValue({
      id: "key_new",
      key: "cmdmkt_secret"
    });
    sellerAccountRepository.findByOrganizationId.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation.mockRejectedValue(
      new Error("rotation transaction failed")
    );
    openClawAuthorizationSessionRepository.deleteApiKeyById.mockRejectedValue(new Error("cleanup failed"));

    let caughtError: unknown;

    try {
      await sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AggregateError);
    expect((caughtError as AggregateError).message).toBe(
      "OpenClaw redeem failed and cleanup of the staged API key also failed."
    );
    expect((caughtError as AggregateError).errors).toMatchObject([
      { message: "rotation transaction failed" },
      { message: "cleanup failed" }
    ]);
  });

  it("returns a terminal rejected error when OpenClaw tries to redeem a rejected session", async () => {
    openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        rejectedAt: new Date("2026-03-31T03:12:00.000Z"),
        status: "rejected"
      })
    );

    await expect(
      sellerService.redeemOpenClawAuthorizationSession({
        exchangeCode: "exchange_secret",
        sessionId: "auth_123"
      })
    ).rejects.toMatchObject({
      code: "authorization_rejected",
      message: "OpenClaw authorization session was rejected."
    });
  });

  it("authorizes the OpenClaw browser handoff for the active seller workspace", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listApiKeys.mockResolvedValue({ apiKeys: [] });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );
    openClawAuthorizationSessionRepository.markAuthorized.mockResolvedValue(
      {
        applied: true,
        session: createOpenClawAuthorizationSessionRecord({
          authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
          authorizedByUserId: "user_123",
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          organizationId: "org_123",
          status: "authorized"
        })
      }
    );

    if (typeof sellerService.authorizeOpenClawAuthorizationSession !== "function") {
      expect(typeof sellerService.authorizeOpenClawAuthorizationSession).toBe("function");
      return;
    }

    const result = await sellerService.authorizeOpenClawAuthorizationSession(new Headers(), "browser_token");

    expect(openClawAuthorizationSessionRepository.markAuthorized).toHaveBeenCalledWith({
      authorizedAt: expect.any(Date),
      authorizedByUserId: "user_123",
      id: "auth_123",
      organizationId: "org_123"
    });
    expect(openClawAuthorizationSessionRepository.createAuditEvent).toHaveBeenCalledWith({
      action: "openclaw_authorization.approved",
      actorApiKeyId: null,
      actorType: "user",
      actorUserId: "user_123",
      createdAt: expect.any(Date),
      entityId: "auth_123",
      entityTable: "openclaw_authorization_session",
      id: "seller_123",
      metadata: {
        organizationId: "org_123",
        sessionStatus: "authorized"
      },
      note: "Seller approved OpenClaw workspace access.",
      sellerAccountId: "seller_123"
    });
    expect(result).toEqual({
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
  });

  it("creates the first seller workspace and authorizes OpenClaw in one handoff submit", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([]);
    authApi.createOrganization.mockResolvedValue({
      id: "org_123",
      name: "OpenClaw Seller Studio",
      slug: "openclaw-seller-studio"
    });
    authApi.setActiveOrganization.mockResolvedValue(undefined);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        proposedWorkspaceName: "OpenClaw Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio"
      })
    );
    openClawAuthorizationSessionRepository.markAuthorized.mockResolvedValue({
      applied: true,
      session: createOpenClawAuthorizationSessionRecord({
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        organizationId: "org_123",
        proposedWorkspaceName: "OpenClaw Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio",
        status: "authorized"
      })
    });

    const result = await sellerService.createWorkspaceAndAuthorizeOpenClawAuthorizationSession(
      new Headers(),
      "browser_token",
      {
        name: "OpenClaw Seller Studio",
        slug: "openclaw-seller-studio"
      }
    );

    expect(authApi.createOrganization).toHaveBeenCalledWith({
      body: {
        keepCurrentActiveOrganization: false,
        name: "OpenClaw Seller Studio",
        slug: "openclaw-seller-studio",
        userId: "user_123"
      }
    });
    expect(openClawAuthorizationSessionRepository.markAuthorized).toHaveBeenCalledWith({
      authorizedAt: expect.any(Date),
      authorizedByUserId: "user_123",
      id: "auth_123",
      organizationId: "org_123"
    });
    expect(openClawAuthorizationSessionRepository.createAuditEvent).toHaveBeenCalledWith({
      action: "openclaw_authorization.approved",
      actorApiKeyId: null,
      actorType: "user",
      actorUserId: "user_123",
      createdAt: expect.any(Date),
      entityId: "auth_123",
      entityTable: "openclaw_authorization_session",
      id: "seller_123",
      metadata: {
        organizationId: "org_123",
        sessionStatus: "authorized",
        workspaceCreatedDuringHandoff: true
      },
      note: "Seller approved OpenClaw workspace access.",
      sellerAccountId: "seller_123"
    });
    expect(result).toEqual({
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
  });

  it("does not roll back the new workspace if the handoff terminalizes before authorization is marked", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: null },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listOrganizations.mockResolvedValue([]);
    authApi.createOrganization.mockResolvedValue({
      id: "org_123",
      name: "OpenClaw Seller Studio",
      slug: "openclaw-seller-studio"
    });
    authApi.setActiveOrganization.mockResolvedValue(undefined);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123",
        proposedWorkspaceName: "OpenClaw Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio"
      })
    );
    openClawAuthorizationSessionRepository.markAuthorized.mockResolvedValue({
      applied: false,
      session: createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        expiredAt: new Date("2026-03-31T03:10:00.000Z"),
        failureCode: "authorization_expired",
        failureMessage: "OpenClaw authorization session expired before completion.",
        id: "auth_123",
        proposedWorkspaceName: "OpenClaw Seller Studio",
        proposedWorkspaceSlug: "openclaw-seller-studio",
        status: "expired",
        updatedAt: new Date("2026-03-31T03:10:00.000Z")
      })
    });

    await expect(
      sellerService.createWorkspaceAndAuthorizeOpenClawAuthorizationSession(
        new Headers(),
        "browser_token",
        {
          name: "OpenClaw Seller Studio",
          slug: "openclaw-seller-studio"
        }
      )
    ).rejects.toMatchObject({
      code: "authorization_expired",
      message: "OpenClaw authorization session has expired."
    });

    expect(authApi.createOrganization).toHaveBeenCalledTimes(1);
    expect(openClawAuthorizationSessionRepository.createAuditEvent).not.toHaveBeenCalled();
  });

  it("rejects the OpenClaw browser handoff for the active seller workspace", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listApiKeys.mockResolvedValue({ apiKeys: [] });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );
    openClawAuthorizationSessionRepository.markRejected.mockResolvedValue(
      {
        applied: true,
        session: createOpenClawAuthorizationSessionRecord({
          browserTokenHash: "browser_hash",
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          rejectedAt: new Date("2026-03-31T03:12:00.000Z"),
          status: "rejected"
        })
      }
    );

    const result = await sellerService.rejectOpenClawAuthorizationSession(new Headers(), "browser_token");

    expect(openClawAuthorizationSessionRepository.markRejected).toHaveBeenCalledWith({
      id: "auth_123",
      rejectedAt: expect.any(Date)
    });
    expect(openClawAuthorizationSessionRepository.createAuditEvent).toHaveBeenCalledWith({
      action: "openclaw_authorization.rejected",
      actorApiKeyId: null,
      actorType: "user",
      actorUserId: "user_123",
      createdAt: expect.any(Date),
      entityId: "auth_123",
      entityTable: "openclaw_authorization_session",
      id: "seller_123",
      metadata: {
        organizationId: "org_123",
        sessionStatus: "rejected"
      },
      note: "OpenClaw workspace access was rejected.",
      sellerAccountId: "seller_123"
    });
    expect(result).toEqual({
      data: {
        sessionId: "auth_123",
        status: "rejected"
      },
      ok: true
    });
  });

  it("requires an active seller workspace before rejecting the OpenClaw browser handoff", async () => {
    authApi.getSession.mockResolvedValue(null);
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );

    await expect(
      sellerService.rejectOpenClawAuthorizationSession(new Headers(), "browser_token")
    ).rejects.toMatchObject({
      code: "organization_context_required",
      message: "Choose a seller workspace before rejecting OpenClaw."
    });

    expect(openClawAuthorizationSessionRepository.markRejected).not.toHaveBeenCalled();
  });

  it("cancels the OpenClaw browser handoff for the active seller workspace", async () => {
    authApi.getSession.mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { email: "seller@example.com", id: "user_123", name: "Seller" }
    });
    authApi.listApiKeys.mockResolvedValue({ apiKeys: [] });
    authApi.listOrganizations.mockResolvedValue([{ id: "org_123", name: "Acme", slug: "acme" }]);
    sellerAccountRepository.createIfMissing.mockResolvedValue(
      createSellerAccount({
        organizationId: "org_123"
      })
    );
    openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash.mockResolvedValue(
      createOpenClawAuthorizationSessionRecord({
        browserTokenHash: "browser_hash",
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      })
    );
    openClawAuthorizationSessionRepository.markCancelled.mockResolvedValue(
      {
        applied: true,
        session: createOpenClawAuthorizationSessionRecord({
          browserTokenHash: "browser_hash",
          cancelledAt: new Date("2026-03-31T03:12:00.000Z"),
          exchangeCodeHash: "exchange_hash",
          id: "auth_123",
          status: "cancelled"
        })
      }
    );

    if (typeof sellerService.cancelOpenClawAuthorizationSession !== "function") {
      expect(typeof sellerService.cancelOpenClawAuthorizationSession).toBe("function");
      return;
    }

    const result = await sellerService.cancelOpenClawAuthorizationSession(new Headers(), "browser_token");

    expect(openClawAuthorizationSessionRepository.markCancelled).toHaveBeenCalledWith({
      cancelledAt: expect.any(Date),
      id: "auth_123"
    });
    expect(openClawAuthorizationSessionRepository.createAuditEvent).toHaveBeenCalledWith({
      action: "openclaw_authorization.cancelled",
      actorApiKeyId: null,
      actorType: "user",
      actorUserId: "user_123",
      createdAt: expect.any(Date),
      entityId: "auth_123",
      entityTable: "openclaw_authorization_session",
      id: "seller_123",
      metadata: {
        organizationId: "org_123",
        sessionStatus: "cancelled"
      },
      note: "OpenClaw authorization session was cancelled.",
      sellerAccountId: "seller_123"
    });
    expect(result).toEqual({
      data: {
        sessionId: "auth_123",
        status: "cancelled"
      },
      ok: true
    });
  });

  it("treats a concurrent OpenClaw key creation as already authorized", async () => {
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
    authApi.createApiKey.mockRejectedValue(new Error("duplicate key"));

    await expect(createOpenClawApiKey(new Headers(), "org_123")).rejects.toMatchObject({
      code: "openclaw_key_exists",
      message: "OpenClaw is already authorized for this seller workspace."
    });
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
    sellerAccountRepository.applyDevelopmentEligibilityOverride.mockResolvedValue(
      createSellerAccount({
        listingEligibilityNote: "approved for development",
        listingEligibilitySource: "manual_override",
        listingEligibilityStatus: "eligible",
        organizationId: "org_123"
      })
    );

    await expect(overrideSellerEligibility(new Headers(), "approved for development")).rejects.toMatchObject({
      code: "forbidden",
      message: "Development seller override is unavailable in production.",
      status: 403
    });
    expect(sellerAccountRepository.applyDevelopmentEligibilityOverride).not.toHaveBeenCalled();
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

function createOpenClawAuthorizationSessionRecord(
  overrides: Partial<OpenClawAuthorizationSessionRecord> & Pick<
    OpenClawAuthorizationSessionRecord,
    "browserTokenHash" | "exchangeCodeHash"
  >
) {
  const {
    browserTokenHash,
    exchangeCodeHash,
    ...restOverrides
  } = overrides;

  return {
    authorizedAt: null,
    authorizedByUserId: null,
    browserTokenHash,
    cancelledAt: null,
    createdAt: new Date("2026-03-31T03:05:00.000Z"),
    exchangeCodeHash,
    expiredAt: null,
    expiresAt: new Date("2099-03-31T03:20:00.000Z"),
    failureCode: null,
    failureMessage: null,
    id: "auth_123",
    organizationId: null,
    proposedWorkspaceName: "OpenClaw Seller Studio",
    proposedWorkspaceSlug: "openclaw-seller-studio",
    redeemedAt: null,
    rejectedAt: null,
    status: "pending",
    updatedAt: new Date("2026-03-31T03:05:00.000Z"),
    ...restOverrides
  } satisfies OpenClawAuthorizationSessionRecord;
}

type SellerAccountLike = {
  createdAt: Date;
  defaultDisplayCurrencyCode: string;
  id: string;
  listingEligibilityNote: string | null;
  listingEligibilitySource: PrismaSellerEligibilitySource | null;
  listingEligibilityStatus: PrismaSellerEligibilityStatus;
  organizationId: string;
  status: "active" | "suspended" | "closed";
  updatedAt: Date;
};

type OpenClawAuthorizationSessionRecord = {
  authorizedAt: Date | null;
  authorizedByUserId: string | null;
  browserTokenHash: string;
  cancelledAt: Date | null;
  createdAt: Date;
  exchangeCodeHash: string;
  expiredAt: Date | null;
  expiresAt: Date;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
  organizationId: string | null;
  proposedWorkspaceName: string | null;
  proposedWorkspaceSlug: string | null;
  redeemedAt: Date | null;
  rejectedAt: Date | null;
  status: "authorized" | "cancelled" | "expired" | "pending" | "redeemed" | "rejected";
  updatedAt: Date;
};
