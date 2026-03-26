import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/client";
import type {
  SellerAccountRecord,
  SellerAccountRepository,
  SellerEligibilitySource,
  SellerEligibilityStatus,
  SellerStatus
} from "./domain";

export class PrismaSellerAccountRepository implements SellerAccountRepository {
  constructor(private readonly database: PrismaClient) {}

  async createIfMissing(record: SellerAccountRecord): Promise<SellerAccountRecord> {
    const created = await this.database.sellerAccount.upsert({
      create: {
        createdAt: record.createdAt,
        defaultDisplayCurrencyCode: record.defaultDisplayCurrencyCode,
        id: record.id,
        listingEligibilityNote: record.listingEligibilityNote,
        listingEligibilitySource: record.listingEligibilitySource,
        listingEligibilityStatus: record.listingEligibilityStatus,
        organizationId: record.organizationId,
        status: record.status,
        updatedAt: record.updatedAt
      },
      update: {},
      where: {
        organizationId: record.organizationId
      }
    });

    return mapSellerAccountModel(created);
  }

  async findByOrganizationId(organizationId: string): Promise<SellerAccountRecord | null> {
    const sellerAccount = await this.database.sellerAccount.findUnique({
      where: {
        organizationId
      }
    });

    return sellerAccount ? mapSellerAccountModel(sellerAccount) : null;
  }

  async findBySellerAccountId(sellerAccountId: string): Promise<SellerAccountRecord | null> {
    const sellerAccount = await this.database.sellerAccount.findUnique({
      where: {
        id: sellerAccountId
      }
    });

    return sellerAccount ? mapSellerAccountModel(sellerAccount) : null;
  }

  async listByOrganizationIds(organizationIds: string[]): Promise<SellerAccountRecord[]> {
    if (organizationIds.length === 0) {
      return [];
    }

    const sellerAccounts = await this.database.sellerAccount.findMany({
      orderBy: {
        createdAt: "asc"
      },
      where: {
        organizationId: {
          in: organizationIds
        }
      }
    });

    return sellerAccounts.map(mapSellerAccountModel);
  }

  async updateEligibility({
    sellerAccountId,
    listingEligibilityStatus,
    listingEligibilitySource,
    listingEligibilityNote,
    updatedAt
  }: UpdateEligibilityInput): Promise<SellerAccountRecord> {
    const updatedSellerAccount = await this.database.sellerAccount.update({
      data: {
        listingEligibilityNote,
        listingEligibilitySource,
        listingEligibilityStatus,
        updatedAt
      },
      where: {
        id: sellerAccountId
      }
    });

    return mapSellerAccountModel(updatedSellerAccount);
  }

  async createAuditEvent(input: CreateAuditEventInput) {
    await this.database.auditEvent.create({
      data: {
        action: input.action,
        actorApiKeyId: input.actorApiKeyId,
        actorType: input.actorType,
        actorUserId: input.actorUserId,
        createdAt: input.createdAt,
        entityId: input.entityId,
        entityTable: input.entityTable,
        id: input.id,
        metadata: input.metadata as Prisma.InputJsonValue,
        note: input.note,
        sellerAccountId: input.sellerAccountId
      }
    });
  }
}

export const sellerAccountRepository = new PrismaSellerAccountRepository(prisma);

function mapSellerAccountModel(record: SellerAccountModel): SellerAccountRecord {
  return {
    createdAt: record.createdAt,
    defaultDisplayCurrencyCode: record.defaultDisplayCurrencyCode,
    id: record.id,
    listingEligibilityNote: record.listingEligibilityNote,
    listingEligibilitySource: toSellerEligibilitySource(record.listingEligibilitySource),
    listingEligibilityStatus: toSellerEligibilityStatus(record.listingEligibilityStatus),
    organizationId: record.organizationId,
    status: toSellerStatus(record.status),
    updatedAt: record.updatedAt
  };
}

function toSellerEligibilitySource(value: string | null): SellerEligibilitySource {
  if (value === null || value === "manual_override" || value === "x_verification") {
    return value;
  }

  throw new Error(`Unknown seller eligibility source: ${value}`);
}

function toSellerEligibilityStatus(value: string): SellerEligibilityStatus {
  if (value === "pending" || value === "eligible" || value === "revoked" || value === "suspended") {
    return value;
  }

  throw new Error(`Unknown seller eligibility status: ${value}`);
}

function toSellerStatus(value: string): SellerStatus {
  if (value === "active" || value === "suspended" || value === "closed") {
    return value;
  }

  throw new Error(`Unknown seller status: ${value}`);
}

type UpdateEligibilityInput = {
  sellerAccountId: string;
  listingEligibilityStatus: SellerEligibilityStatus;
  listingEligibilitySource: SellerEligibilitySource;
  listingEligibilityNote: string | null;
  updatedAt: Date;
};

type CreateAuditEventInput = {
  id: string;
  entityTable: string;
  entityId: string;
  action: string;
  actorType: "user" | "api_key" | "system" | "admin";
  actorUserId: string | null;
  actorApiKeyId: string | null;
  sellerAccountId: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

type SellerAccountModel = {
  createdAt: Date;
  defaultDisplayCurrencyCode: string;
  id: string;
  listingEligibilityNote: string | null;
  listingEligibilitySource: string | null;
  listingEligibilityStatus: string;
  organizationId: string;
  status: string;
  updatedAt: Date;
};
