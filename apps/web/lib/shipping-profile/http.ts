import "zod-openapi";
import { z } from "zod";
import type { ShippingProfileResource } from "./service";

export const shippingProfileSchema = z
  .object({
    created_at: z.string(),
    currency_code: z.literal("USD"),
    domestic_rate_minor: z.number().int().nonnegative(),
    handling_time_days: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    id: z.string(),
    name: z.string(),
    object: z.literal("shipping_profile"),
    scope: z.literal("us_50_states"),
    updated_at: z.string(),
  })
  .meta({
    description: "Seller-owned flat domestic shipping profile.",
    id: "ShippingProfile",
  });

export const shippingProfileResponseSchema = z
  .object({
    data: shippingProfileSchema,
  })
  .meta({
    description: "Shipping profile response envelope.",
    id: "ShippingProfileResponse",
  });

export const shippingProfileListResponseSchema = z
  .object({
    data: z.array(shippingProfileSchema),
  })
  .meta({
    description: "Shipping profile list response envelope.",
    id: "ShippingProfileListResponse",
  });

export function serializeShippingProfileResponse(shippingProfile: ShippingProfileResource) {
  return shippingProfileResponseSchema.parse({
    data: serializeShippingProfile(shippingProfile),
  });
}

export function serializeShippingProfileListResponse(shippingProfiles: ShippingProfileResource[]) {
  return shippingProfileListResponseSchema.parse({
    data: shippingProfiles.map(serializeShippingProfile),
  });
}

function serializeShippingProfile(shippingProfile: ShippingProfileResource) {
  return {
    created_at: shippingProfile.createdAt,
    currency_code: shippingProfile.currencyCode,
    domestic_rate_minor: shippingProfile.domesticRateMinor,
    handling_time_days: shippingProfile.handlingTimeDays,
    id: shippingProfile.id,
    name: shippingProfile.name,
    object: shippingProfile.object,
    scope: shippingProfile.scope,
    updated_at: shippingProfile.updatedAt,
  };
}
