import { Prisma } from "@prisma/client";
import type {
  AttributeValueType as PrismaAttributeValueType,
  PrismaClient,
  listingAttributeValue as PrismaListingAttributeValueModel,
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
          categoryId: input.categoryId,
          conditionCode: input.conditionCode,
          createdAt: input.createdAt,
          createdByApiKeyId: input.createdByApiKeyId,
          createdByUserId: input.createdByUserId,
          description: input.description,
          displayCurrencyCode: input.displayCurrencyCode,
          id: input.id,
          quantityAvailable: input.quantityAvailable,
          sellerAccountId: input.sellerAccountId,
          status: "draft",
          title: input.title,
          unitPriceMinor: input.unitPriceMinor,
          updatedAt: input.updatedAt,
          updatedByApiKeyId: input.updatedByApiKeyId,
          updatedByUserId: input.updatedByUserId,
        },
        include: listingInclude,
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
            categoryId: input.categoryId ?? null,
            status: "draft",
          } as Prisma.InputJsonValue,
          note: null,
          sellerAccountId: input.sellerAccountId,
        },
      });

      return created;
    });

    return mapListingModel(listing);
  }

  async findListingById(listingId: string): Promise<ListingRecord | null> {
    const listing = await this.database.listing.findUnique({
      include: listingInclude,
      where: {
        id: listingId,
      },
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
            sortOrder: item.sortOrder,
          })),
        });

        await transaction.listing.update({
          data: {
            updatedAt: input.updatedAt,
            updatedByApiKeyId: input.updatedByApiKeyId,
            updatedByUserId: input.updatedByUserId,
          },
          where: {
            id: input.listingId,
          },
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
              assetKeys: input.media.map((item) => item.assetKey),
            } as Prisma.InputJsonValue,
            note: null,
            sellerAccountId: input.sellerAccountId,
          },
        });

        const updated = await transaction.listing.findUnique({
          include: listingInclude,
          where: {
            id: input.listingId,
          },
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

  async updateDraftListing(input: UpdateDraftListingInput): Promise<ListingRecord> {
    const listing = await this.database.$transaction(async (transaction) => {
      await transaction.listing.update({
        data: {
          categoryId: input.categoryId,
          conditionCode: input.conditionCode,
          description: input.description,
          displayCurrencyCode: input.displayCurrencyCode,
          quantityAvailable: input.quantityAvailable,
          title: input.title,
          unitPriceMinor: input.unitPriceMinor,
          updatedAt: input.updatedAt,
          updatedByApiKeyId: input.updatedByApiKeyId,
          updatedByUserId: input.updatedByUserId,
        },
        where: {
          id: input.listingId,
        },
      });

      if (input.removeCategoryAttributeIds.length > 0) {
        await transaction.listingAttributeValue.deleteMany({
          where: {
            categoryAttributeId: {
              in: input.removeCategoryAttributeIds,
            },
            listingId: input.listingId,
          },
        });
      }

      await Promise.all(
        input.attributes.map((attribute) =>
          transaction.listingAttributeValue.upsert({
            create: {
              categoryAttributeId: attribute.categoryAttributeId,
              id: attribute.id,
              listingId: input.listingId,
              normalizedText: attribute.normalizedText,
              valueBoolean: attribute.valueBoolean,
              valueJson: toNullableJsonValue(attribute.valueJson),
              valueNumber: attribute.valueNumber,
              valueText: attribute.valueText,
            },
            update: {
              normalizedText: attribute.normalizedText,
              valueBoolean: attribute.valueBoolean,
              valueJson: toNullableJsonValue(attribute.valueJson),
              valueNumber: attribute.valueNumber,
              valueText: attribute.valueText,
            },
            where: {
              listingId_categoryAttributeId: {
                categoryAttributeId: attribute.categoryAttributeId,
                listingId: input.listingId,
              },
            },
          }),
        ),
      );

      await transaction.auditEvent.create({
        data: {
          action: "listing.updated",
          actorApiKeyId: input.updatedByApiKeyId,
          actorType: input.updatedByApiKeyId ? "api_key" : "user",
          actorUserId: input.updatedByUserId,
          createdAt: input.updatedAt,
          entityId: input.listingId,
          entityTable: "listing",
          id: input.auditEventId,
          metadata: {
            attributeKeys: input.attributes.map((attribute) => attribute.key),
            categoryId: input.categoryId,
          } as Prisma.InputJsonValue,
          note: null,
          sellerAccountId: input.sellerAccountId,
        },
      });

      const updated = await transaction.listing.findUnique({
        include: listingInclude,
        where: {
          id: input.listingId,
        },
      });

      if (!updated) {
        throw new Error(`Missing listing: ${input.listingId}`);
      }

      return updated;
    });

    return mapListingModel(listing);
  }

  async publishDraftListing(input: PublishDraftListingInput): Promise<ListingRecord> {
    const listing = await this.database.$transaction(async (transaction) => {
      await transaction.listing.update({
        data: {
          publishedAt: input.publishedAt,
          status: "published",
          updatedAt: input.updatedAt,
          updatedByApiKeyId: input.updatedByApiKeyId,
          updatedByUserId: input.updatedByUserId,
        },
        where: {
          id: input.listingId,
        },
      });

      await transaction.auditEvent.create({
        data: {
          action: "listing.published",
          actorApiKeyId: input.updatedByApiKeyId,
          actorType: input.updatedByApiKeyId ? "api_key" : "user",
          actorUserId: input.updatedByUserId,
          createdAt: input.updatedAt,
          entityId: input.listingId,
          entityTable: "listing",
          id: input.auditEventId,
          metadata: {
            publishedAt: input.publishedAt.toISOString(),
            status: "published",
          } as Prisma.InputJsonValue,
          note: null,
          sellerAccountId: input.sellerAccountId,
        },
      });

      const published = await transaction.listing.findUnique({
        include: listingInclude,
        where: {
          id: input.listingId,
        },
      });

      if (!published) {
        throw new Error(`Missing listing: ${input.listingId}`);
      }

      return published;
    });

    return mapListingModel(listing);
  }

  async listActiveCategories(): Promise<CategoryRecord[]> {
    const categories = await this.database.category.findMany({
      include: categoryInclude,
      orderBy: {
        sortOrder: "asc",
      },
      where: {
        isActive: true,
      },
    });

    return categories.map(mapCategoryModel);
  }

  async findCategoryById(categoryId: string): Promise<CategoryRecord | null> {
    const category = await this.database.category.findFirst({
      include: categoryInclude,
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    return category ? mapCategoryModel(category) : null;
  }

  async findCategoryBySlug(categorySlug: string): Promise<CategoryRecord | null> {
    const category = await this.database.category.findFirst({
      include: categoryInclude,
      where: {
        isActive: true,
        slug: categorySlug,
      },
    });

    return category ? mapCategoryModel(category) : null;
  }
}

export const listingRepository = new PrismaListingRepository(prisma);

const categoryInclude = {
  categoryAttributes: {
    include: {
      attributeDefinition: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.categoryInclude;

const listingInclude = {
  attributeValues: {
    include: {
      categoryAttribute: {
        include: {
          attributeDefinition: true,
        },
      },
    },
    orderBy: {
      categoryAttribute: {
        sortOrder: "asc",
      },
    },
  },
  category: {
    include: categoryInclude,
  },
  media: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  sellerAccount: {
    include: {
      organization: true,
    },
  },
} satisfies Prisma.listingInclude;

function mapListingModel(record: ListingModel): ListingRecord {
  return {
    attributes: record.attributeValues.map(mapListingAttributeValueModel),
    category: record.category ? mapCategoryModel(record.category) : null,
    closedAt: record.closedAt,
    conditionCode: record.conditionCode,
    createdAt: record.createdAt,
    createdByApiKeyId: record.createdByApiKeyId,
    createdByUserId: record.createdByUserId,
    description: record.description,
    displayCurrencyCode: record.displayCurrencyCode,
    id: record.id,
    media: record.media.map(mapListingMediaModel),
    publishedAt: record.publishedAt,
    quantityAvailable: record.quantityAvailable,
    seller: {
      displayName: record.sellerAccount.organization.name,
      id: record.sellerAccount.id,
      slug: record.sellerAccount.organization.slug,
    },
    sellerAccountId: record.sellerAccountId,
    status: record.status,
    title: record.title,
    unitPriceMinor: record.unitPriceMinor,
    updatedAt: record.updatedAt,
    updatedByApiKeyId: record.updatedByApiKeyId,
    updatedByUserId: record.updatedByUserId,
  };
}

function mapCategoryModel(record: CategoryModel): CategoryRecord {
  return {
    attributes: record.categoryAttributes.map(mapCategoryAttributeModel),
    description: record.description,
    id: record.id,
    name: record.name,
    slug: record.slug,
  };
}

function mapCategoryAttributeModel(record: CategoryAttributeModel): CategoryAttributeRecord {
  return {
    allowedValues: toAllowedValues(record.allowedValuesJson),
    id: record.id,
    isRequired: record.isRequired,
    key: record.attributeDefinition.key,
    label: record.attributeDefinition.label,
    valueType: record.attributeDefinition.valueType,
  };
}

function mapListingMediaModel(record: PrismaListingMediaModel): ListingMediaRecord {
  return {
    altText: record.altText,
    assetKey: record.assetKey,
    assetType: record.assetType,
    createdAt: record.createdAt,
    id: record.id,
    sortOrder: record.sortOrder,
  };
}

function mapListingAttributeValueModel(
  record: PrismaListingAttributeValueModel & {
    categoryAttribute: {
      attributeDefinition: {
        key: string;
        label: string;
        valueType: PrismaAttributeValueType;
      };
      id: string;
    };
  },
): ListingAttributeValueRecord {
  return {
    categoryAttributeId: record.categoryAttribute.id,
    key: record.categoryAttribute.attributeDefinition.key,
    label: record.categoryAttribute.attributeDefinition.label,
    value: getAttributeValue(record),
    valueType: record.categoryAttribute.attributeDefinition.valueType,
  };
}

function getAttributeValue(
  record: Pick<
    PrismaListingAttributeValueModel,
    "valueBoolean" | "valueJson" | "valueNumber" | "valueText"
  >,
): ListingAttributeValueRecord["value"] {
  if (record.valueText != null) {
    return record.valueText;
  }

  if (record.valueNumber != null) {
    return record.valueNumber;
  }

  if (record.valueBoolean != null) {
    return record.valueBoolean;
  }

  if (record.valueJson != null) {
    return record.valueJson as Record<string, unknown> | unknown[];
  }

  throw new Error("Listing attribute value is missing typed data.");
}

function toAllowedValues(value: Prisma.JsonValue | null): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.every((item) => typeof item === "string") ? value : null;
}

function toNullableJsonValue(value: Prisma.InputJsonValue | null) {
  return value === null ? Prisma.DbNull : value;
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
  error: unknown,
): error is {
  code: "P2002";
  meta?: {
    target?: string | string[];
  };
} {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

type CategoryModel = Prisma.categoryGetPayload<{
  include: typeof categoryInclude;
}>;

type CategoryAttributeModel = CategoryModel["categoryAttributes"][number];

type ListingModel = Prisma.listingGetPayload<{
  include: typeof listingInclude;
}>;

export type ListingRepository = {
  attachMediaToDraftListing(input: AttachMediaToDraftListingInput): Promise<ListingRecord>;
  createDraftListing(input: CreateDraftListingInput): Promise<ListingRecord>;
  findCategoryById(categoryId: string): Promise<CategoryRecord | null>;
  findCategoryBySlug(categorySlug: string): Promise<CategoryRecord | null>;
  findListingById(listingId: string): Promise<ListingRecord | null>;
  listActiveCategories(): Promise<CategoryRecord[]>;
  publishDraftListing(input: PublishDraftListingInput): Promise<ListingRecord>;
  updateDraftListing(input: UpdateDraftListingInput): Promise<ListingRecord>;
};

export type ListingRecord = {
  attributes: ListingAttributeValueRecord[];
  category: CategoryRecord | null;
  closedAt: Date | null;
  conditionCode: string | null;
  createdAt: Date;
  createdByApiKeyId: string | null;
  createdByUserId: string | null;
  description: string | null;
  displayCurrencyCode: string;
  id: string;
  media: ListingMediaRecord[];
  publishedAt: Date | null;
  quantityAvailable: number | null;
  seller: ListingSellerRecord;
  sellerAccountId: string;
  status: ListingStatus;
  title: string | null;
  unitPriceMinor: number | null;
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

export type CategoryRecord = {
  attributes: CategoryAttributeRecord[];
  description: string | null;
  id: string;
  name: string;
  slug: string;
};

export type CategoryAttributeRecord = {
  allowedValues: string[] | null;
  id: string;
  isRequired: boolean;
  key: string;
  label: string;
  valueType: AttributeValueType;
};

export type ListingAttributeValueRecord = {
  categoryAttributeId: string;
  key: string;
  label: string;
  value: boolean | number | string | Record<string, unknown> | unknown[];
  valueType: AttributeValueType;
};

type ListingSellerRecord = {
  displayName: string;
  id: string;
  slug: string;
};

type CreateDraftListingInput = {
  auditEventId: string;
  categoryId: string | null;
  conditionCode: string | null;
  createdAt: Date;
  createdByApiKeyId: string | null;
  createdByUserId: string | null;
  description: string | null;
  displayCurrencyCode: string;
  id: string;
  quantityAvailable: number | null;
  sellerAccountId: string;
  title: string | null;
  unitPriceMinor: number | null;
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

type UpdateDraftListingInput = {
  attributes: Array<{
    categoryAttributeId: string;
    id: string;
    key: string;
    label: string;
    normalizedText: string | null;
    valueBoolean: boolean | null;
    valueJson: Prisma.InputJsonValue | null;
    valueNumber: number | null;
    valueText: string | null;
  }>;
  auditEventId: string;
  categoryId: string | null;
  conditionCode: string | null;
  description: string | null;
  displayCurrencyCode: string;
  listingId: string;
  quantityAvailable: number | null;
  removeCategoryAttributeIds: string[];
  sellerAccountId: string;
  title: string | null;
  unitPriceMinor: number | null;
  updatedAt: Date;
  updatedByApiKeyId: string | null;
  updatedByUserId: string | null;
};

type PublishDraftListingInput = {
  auditEventId: string;
  listingId: string;
  publishedAt: Date;
  sellerAccountId: string;
  updatedAt: Date;
  updatedByApiKeyId: string | null;
  updatedByUserId: string | null;
};

type ListingStatus = "draft" | "published" | "reserved" | "sold" | "cancelled" | "expired";

type AttributeValueType = "text" | "number" | "boolean" | "enum" | "json";
