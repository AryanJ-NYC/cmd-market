import { describe, expect, test } from "vitest";
import {
  serializeShippingProfileListResponse,
  serializeShippingProfileResponse,
  shippingProfileListResponseSchema,
  shippingProfileResponseSchema,
} from "./http";

describe("shipping-profile/http", () => {
  test("serializes shipping profile responses with the shared schema", () => {
    const response = serializeShippingProfileResponse({
      createdAt: "2026-04-01T12:00:00.000Z",
      currencyCode: "USD",
      domesticRateMinor: 499,
      handlingTimeDays: 2,
      id: "shp_123",
      name: "Card mailer",
      object: "shipping_profile",
      scope: "us_50_states",
      updatedAt: "2026-04-01T12:00:00.000Z",
    });

    expect(shippingProfileResponseSchema.parse(response)).toEqual(response);
  });

  test("serializes shipping profile list responses with the shared schema", () => {
    const response = serializeShippingProfileListResponse([
      {
        createdAt: "2026-04-01T12:00:00.000Z",
        currencyCode: "USD",
        domesticRateMinor: 499,
        handlingTimeDays: 2,
        id: "shp_123",
        name: "Card mailer",
        object: "shipping_profile",
        scope: "us_50_states",
        updatedAt: "2026-04-01T12:00:00.000Z",
      },
    ]);

    expect(shippingProfileListResponseSchema.parse(response)).toEqual(response);
  });
});
