import type { Prisma, PrismaClient, sellerAccount as PrismaSellerAccountModel } from "@prisma/client";
import { prisma } from "../db/client";
import type {
  SellerAccountRecord,
  SellerAccountRepository,
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

  async applyDevelopmentEligibilityOverride({
    actorUserId,
    auditEventId,
    note,
    sellerAccountId,
    updatedAt
  }: ApplyDevelopmentEligibilityOverrideInput): Promise<SellerAccountRecord> {
    const updatedSellerAccount = await this.database.$transaction(async (transaction) => {
      const sellerAccount = await transaction.sellerAccount.findUnique({
        where: {
          id: sellerAccountId
        }
      });

      if (!sellerAccount) {
        throw new Error(`Missing seller account: ${sellerAccountId}`);
      }

      const updated = await transaction.sellerAccount.update({
        data: {
          listingEligibilityNote: note,
          listingEligibilitySource: "manual_override",
          listingEligibilityStatus: "eligible",
          updatedAt
        },
        where: {
          id: sellerAccountId
        }
      });

      await transaction.auditEvent.create({
        data: {
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
          } as Prisma.InputJsonValue,
          note,
          sellerAccountId
        }
      });

      return updated;
    });

    return mapSellerAccountModel(updatedSellerAccount);
  }
}

export const sellerAccountRepository = new PrismaSellerAccountRepository(prisma);

function mapSellerAccountModel(record: PrismaSellerAccountModel): SellerAccountRecord {
  return {
    createdAt: record.createdAt,
    defaultDisplayCurrencyCode: record.defaultDisplayCurrencyCode,
    id: record.id,
    listingEligibilityNote: record.listingEligibilityNote,
    listingEligibilitySource: record.listingEligibilitySource,
    listingEligibilityStatus: record.listingEligibilityStatus,
    organizationId: record.organizationId,
    status: toSellerStatus(record.status),
    updatedAt: record.updatedAt
  };
}

function toSellerStatus(value: string): SellerStatus {
  if (value === "active" || value === "suspended" || value === "closed") {
    return value;
  }

  throw new Error(`Unknown seller status: ${value}`);
}

type ApplyDevelopmentEligibilityOverrideInput = {
  actorUserId: string;
  auditEventId: string;
  note: string | null;
  sellerAccountId: string;
  updatedAt: Date;
};
