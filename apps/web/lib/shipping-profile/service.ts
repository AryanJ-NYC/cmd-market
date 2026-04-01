import "zod-openapi";
import { z } from "zod";
import { createMarketplaceId } from "../db/ids";
import { resolveSellerRequestContext } from "../seller/service";
import {
  shippingProfileRepository,
  type HandlingTimeDays,
  type ShippingProfileRecord,
} from "./repository";

const DOMESTIC_CURRENCY_CODE = "USD";
const POSTGRES_INTEGER_MAX = 2_147_483_647;
const SHIPPING_SCOPE = "us_50_states";

export async function createShippingProfile(
  request: Request,
  input: ShippingProfileMutationInput,
): Promise<ShippingProfileActionResult<ShippingProfileResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const now = new Date();
  const shippingProfile = await shippingProfileRepository.createShippingProfile({
    createdAt: now,
    domesticRateMinor: input.domesticRateMinor,
    handlingTimeDays: input.handlingTimeDays,
    id: createMarketplaceId(),
    name: input.name,
    sellerAccountId: sellerContext.context.sellerAccountId,
    updatedAt: now,
  });

  return {
    data: serializeShippingProfile(shippingProfile),
    ok: true,
  };
}

export async function listShippingProfiles(
  request: Request,
): Promise<ShippingProfileActionResult<ShippingProfileResource[]>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const shippingProfiles = await shippingProfileRepository.listShippingProfilesBySellerAccountId(
    sellerContext.context.sellerAccountId,
  );

  return {
    data: shippingProfiles.map(serializeShippingProfile),
    ok: true,
  };
}

export async function getShippingProfile(
  request: Request,
  shippingProfileId: string,
): Promise<ShippingProfileActionResult<ShippingProfileResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const shippingProfile = await shippingProfileRepository.findShippingProfileById(shippingProfileId);

  if (!shippingProfile) {
    return notFound("Shipping profile could not be found.");
  }

  if (shippingProfile.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot access that shipping profile.");
  }

  return {
    data: serializeShippingProfile(shippingProfile),
    ok: true,
  };
}

export async function updateShippingProfile(
  request: Request,
  shippingProfileId: string,
  input: Partial<ShippingProfileMutationInput>,
): Promise<ShippingProfileActionResult<ShippingProfileResource>> {
  const sellerContext = await resolveSellerRequestContext(request);

  if (!sellerContext.ok) {
    return sellerContext;
  }

  const existingShippingProfile = await shippingProfileRepository.findShippingProfileById(
    shippingProfileId,
  );

  if (!existingShippingProfile) {
    return notFound("Shipping profile could not be found.");
  }

  if (existingShippingProfile.sellerAccountId !== sellerContext.context.sellerAccountId) {
    return forbidden("Authenticated seller cannot modify that shipping profile.");
  }

  const now = new Date();
  const updatedShippingProfile = await shippingProfileRepository.updateShippingProfile({
    domesticRateMinor: input.domesticRateMinor ?? existingShippingProfile.domesticRateMinor,
    expectedUpdatedAt: existingShippingProfile.updatedAt,
    handlingTimeDays: input.handlingTimeDays ?? existingShippingProfile.handlingTimeDays,
    id: shippingProfileId,
    name: input.name ?? existingShippingProfile.name,
    sellerAccountId: sellerContext.context.sellerAccountId,
    updatedAt: now,
  });

  if (!updatedShippingProfile) {
    const latestShippingProfile = await shippingProfileRepository.findShippingProfileById(
      shippingProfileId,
    );

    if (!latestShippingProfile) {
      return notFound("Shipping profile could not be found.");
    }

    if (latestShippingProfile.sellerAccountId !== sellerContext.context.sellerAccountId) {
      return forbidden("Authenticated seller cannot modify that shipping profile.");
    }

    return conflict(
      "shipping_profile_update_conflict",
      "Shipping profile could not be updated because it changed during the request.",
    );
  }

  return {
    data: serializeShippingProfile(updatedShippingProfile),
    ok: true,
  };
}

