import { describe, expect, it } from "vitest";
import {
  applyDevelopmentEligibilityOverride,
  ensureSellerAccountForOrganization,
  getSellerPublishability,
  resolveSellerContextFromApiKey,
  resolveSellerContextFromSession,
  type SellerAccountRecord,
  type SellerAccountRepository
} from "./domain";

describe("seller domain", () => {
  it("creates exactly one seller account per organization", async () => {
    const repo = createSellerAccountRepository();

    const first = await ensureSellerAccountForOrganization({
      organizationId: "org_123",
      repository: repo,
      createId: () => "seller_123",
      now: fixedNow()
    });

    const second = await ensureSellerAccountForOrganization({
      organizationId: "org_123",
      repository: repo,
      createId: () => "seller_456",
      now: fixedNow()
    });

    expect(first.id).toBe("seller_123");
    expect(second.id).toBe("seller_123");
    expect(repo.records).toHaveLength(1);
    expect(repo.records[0]?.organizationId).toBe("org_123");
  });

  it("resolves seller context from an active browser organization", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    ]);

    const result = await resolveSellerContextFromSession({
      session: {
        userId: "user_123",
        activeOrganizationId: "org_123"
      },
      membershipOrganizationIds: ["org_123"],
      repository: repo
    });

    expect(result).toEqual({
      ok: true,
      context: {
        actorType: "user",
        actorApiKeyId: null,
        actorUserId: "user_123",
        eligibilitySource: null,
        eligibilityStatus: "pending",
        organizationId: "org_123",
        sellerAccountId: "seller_123"
      }
    });
  });

  it("requires an active organization for browser seller requests", async () => {
    const repo = createSellerAccountRepository();

    const result = await resolveSellerContextFromSession({
      session: {
        userId: "user_123",
        activeOrganizationId: null
      },
      membershipOrganizationIds: ["org_123"],
      repository: repo
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "organization_context_required",
      message: "An active seller workspace is required for this request."
    });
  });

  it("resolves seller context from an organization-owned api key", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123",
        listingEligibilityStatus: "eligible",
        listingEligibilitySource: "manual_override",
        listingEligibilityNote: "approved"
      })
    ]);

    const result = await resolveSellerContextFromApiKey({
      apiKey: {
        id: "key_123",
        organizationId: "org_123"
      },
      repository: repo
    });

    expect(result).toEqual({
      ok: true,
      context: {
        actorType: "api_key",
        actorApiKeyId: "key_123",
        actorUserId: null,
        eligibilitySource: "manual_override",
        eligibilityStatus: "eligible",
        organizationId: "org_123",
        sellerAccountId: "seller_123"
      }
    });
  });

  it("blocks publishability for ineligible sellers", () => {
    const result = getSellerPublishability(
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123",
        listingEligibilityStatus: "pending"
      })
    );

    expect(result).toEqual({
      publishable: false,
      issues: [
        {
          code: "seller_not_eligible",
          message: "Seller workspace is not eligible to publish listings."
        }
      ]
    });
  });

  it("allows development overrides for allowlisted sellers", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    ]);

    const result = await applyDevelopmentEligibilityOverride({
      auditEventId: "audit_123",
      actorUserId: "user_123",
      actorUserEmail: "seller@example.com",
      allowlistedEmails: ["seller@example.com"],
      developmentOverrideEnabled: true,
      note: "approved for development",
      now: fixedNow(),
      sellerAccountId: "seller_123",
      repository: repo
    });

    expect(result.listingEligibilityStatus).toBe("eligible");
    expect(result.listingEligibilitySource).toBe("manual_override");
    expect(result.listingEligibilityNote).toBe("approved for development");
    expect(repo.auditEvents).toEqual([
      {
        action: "seller_account.manual_override_approved",
        actorApiKeyId: null,
        actorType: "user",
        actorUserId: "user_123",
        createdAt: fixedNow(),
        entityId: "seller_123",
        entityTable: "seller_account",
        id: "audit_123",
        metadata: {
          note: "approved for development"
        },
        sellerAccountId: "seller_123"
      }
    ]);
  });

  it("rejects development overrides for non-allowlisted sellers", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    ]);

    await expect(
      applyDevelopmentEligibilityOverride({
        actorUserId: "user_123",
        actorUserEmail: "seller@example.com",
        allowlistedEmails: ["other@example.com"],
        developmentOverrideEnabled: true,
        note: null,
        now: fixedNow(),
        sellerAccountId: "seller_123",
        repository: repo,
        auditEventId: "audit_123"
      })
    ).rejects.toMatchObject({
      code: "forbidden",
      status: 403
    });

    expect(repo.records[0]?.listingEligibilityStatus).toBe("pending");
    expect(repo.auditEvents).toHaveLength(0);
  });

  it("rejects development overrides when the environment gate is disabled", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    ]);
    await expect(
      applyDevelopmentEligibilityOverride({
        auditEventId: "audit_123",
        actorUserId: "user_123",
        actorUserEmail: "seller@example.com",
        allowlistedEmails: ["seller@example.com"],
        developmentOverrideEnabled: false,
        note: "approved for development",
        now: fixedNow(),
        sellerAccountId: "seller_123",
        repository: repo
      })
    ).rejects.toMatchObject({
      code: "forbidden",
      message: "Development seller override is unavailable in production.",
      status: 403
    });

    expect(repo.records[0]?.listingEligibilityStatus).toBe("pending");
    expect(repo.auditEvents).toHaveLength(0);
  });

  it("leaves seller eligibility unchanged when the repository override write fails", async () => {
    const repo = createSellerAccountRepository([
      createSellerAccount({
        id: "seller_123",
        organizationId: "org_123"
      })
    ]);

    repo.overrideError = new Error("audit write failed");

    await expect(
      applyDevelopmentEligibilityOverride({
        auditEventId: "audit_123",
        actorUserId: "user_123",
        actorUserEmail: "seller@example.com",
        allowlistedEmails: ["seller@example.com"],
        developmentOverrideEnabled: true,
        note: "approved for development",
        now: fixedNow(),
        sellerAccountId: "seller_123",
        repository: repo
      })
    ).rejects.toThrow("audit write failed");

    expect(repo.records[0]?.listingEligibilityStatus).toBe("pending");
    expect(repo.auditEvents).toHaveLength(0);
  });
});

