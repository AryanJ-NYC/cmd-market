import { describe, expect, test } from "vitest";
import { buildOpenApiDocument } from "./openapi";

describe("buildOpenApiDocument", () => {
  test("describes the implemented seller routes and auth schemes", () => {
    const document = buildOpenApiDocument();
    const paths = document.paths ?? {};

    expect(document.openapi).toBe("3.1.0");
    expect(document.info.title).toBe("CMD Market Seller API");
    expect(document.components?.securitySchemes?.browserSession).toBeDefined();
    expect(document.components?.securitySchemes?.sellerApiKey).toBeDefined();
    expect(paths["/api/seller/context"]?.get).toBeDefined();
    expect(paths["/api/seller/publishability"]?.get).toBeDefined();
    expect(paths["/api/seller/listings"]?.post).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/listings"]).toBeUndefined();
    expect(paths["/api/seller/context"]?.get?.description).toContain(
      "API keys do not authenticate browser `/seller/*` routes."
    );
  });
});