export const createShippingProfileSchema = z
  .object({
    domestic_rate_minor: z
      .number()
      .int()
      .nonnegative()
      .lte(POSTGRES_INTEGER_MAX)
      .meta({
        description: "Flat domestic shipping rate in USD minor units.",
        example: 499,
      }),
    handling_time_days: z.union([z.literal(1), z.literal(2), z.literal(3)]).meta({
      description: "Estimated seller handling time in business days.",
      example: 2,
    }),
    name: z.string().trim().min(1).meta({
      description: "Human-readable shipping profile name.",
      example: "Card mailer",
    }),
  })
  .strict()
  .meta({
    description: "Payload for creating a seller-owned flat domestic shipping profile.",
    id: "CreateShippingProfileRequest",
  });

export const updateShippingProfileSchema = z
  .object({
    domestic_rate_minor: z
      .number()
      .int()
      .nonnegative()
      .lte(POSTGRES_INTEGER_MAX)
      .optional()
      .meta({
        description: "Flat domestic shipping rate in USD minor units.",
        example: 0,
      }),
    handling_time_days: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().meta({
      description: "Estimated seller handling time in business days.",
      example: 1,
    }),
    name: z.string().trim().min(1).optional().meta({
      description: "Human-readable shipping profile name.",
      example: "Free shipping cards",
    }),
  })
  .strict()
  .meta({
    description: "Payload for patching a seller-owned shipping profile.",
    id: "UpdateShippingProfileRequest",
  });

export function parseCreateShippingProfileInput(
  input: z.infer<typeof createShippingProfileSchema>,
): ShippingProfileMutationInput {
  return {
    domesticRateMinor: input.domestic_rate_minor,
    handlingTimeDays: input.handling_time_days,
    name: input.name,
  };
}

export function parseUpdateShippingProfileInput(
  input: z.infer<typeof updateShippingProfileSchema>,
): Partial<ShippingProfileMutationInput> {
  return {
    domesticRateMinor: input.domestic_rate_minor,
    handlingTimeDays: input.handling_time_days,
    name: input.name,
  };
}

function serializeShippingProfile(shippingProfile: ShippingProfileRecord): ShippingProfileResource {
  return {
    createdAt: shippingProfile.createdAt.toISOString(),
    currencyCode: DOMESTIC_CURRENCY_CODE,
    domesticRateMinor: shippingProfile.domesticRateMinor,
    handlingTimeDays: shippingProfile.handlingTimeDays,
    id: shippingProfile.id,
    name: shippingProfile.name,
    object: "shipping_profile",
    scope: SHIPPING_SCOPE,
    updatedAt: shippingProfile.updatedAt.toISOString(),
  };
}

function conflict(code: string, message: string): ShippingProfileActionResult<never> {
  return {
    code,
    message,
    ok: false,
    status: 409,
  };
}

function forbidden(message: string): ShippingProfileActionResult<never> {
  return {
    code: "forbidden",
    message,
    ok: false,
    status: 403,
  };
}

function notFound(message: string): ShippingProfileActionResult<never> {
  return {
    code: "shipping_profile_not_found",
    message,
    ok: false,
    status: 404,
  };
}

type ShippingProfileMutationInput = {
  domesticRateMinor: number;
  handlingTimeDays: HandlingTimeDays;
  name: string;
};

export type ShippingProfileResource = {
  createdAt: string;
  currencyCode: "USD";
  domesticRateMinor: number;
  handlingTimeDays: HandlingTimeDays;
  id: string;
  name: string;
  object: "shipping_profile";
  scope: "us_50_states";
  updatedAt: string;
};

type ShippingProfileActionResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      code: string;
      message: string;
      ok: false;
      retryAfterMs?: number;
      status: number;
    };
