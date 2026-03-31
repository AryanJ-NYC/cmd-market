import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    apikey: {
      delete: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    auditEvent: {
      create: vi.fn()
    },
    openClawAuthorizationSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("../db/client", () => ({
  prisma
}));

import { openClawAuthorizationSessionRepository } from "./openclaw-authorization-repository";

describe("openclaw authorization session repository", () => {
  beforeEach(() => {
    prisma.$transaction.mockReset();
    prisma.apikey.delete.mockReset();
    prisma.apikey.findFirst.mockReset();
    prisma.apikey.update.mockReset();
    prisma.auditEvent.create.mockReset();
    prisma.openClawAuthorizationSession.create.mockReset();
    prisma.openClawAuthorizationSession.findFirst.mockReset();
    prisma.openClawAuthorizationSession.update.mockReset();
  });

  it("creates an OpenClaw authorization session row", async () => {
    const record = createAuthorizationSessionRecord();
    prisma.openClawAuthorizationSession.create.mockResolvedValue(record);

    const created = await openClawAuthorizationSessionRepository.createSession(record);

    expect(prisma.openClawAuthorizationSession.create).toHaveBeenCalledWith({
      data: record
    });
    expect(created).toEqual(record);
  });

  it("finds an OpenClaw authorization session by id and exchange-code hash", async () => {
    const record = createAuthorizationSessionRecord({
      exchangeCodeHash: "exchange_hash",
      id: "auth_123"
    });
    prisma.openClawAuthorizationSession.findFirst.mockResolvedValue(record);

    const found = await openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash(
      "auth_123",
      "exchange_hash"
    );

    expect(prisma.openClawAuthorizationSession.findFirst).toHaveBeenCalledWith({
      where: {
        exchangeCodeHash: "exchange_hash",
        id: "auth_123"
      }
    });
    expect(found).toEqual(record);
  });

  it("finds an OpenClaw authorization session by browser-token hash", async () => {
    const record = createAuthorizationSessionRecord({
      browserTokenHash: "browser_hash",
      id: "auth_123"
    });
    prisma.openClawAuthorizationSession.findFirst.mockResolvedValue(record);

    const found = await openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash("browser_hash");

    expect(prisma.openClawAuthorizationSession.findFirst).toHaveBeenCalledWith({
      where: {
        browserTokenHash: "browser_hash"
      }
    });
    expect(found).toEqual(record);
  });

  it("marks an OpenClaw authorization session as authorized", async () => {
    const updatedRecord = createAuthorizationSessionRecord({
      authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
      authorizedByUserId: "user_123",
      organizationId: "org_123",
      status: "authorized"
    });
    prisma.openClawAuthorizationSession.update.mockResolvedValue(updatedRecord);

    const authorized = await openClawAuthorizationSessionRepository.markAuthorized({
      authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
      authorizedByUserId: "user_123",
      id: "auth_123",
      organizationId: "org_123"
    });

    expect(prisma.openClawAuthorizationSession.update).toHaveBeenCalledWith({
      data: {
        authorizedAt: new Date("2026-03-31T03:10:00.000Z"),
        authorizedByUserId: "user_123",
        organizationId: "org_123",
        status: "authorized",
        updatedAt: new Date("2026-03-31T03:10:00.000Z")
      },
      where: {
        id: "auth_123"
      }
    });
    expect(authorized).toEqual(updatedRecord);
  });

  it("marks an OpenClaw authorization session as rejected", async () => {
    const updatedRecord = createAuthorizationSessionRecord({
      rejectedAt: new Date("2026-03-31T03:10:00.000Z"),
      status: "rejected"
    });
    prisma.openClawAuthorizationSession.update.mockResolvedValue(updatedRecord);

    const rejected = await openClawAuthorizationSessionRepository.markRejected({
      id: "auth_123",
      rejectedAt: new Date("2026-03-31T03:10:00.000Z")
    });

    expect(prisma.openClawAuthorizationSession.update).toHaveBeenCalledWith({
      data: {
        rejectedAt: new Date("2026-03-31T03:10:00.000Z"),
        status: "rejected",
        updatedAt: new Date("2026-03-31T03:10:00.000Z")
      },
      where: {
        id: "auth_123"
      }
    });
    expect(rejected).toEqual(updatedRecord);
  });

  it("writes OpenClaw authorization audit events", async () => {
    const record = createAuditEventRecord();
    prisma.auditEvent.create.mockResolvedValue(record);

    const created = await openClawAuthorizationSessionRepository.createAuditEvent(record);

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: record
    });
    expect(created).toEqual(record);
  });

  it("atomically redeems a session while promoting the replacement api key", async () => {
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<void>) => callback(prisma));

    await openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation({
      auditEvent: createAuditEventRecord({
        action: "openclaw_authorization.redeemed",
        actorType: "system",
        actorUserId: null,
        metadata: {
          newApiKeyId: "key_new",
          organizationId: "org_123",
          replacedApiKeyId: "key_existing",
          sessionStatus: "redeemed"
        },
        note: "OpenClaw authorization session was redeemed into a seller API key."
      }),
      newApiKeyId: "key_new",
      previousApiKeyId: "key_existing",
      redeemedAt: new Date("2026-03-31T03:11:00.000Z"),
      sessionId: "auth_123"
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.apikey.delete).toHaveBeenCalledWith({
      where: {
        id: "key_existing"
      }
    });
    expect(prisma.apikey.update).toHaveBeenCalledWith({
      data: {
        configId: "openclaw"
      },
      where: {
        id: "key_new"
      }
    });
    expect(prisma.openClawAuthorizationSession.update).toHaveBeenCalledWith({
      data: {
        redeemedAt: new Date("2026-03-31T03:11:00.000Z"),
        status: "redeemed",
        updatedAt: new Date("2026-03-31T03:11:00.000Z")
      },
      where: {
        id: "auth_123"
      }
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: createAuditEventRecord({
        action: "openclaw_authorization.redeemed",
        actorType: "system",
        actorUserId: null,
        metadata: {
          newApiKeyId: "key_new",
          organizationId: "org_123",
          replacedApiKeyId: "key_existing",
          sessionStatus: "redeemed"
        },
        note: "OpenClaw authorization session was redeemed into a seller API key."
      })
    });
  });
});

