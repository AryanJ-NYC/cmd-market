import type {
  apikey as PrismaApiKeyModel,
  auditEvent as PrismaAuditEventModel,
  openClawAuthorizationSession as PrismaOpenClawAuthorizationSessionModel,
  Prisma,
  PrismaClient
} from "@prisma/client";
import { prisma } from "../db/client";
import { OPENCLAW_API_KEY_CONFIG_ID } from "./workspace";

export class PrismaOpenClawAuthorizationSessionRepository {
  constructor(private readonly database: PrismaClient) {}

  async createSession(record: OpenClawAuthorizationSessionRecord) {
    const created = await this.database.openClawAuthorizationSession.create({
      data: {
        authorizedAt: record.authorizedAt,
        authorizedByUserId: record.authorizedByUserId,
        browserTokenHash: record.browserTokenHash,
        cancelledAt: record.cancelledAt,
        codeChallenge: record.codeChallenge,
        codeChallengeMethod: record.codeChallengeMethod,
        createdAt: record.createdAt,
        expiredAt: record.expiredAt,
        expiresAt: record.expiresAt,
        failureCode: record.failureCode,
        failureMessage: record.failureMessage,
        id: record.id,
        organizationId: record.organizationId,
        proposedWorkspaceName: record.proposedWorkspaceName,
        proposedWorkspaceSlug: record.proposedWorkspaceSlug,
        redeemedAt: record.redeemedAt,
        rejectedAt: record.rejectedAt,
        status: record.status,
        updatedAt: record.updatedAt
      }
    });

    return mapOpenClawAuthorizationSessionModel(created);
  }

  async createAuditEvent(record: OpenClawAuthorizationAuditEventRecord) {
    const created = await this.database.auditEvent.create({
      data: {
        action: record.action,
        actorApiKeyId: record.actorApiKeyId,
        actorType: record.actorType,
        actorUserId: record.actorUserId,
        createdAt: record.createdAt,
        entityId: record.entityId,
        entityTable: record.entityTable,
        id: record.id,
        metadata: record.metadata as Prisma.InputJsonValue,
        note: record.note,
        sellerAccountId: record.sellerAccountId
      }
    });

    return mapAuditEventModel(created);
  }

  async deleteApiKeyById(id: string) {
    await this.database.apikey.delete({
      where: {
        id
      }
    });
  }

  async findApiKeyByOrganizationId(organizationId: string) {
    const apiKey = await this.database.apikey.findFirst({
      where: {
        configId: OPENCLAW_API_KEY_CONFIG_ID,
        referenceId: organizationId
      }
    });

    return apiKey ? mapApiKeyModel(apiKey) : null;
  }

  async findSessionByBrowserTokenHash(browserTokenHash: string) {
    const session = await this.database.openClawAuthorizationSession.findFirst({
      where: {
        browserTokenHash
      }
    });

    return session ? mapOpenClawAuthorizationSessionModel(session) : null;
  }

  async findSessionById(id: string) {
    const session = await this.database.openClawAuthorizationSession.findFirst({
      where: {
        id
      }
    });

    return session ? mapOpenClawAuthorizationSessionModel(session) : null;
  }

  async markAuthorized(input: MarkAuthorizedInput) {
    return this.applyPendingTransition({
      at: input.authorizedAt,
      data: {
        authorizedAt: input.authorizedAt,
        authorizedByUserId: input.authorizedByUserId,
        organizationId: input.organizationId,
        status: "authorized",
        updatedAt: input.authorizedAt
      },
      id: input.id
    });
  }

  async markCancelled(input: MarkCancelledInput) {
    return this.applyPendingTransition({
      at: input.cancelledAt,
      data: {
        cancelledAt: input.cancelledAt,
        status: "cancelled",
        updatedAt: input.cancelledAt
      },
      id: input.id
    });
  }

  async markRejected(input: MarkRejectedInput) {
    return this.applyPendingTransition({
      at: input.rejectedAt,
      data: {
        rejectedAt: input.rejectedAt,
        status: "rejected",
        updatedAt: input.rejectedAt
      },
      id: input.id
    });
  }

  async markExpired(input: MarkExpiredInput) {
    const updated = await this.database.$transaction(async (transaction) => {
      await transaction.openClawAuthorizationSession.updateMany({
        data: {
          expiredAt: input.expiredAt,
          failureCode: input.failureCode,
          failureMessage: input.failureMessage,
          status: "expired",
          updatedAt: input.expiredAt
        },
        where: {
          id: input.id,
          status: {
            in: ["authorized", "pending"]
          }
        }
      });

      const current = await transaction.openClawAuthorizationSession.findFirst({
        where: {
          id: input.id
        }
      });

      if (!current) {
        throw new Error(`OpenClaw authorization session ${input.id} was not found.`);
      }

      return current;
    });

    return mapOpenClawAuthorizationSessionModel(updated);
  }