function createSellerAccountRepository(
  initialRecords: SellerAccountRecord[] = []
): SellerAccountRepository & {
  auditEvents: AuditEventRecord[];
  overrideError: Error | null;
  records: SellerAccountRecord[];
} {
  const records = [...initialRecords];
  const auditEvents: AuditEventRecord[] = [];

  return {
    auditEvents,
    overrideError: null,
    records,
    async createIfMissing(record) {
      const existingRecord = records.find((entry) => entry.organizationId === record.organizationId);

      if (existingRecord) {
        return existingRecord;
      }

      records.push(record);
      return record;
    },
    async findByOrganizationId(organizationId) {
      return records.find((record) => record.organizationId === organizationId) ?? null;
    },
    async findBySellerAccountId(sellerAccountId) {
      return records.find((record) => record.id === sellerAccountId) ?? null;
    },
    async applyDevelopmentEligibilityOverride({
      actorUserId,
      auditEventId,
      note,
      sellerAccountId,
      updatedAt
    }) {
      if (this.overrideError) {
        throw this.overrideError;
      }

      const record = records.find((entry) => entry.id === sellerAccountId);

      if (!record) {
        return null;
      }

      record.listingEligibilityStatus = "eligible";
      record.listingEligibilitySource = "manual_override";
      record.listingEligibilityNote = note;
      record.updatedAt = updatedAt;
      auditEvents.push({
        action: "seller_account.manual_override_approved",
        actorApiKeyId: null,
        actorType: "user",
        actorUserId,
        createdAt: updatedAt,
        entityId: sellerAccountId,
        entityTable: "seller_account",
        id: auditEventId,
        metadata: {
          note
        },
        sellerAccountId
      });

      return record;
    }
  };
}

function createSellerAccount(
  overrides: Partial<SellerAccountRecord> & Pick<SellerAccountRecord, "id" | "organizationId">
): SellerAccountRecord {
  return {
    id: overrides.id,
    organizationId: overrides.organizationId,
    status: overrides.status ?? "active",
    listingEligibilityStatus: overrides.listingEligibilityStatus ?? "pending",
    listingEligibilitySource: overrides.listingEligibilitySource ?? null,
    listingEligibilityNote: overrides.listingEligibilityNote ?? null,
    defaultDisplayCurrencyCode: overrides.defaultDisplayCurrencyCode ?? "USD",
    createdAt: overrides.createdAt ?? fixedNow(),
    updatedAt: overrides.updatedAt ?? fixedNow()
  };
}

function fixedNow() {
  return new Date("2026-03-25T18:00:00.000Z");
}

type AuditEventRecord = {
  id: string;
  entityTable: string;
  entityId: string;
  action: string;
  actorType: "user" | "api_key" | "system" | "admin";
  actorUserId: string | null;
  actorApiKeyId: string | null;
  sellerAccountId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};
