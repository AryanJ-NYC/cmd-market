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
    expect(paths["/api/openclaw/authorization-sessions"]?.post).toBeDefined();
    expect(paths["/api/openclaw/authorization-sessions/{sessionId}/status"]?.post).toBeDefined();
    expect(paths["/api/openclaw/authorization-sessions/{sessionId}/redeem"]?.post).toBeDefined();
    expect(paths["/api/seller/context"]?.get).toBeDefined();
    expect(paths["/api/seller/publishability"]?.get).toBeDefined();
    expect(paths["/api/seller/shipping-profiles"]?.get).toBeDefined();
    expect(paths["/api/seller/shipping-profiles"]?.post).toBeDefined();
    expect(paths["/api/seller/shipping-profiles/{shippingProfileId}"]?.get).toBeDefined();
    expect(paths["/api/seller/shipping-profiles/{shippingProfileId}"]?.patch).toBeDefined();
    expect(paths["/api/seller/listings"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}"]?.get).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}"]?.patch).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/publish"]?.post).toBeDefined();
    expect(paths["/api/seller/upload-sessions"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/media"]?.post?.responses?.["404"]).toBeDefined();
    expect(paths["/api/seller/listings/{listingId}/publish"]?.post?.responses?.["422"]).toBeDefined();
    expect(getRequestBodyRequired(paths["/api/openclaw/authorization-sessions"]?.post?.requestBody)).toBe(true);
    expect(getRequestBodyRequired(paths["/api/seller/upload-sessions"]?.post?.requestBody)).toBe(true);
    expect(getRequestBodyRequired(paths["/api/seller/listings/{listingId}/media"]?.post?.requestBody)).toBe(
      true
    );
    expect(getRequestBodyRequired(paths["/api/seller/listings"]?.post?.requestBody)).toBe(false);
    expect(getRequestBodyRequired(paths["/api/seller/listings/{listingId}"]?.patch?.requestBody)).toBe(
      false
    );
    expect(
      paths["/api/seller/publishability"]?.get?.responses?.["403"]?.content?.["application/json"]?.schema
    ).toEqual({
      $ref: "#/components/schemas/SellerPublishabilityForbiddenResponse"
    });
    expect(
      document.components?.schemas?.SellerPublishabilityForbiddenResponse
    ).toMatchObject({
      anyOf: expect.any(Array)
    });
    expect(paths["/api/seller/context"]?.get?.description).toContain(
      "API keys do not authenticate browser `/seller/*` routes."
    );
    expect(paths["/api/openclaw/authorization-sessions"]?.post?.security).toBeUndefined();
    expect(paths["/api/openclaw/authorization-sessions/{sessionId}/status"]?.post?.security).toBeUndefined();
    expect(paths["/api/openclaw/authorization-sessions/{sessionId}/redeem"]?.post?.security).toBeUndefined();
    expect(document.components?.schemas?.OpenClawAuthorizationSessionCreateRequest).toMatchObject({
      properties: {
        code_challenge: expect.any(Object),
        code_challenge_method: expect.any(Object),
        proposed_workspace: {
          properties: {
            name: expect.any(Object),
            slug: expect.any(Object)
          }
        }
      },
      required: ["code_challenge", "code_challenge_method"]
    });
    expect(document.components?.schemas?.OpenClawAuthorizationSessionVerifierRequest).toMatchObject({
      properties: {
        code_verifier: expect.any(Object)
      },
      required: ["code_verifier"]
    });
    expect(document.components?.schemas?.CreateDraftListingRequest).toMatchObject({
      properties: {
        shipping_profile_id: expect.any(Object)
      }
    });
    expect(document.components?.schemas?.UpdateDraftListingRequest).toMatchObject({
      properties: {
        shipping_profile_id: expect.any(Object)
      }
    });
    expect(document.components?.schemas?.PublicListingResponse).toMatchObject({
      properties: {
        data: {
          properties: {
            shipping: expect.any(Object)
          }
        }
      }
    });
  });
});

function getRequestBodyRequired(
  requestBody: { required?: boolean } | { $ref: string } | undefined
) {
  return requestBody && "required" in requestBody ? requestBody.required : undefined;
}
