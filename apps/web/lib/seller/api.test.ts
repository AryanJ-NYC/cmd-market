import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createSellerApiErrorResponse,
  parseOptionalSellerApiRequestBody,
  parseSellerApiRequestBody
} from "./api";

describe("seller api helpers", () => {
  it("formats seller api errors with retry metadata", async () => {
    const response = createSellerApiErrorResponse({
      code: "rate_limited",
      message: "Slow down.",
      retryAfterMs: 2500,
      status: 429
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "rate_limited",
        message: "Slow down.",
        retryAfterMs: 2500
      }
    });
  });

  it("rejects malformed json request bodies", async () => {
    const result = await parseSellerApiRequestBody(
      new Request("https://example.com/api/seller/upload-sessions", {
        body: "{",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      z.object({
        listing_id: z.string()
      }),
      "Upload session request body is invalid."
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
        message: "Upload session request body is invalid.",
        retryAfterMs: null
      }
    });
  });

  it("accepts an empty optional request body but rejects explicit json null", async () => {
    const schema = z.object({
      title: z.string().optional()
    });

    const emptyBodyResult = await parseOptionalSellerApiRequestBody(
      new Request("https://example.com/api/seller/listings", {
        method: "POST"
      }),
      schema,
      "Draft listing request body is invalid.",
      {}
    );

    expect(emptyBodyResult).toEqual({
      data: {},
      ok: true
    });

    const nullBodyResult = await parseOptionalSellerApiRequestBody(
      new Request("https://example.com/api/seller/listings", {
        body: "null",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      schema,
      "Draft listing request body is invalid.",
      {}
    );

    expect(nullBodyResult.ok).toBe(false);

    if (nullBodyResult.ok) {
      return;
    }

    expect(nullBodyResult.response.status).toBe(400);
  });
});
