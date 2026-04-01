import type { PrismaClient, shippingProfile as PrismaShippingProfileModel } from "@prisma/client";
import { prisma } from "../db/client";

export class PrismaShippingProfileRepository implements ShippingProfileRepository {
  constructor(private readonly database: PrismaClient) {}

  async createShippingProfile(input: CreateShippingProfileInput): Promise<ShippingProfileRecord> {
    const created = await this.database.shippingProfile.create({
      data: {
        createdAt: input.createdAt,
        domesticRateMinor: input.domesticRateMinor,
        handlingTimeDays: input.handlingTimeDays,
        id: input.id,
        name: input.name,
        sellerAccountId: input.sellerAccountId,
        updatedAt: input.updatedAt,
      },
    });

    return mapShippingProfileModel(created);
  }

  async findShippingProfileById(shippingProfileId: string): Promise<ShippingProfileRecord | null> {
    const record = await this.database.shippingProfile.findUnique({
      where: {
        id: shippingProfileId,
      },
    });

    return record ? mapShippingProfileModel(record) : null;
  }

  async listShippingProfilesBySellerAccountId(sellerAccountId: string): Promise<ShippingProfileRecord[]> {
    const records = await this.database.shippingProfile.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      where: {
        sellerAccountId,
      },
    });

    return records.map(mapShippingProfileModel);
  }

  async updateShippingProfile(input: UpdateShippingProfileInput): Promise<ShippingProfileRecord | null> {
    const updateResult = await this.database.shippingProfile.updateMany({
      data: {
        domesticRateMinor: input.domesticRateMinor,
        handlingTimeDays: input.handlingTimeDays,
        name: input.name,
        updatedAt: input.updatedAt,
      },
      where: {
        id: input.id,
        sellerAccountId: input.sellerAccountId,
        updatedAt: input.expectedUpdatedAt,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    const record = await this.database.shippingProfile.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!record) {
      throw new Error(`Missing shipping profile: ${input.id}`);
    }

    return mapShippingProfileModel(record);
  }
}

export const shippingProfileRepository = new PrismaShippingProfileRepository(prisma);

function mapShippingProfileModel(record: PrismaShippingProfileModel): ShippingProfileRecord {
  return {
    createdAt: record.createdAt,
    domesticRateMinor: record.domesticRateMinor,
    handlingTimeDays: toHandlingTimeDays(record.handlingTimeDays),
    id: record.id,
    name: record.name,
    sellerAccountId: record.sellerAccountId,
    updatedAt: record.updatedAt,
  };
}

function toHandlingTimeDays(value: number): HandlingTimeDays {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  throw new Error(`Unknown shipping handling time days: ${value}`);
}

export type ShippingProfileRepository = {
  createShippingProfile(input: CreateShippingProfileInput): Promise<ShippingProfileRecord>;
  findShippingProfileById(shippingProfileId: string): Promise<ShippingProfileRecord | null>;
  listShippingProfilesBySellerAccountId(sellerAccountId: string): Promise<ShippingProfileRecord[]>;
  updateShippingProfile(input: UpdateShippingProfileInput): Promise<ShippingProfileRecord | null>;
};

export type ShippingProfileRecord = {
  createdAt: Date;
  domesticRateMinor: number;
  handlingTimeDays: HandlingTimeDays;
  id: string;
  name: string;
  sellerAccountId: string;
  updatedAt: Date;
};

export type HandlingTimeDays = 1 | 2 | 3;

type CreateShippingProfileInput = {
  createdAt: Date;
  domesticRateMinor: number;
  handlingTimeDays: HandlingTimeDays;
  id: string;
  name: string;
  sellerAccountId: string;
  updatedAt: Date;
};

type UpdateShippingProfileInput = {
  domesticRateMinor: number;
  expectedUpdatedAt: Date;
  handlingTimeDays: HandlingTimeDays;
  id: string;
  name: string;
  sellerAccountId: string;
  updatedAt: Date;
};
