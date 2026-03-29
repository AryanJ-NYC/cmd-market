import type {
  Prisma,
  PrismaClient,
  listing as PrismaListingModel,
  listingMedia as PrismaListingMediaModel,
} from "@prisma/client";
import { prisma } from "../db/client";

export class DuplicateListingMediaAssetKeyError extends Error {
  constructor() {
    super("duplicate listing media asset key");
    this.name = "DuplicateListingMediaAssetKeyError";
  }
}

export class PrismaListingRepository implements ListingRepository {
  constructor(private readonly database: PrismaClient) {}

  async createDraftListing(input: CreateDraftListingInput): Promise<ListingRecord> {
    const listing = await this.database.$transaction(async (transaction) => {
      const created = await transaction.listing.create({
        data: {
          createdAt: input.createdAt,
          createdByApiKeyId: input.createdByApiKeyId,
          createdByUserId: input.createdByUserId,
          id: input.id,
          sellerAccountId: input.sellerAccountId,
          status: "draft",
          updatedAt: input.updatedAt,
          updatedByApiKeyId: input.updatedByApiKeyId,
          updatedByUserId: input.updatedByUserId
        },
        include: {
          media: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      });

      await transaction.auditEvent.create({
        data: {
          action: "listing.draft_created",
          actorApiKeyId: input.createdByApiKeyId,
          actorType: input.createdByApiKeyId ? "api_key" : "user",
          actorUserId: input.createdByUserId,
          createdAt: input.createdAt,
          entityId: input.id,
          entityTable: "listing",
          id: input.auditEventId,
          metadata: {
            status: "draft"
          } as Prisma.InputJsonValue,
          note: null,
          sellerAccountId: input.sellerAccountId
        }
      });

      return created;
    });

    return mapListingModel(listing);
  }

  async findListingById(listingId: string): Promise<ListingRecord | null> {
    const listing = await this.database.listing.findUnique({
      include: {
        media: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      where: {
        id: listingId
      }
    });

    return listing ? mapListingModel(listing) : null;
  }

  async attachMediaToDraftListing(input: AttachMediaToDraftListingInput): Promise<ListingRecord> {
    try {
      const listing = await this.database.$transaction(async (transaction) => {
        await transaction.listingMedia.createMany({
          data: input.media.map((item) => ({
            altText: item.altText,
            assetKey: item.assetKey,
            assetType: item.assetType,
            createdAt: item.createdAt,
            id: item.id,
            listingId: input.listingId,
            sortOrder: item.sortOrder
          }))
        });

        await transaction.listing.update({
          data: {
            updatedAt: input.updatedAt,
            updatedByApiKeyId: input.updatedByApiKeyId,
            updatedByUserId: input.updatedByUserId
          },
          where: {
            id: input.listingId
          }
        });

        await transaction.auditEvent.create({
          data: {
            action: "listing.media_attached",
            actorApiKeyId: input.updatedByApiKeyId,
            actorType: input.updatedByApiKeyId ? "api_key" : "user",
            actorUserId: input.updatedByUserId,
            createdAt: input.updatedAt,
            entityId: input.listingId,
            entityTable: "listing",
            id: input.auditEventId,
            metadata: {
              assetKeys: input.media.map((item) => item.assetKey)
            } as Prisma.InputJsonValue,
            note: null,
            sellerAccountId: input.sellerAccountId
          }
        });

        const updated = await transaction.listing.findUnique({
          include: {
            media: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          },
          where: {
            id: input.listingId
          }
        });

        if (!updated) {
          throw new Error(`Missing listing: ${input.listingId}`);
        }

        return updated;
      });

      return mapListingModel(listing);
    } catch (error) {
      if (isDuplicateListingMediaAssetKeyError(error)) {
        throw new DuplicateListingMediaAssetKeyError();
      }

      throw error;
    }
  }
}

export const listingRepository = new PrismaListingRepository(prisma);

function mapListingModel(
  record: PrismaListingModel & {
    media: PrismaListingMediaModel[];
  }
): ListingRecord {
  return {
    createdAt: record.createdAt,
    createdByApiKeyId: record.createdByApiKeyId,
    createdByUserId: record.createdByUserId,
    id: record.id,
    media: record.media.map(mapListingMediaModel),
    sellerAccountId: record.sellerAccountId,
    status: toListingStatus(record.status),
    updatedAt: record.updatedAt,
    updatedByApiKeyId: record.updatedByApiKeyId,
    updatedByUserId: record.updatedByUserId
  };
}

function mapListingMediaModel(record: PrismaListingMediaModel): ListingMediaRecord {
  return {
    altText: record.altText,
    assetKey: record.assetKey,
    assetType: record.assetType,
    createdAt: record.createdAt,
    id: record.id,
    sortOrder: record.sortOrder
  };
}

function toListingStatus(value: string): ListingStatus {
  if (value === "draft" || value === "published" || value === "reserved" || value === "sold" || value === "cancelled" || value === "expired") {
    return value;
  }

  throw new Error(`Unknown listing status: ${value}`);
}

function isDuplicateListingMediaAssetKeyError(error: unknown) {
  if (!isPrismaUniqueConstraintError(error)) {
    return false;
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return (
      includesConstraintTarget(target, ["listingId", "listing_id"]) &&
      includesConstraintTarget(target, ["assetKey", "asset_key"])
    );
  }

  return typeof target === "string" && target.includes("listing_media_listing_id_asset_key_key");
}

function includesConstraintTarget(target: string[], candidates: string[]) {
  return candidates.some((candidate) => target.includes(candidate));
}

function isPrismaUniqueConstraintError(
  error: unknown
): error is {
  code: "P2002";
  meta?: {
    target?: string | string[];
  };
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export type ListingRepository = {
  attachMediaToDraftListing(input: AttachMediaToDraftListingInput): Promise<ListingRecord>;
  createDraftListing(input: CreateDraftListingInput): Promise<ListingRecord>;
  findListingById(listingId: string): Promise<ListingRecord | null>;
};

export type ListingRecord = {
  createdAt: Date;
  createdByApiKeyId: string | null;
  createdByUserId: string | null;
  id: string;
  media: ListingMediaRecord[];
  sellerAccountId: string;
  status: ListingStatus;
  updatedAt: Date;
  updatedByApiKeyId: string | null;
  updatedByUserId: string | null;
};

export type ListingMediaRecord = {
  altText: string | null;
  assetKey: string;
  assetType: string;
  createdAt: Date;
  id: string;
  sortOrder: number;
};

type CreateDraftListingInput = {
  auditEventId: string;
  createdAt: Date;
  createdByApiKeyId: string | null;
  createdByUserId: string | null;
  id: string;
  sellerAccountId: string;
  updatedAt: Date;
  updatedByApiKeyId: string | null;
  updatedByUserId: string | null;
};

type AttachMediaToDraftListingInput = {
  auditEventId: string;
  listingId: string;
  media: Array<{
    altText: string | null;
    assetKey: string;
    assetType: string;
    createdAt: Date;
    id: string;
    sortOrder: number;
  }>;
  sellerAccountId: string;
  updatedAt: Date;
  updatedByApiKeyId: string | null;
  updatedByUserId: string | null;
};

type ListingStatus = "draft" | "published" | "reserved" | "sold" | "cancelled" | "expired";