  async redeemSessionWithApiKeyRotation(input: RedeemSessionWithApiKeyRotationInput) {
    return this.database.$transaction(async (transaction) => {
      const redeemResult = await transaction.openClawAuthorizationSession.updateMany({
        data: {
          redeemedAt: input.redeemedAt,
          status: "redeemed",
          updatedAt: input.redeemedAt
        },
        where: {
          expiresAt: {
            gt: input.redeemedAt
          },
          id: input.sessionId,
          status: "authorized"
        }
      });

      const current = await transaction.openClawAuthorizationSession.findFirst({
        where: {
          id: input.sessionId
        }
      });

      if (!current) {
        throw new Error(`OpenClaw authorization session ${input.sessionId} was not found.`);
      }

      if (redeemResult.count === 0) {
        return {
          applied: false as const,
          session: mapOpenClawAuthorizationSessionModel(current)
        };
      }

      if (input.previousApiKeyId) {
        await transaction.apikey.delete({
          where: {
            id: input.previousApiKeyId
          }
        });
      }

      await transaction.apikey.update({
        data: {
          configId: OPENCLAW_API_KEY_CONFIG_ID
        },
        where: {
          id: input.newApiKeyId
        }
      });

      await transaction.auditEvent.create({
        data: {
          action: input.auditEvent.action,
          actorApiKeyId: input.auditEvent.actorApiKeyId,
          actorType: input.auditEvent.actorType,
          actorUserId: input.auditEvent.actorUserId,
          createdAt: input.auditEvent.createdAt,
          entityId: input.auditEvent.entityId,
          entityTable: input.auditEvent.entityTable,
          id: input.auditEvent.id,
          metadata: input.auditEvent.metadata as Prisma.InputJsonValue,
          note: input.auditEvent.note,
          sellerAccountId: input.auditEvent.sellerAccountId
        }
      });

      return {
        applied: true as const,
        session: mapOpenClawAuthorizationSessionModel(current)
      };
    });
  }

  private async applyPendingTransition(input: ApplyPendingTransitionInput) {
    return this.database.$transaction(async (transaction) => {
      const transition = await transaction.openClawAuthorizationSession.updateMany({
        data: input.data,
        where: {
          expiresAt: {
            gt: input.at
          },
          id: input.id,
          status: "pending"
        }
      });

      const current = await transaction.openClawAuthorizationSession.findFirst({
        where: {
          id: input.id
        }
      });

      if (!current) {
        throw new Error(`OpenClaw authorization session ${input.id} was not found.`);
      }

      return {
        applied: transition.count > 0,
        session: mapOpenClawAuthorizationSessionModel(current)
      };
    });
  }
}

export const openClawAuthorizationSessionRepository = new PrismaOpenClawAuthorizationSessionRepository(prisma);

function mapApiKeyModel(record: PrismaApiKeyModel): OpenClawApiKeyRecord {
  return {
    configId: record.configId,
    id: record.id,
    organizationId: record.referenceId
  };
}

function mapAuditEventModel(record: PrismaAuditEventModel): OpenClawAuthorizationAuditEventRecord {
  return {
    action: record.action,
    actorApiKeyId: record.actorApiKeyId,
    actorType: record.actorType as OpenClawAuthorizationAuditEventRecord["actorType"],
    actorUserId: record.actorUserId,
    createdAt: record.createdAt,
    entityId: record.entityId,
    entityTable: record.entityTable,
    id: record.id,
    metadata: record.metadata as Record<string, unknown>,
    note: record.note,
    sellerAccountId: record.sellerAccountId
  };
}

function mapOpenClawAuthorizationSessionModel(
  record: PrismaOpenClawAuthorizationSessionModel
): OpenClawAuthorizationSessionRecord {
  return {
    authorizedAt: record.authorizedAt,
    authorizedByUserId: record.authorizedByUserId,
    browserTokenHash: record.browserTokenHash,
    cancelledAt: record.cancelledAt,
    codeChallenge: record.codeChallenge,
    codeChallengeMethod: record.codeChallengeMethod as OpenClawAuthorizationSessionRecord["codeChallengeMethod"],
    createdAt: record.createdAt,
    expiredAt: record.expiredAt,
    expiresAt: record.expiresAt,
    failureCode: record.failureCode,
    failureMessage: record.failureMessage,
    id: record.id,
    organizationId: record.organizationId,
    proposedWorkspaceName: record.proposedWorkspaceName,
    proposedWorkspaceSlug: record.proposedWorkspaceSlug,
    redeemedAt: record.redeemedAt,
    rejectedAt: record.rejectedAt,
    status: record.status,
    updatedAt: record.updatedAt
  };
}

export type OpenClawAuthorizationSessionRecord = {
  authorizedAt: Date | null;
  authorizedByUserId: string | null;
  browserTokenHash: string;
  cancelledAt: Date | null;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  createdAt: Date;
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

export type OpenClawApiKeyRecord = {
  configId: string;
  id: string;
  organizationId: string;
};

export type OpenClawAuthorizationAuditEventRecord = {
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

export type OpenClawAuthorizationSessionMutationResult = {
  applied: boolean;
  session: OpenClawAuthorizationSessionRecord;
};

type MarkExpiredInput = {
  expiredAt: Date;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
};

type MarkCancelledInput = {
  cancelledAt: Date;
  id: string;
};

type MarkAuthorizedInput = {
  authorizedAt: Date;
  authorizedByUserId: string;
  id: string;
  organizationId: string;
};

type MarkRejectedInput = {
  id: string;
  rejectedAt: Date;
};

type RedeemSessionWithApiKeyRotationInput = {
  auditEvent: OpenClawAuthorizationAuditEventRecord;
  newApiKeyId: string;
  previousApiKeyId: string | null;
  redeemedAt: Date;
  sessionId: string;
};

type ApplyPendingTransitionInput = {
  at: Date;
  data: Prisma.openClawAuthorizationSessionUncheckedUpdateManyInput;
  id: string;
};