function createAuthorizationSessionRecord(overrides: Partial<AuthorizationSessionRecord> = {}) {
  return {
    authorizedAt: null,
    authorizedByUserId: null,
    browserTokenHash: "browser_hash",
    cancelledAt: null,
    createdAt: new Date("2026-03-31T03:05:00.000Z"),
    exchangeCodeHash: "exchange_hash",
    expiredAt: null,
    expiresAt: new Date("2026-03-31T03:20:00.000Z"),
    failureCode: null,
    failureMessage: null,
    id: "auth_123",
    organizationId: null,
    redeemedAt: null,
    rejectedAt: null,
    status: "pending",
    updatedAt: new Date("2026-03-31T03:05:00.000Z"),
    ...overrides
  } satisfies AuthorizationSessionRecord;
}

type AuthorizationSessionRecord = {
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
  redeemedAt: Date | null;
  rejectedAt: Date | null;
  status: "authorized" | "cancelled" | "expired" | "pending" | "redeemed" | "rejected";
  updatedAt: Date;
};

function createAuditEventRecord(overrides: Partial<AuditEventRecord> = {}) {
  return {
    action: "openclaw_authorization.approved",
    actorApiKeyId: null,
    actorType: "user",
    actorUserId: "user_123",
    createdAt: new Date("2026-03-31T03:10:00.000Z"),
    entityId: "auth_123",
    entityTable: "openclaw_authorization_session",
    id: "audit_123",
    metadata: {
      organizationId: "org_123",
      sessionStatus: "authorized"
    },
    note: "Seller approved OpenClaw workspace access.",
    sellerAccountId: "seller_123",
    ...overrides
  } satisfies AuditEventRecord;
}

type AuditEventRecord = {
  action: string;
  actorApiKeyId: string | null;
  actorType: "admin" | "api_key" | "system" | "user";
  actorUserId: string | null;
  createdAt: Date;
  entityId: string;
  entityTable: string;
  id: string;
  metadata: Record<string, unknown>;
  note: string | null;
  sellerAccountId: string | null;
};
