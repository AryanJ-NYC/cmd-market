import { describe, expect, test } from "vitest";
import { buildOpenApiDocument } from "./openapi";

describe("buildOpenApiDocument", () => {
  test("describes the implemented seller routes and auth schemes", () => {
    const document = buildOpenApiDocument();
    const paths = document.paths ?? {};

    expect(document.openapi).toBe("3.1.0");
    expect(document.info.title).toBe("CMD Market API");
    expect(document.components?.securitySchemes?.browserSession).toBeDefined();
    expect(document.components?.securitySchemes?.sellerApiKey).toBeDefined();
    expect(paths["/api/categories"]?.get).toBeDefined();
    expect(paths["/api/categories/{categorySlug}"]?.get).toBeDefined();
    expect(paths["/api/listings/{listingId}"]?.get).toBeDefined();
    expect(paths["/api/seller/context"]?.get).toBeDefined();
    expect(paths["/api/seller/publishability"]?.get).toBeDefined();
    expect(paths["/api/seller/listings"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}"]?.get).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}"]?.patch).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/publish"]?.post).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/publish"]?.post?.responses?.["422"]).toBeDefined();
    expect(paths["/api/seller/context"]?.get?.description).toContain(
      "API keys do not authenticate browser `/seller/*` routes."
    );
  });
});
