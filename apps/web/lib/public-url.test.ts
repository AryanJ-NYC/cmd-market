import { describe, expect, test } from "vitest";
import { createPublicUrlBuilder } from "./public-url";

describe("createPublicUrlBuilder", () => {
  test("builds absolute urls from a request origin", () => {
    const buildPublicUrl = createPublicUrlBuilder(
      new Request("https://cmd.market/api/listings/lst_123"),
    );

    expect(buildPublicUrl("/listings/lst_123")).toBe("https://cmd.market/listings/lst_123");
  });

  test("builds absolute urls from forwarded headers", () => {
    const buildPublicUrl = createPublicUrlBuilder(
      new Headers({
        host: "cmd.market",
        "x-forwarded-proto": "https",
      }),
    );

    expect(buildPublicUrl("/listings/lst_123/media/med_123")).toBe(
      "https://cmd.market/listings/lst_123/media/med_123",
    );
  });
});
