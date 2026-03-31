import "zod-openapi";
import { createDocument } from "zod-openapi";
import { z } from "zod";
import {
  openApiVersion,
  publicApiRoutes,
  sellerApiRoutes
} from "./content";
import {
  attachListingMediaSchema,
  createDraftListingSchema,
  updateDraftListingSchema,
  uploadSessionsSchema
} from "../listing/service";
import {
  categoryResponseSchema,
  categorySummariesResponseSchema,
  listingValidationProblemSchema,
  publicListingResponseSchema,
  sellerListingResponseSchema,
  uploadSessionsResponseSchema
} from "../listing/http";
import {
  openClawAuthorizationSessionCreateRequestSchema,
  openClawAuthorizationSessionCreateResponseSchema,
  openClawAuthorizationSessionRedeemResponseSchema,
  openClawAuthorizationSessionStatusResponseSchema,
  openClawAuthorizationSessionVerifierRequestSchema,
  sellerApiErrorBodySchema,
  sellerContextResponseSchema,
  sellerPublishabilityResponseSchema
} from "../seller/http";

const sellerPublishabilityForbiddenResponseSchema = z
  .union([sellerApiErrorBodySchema, sellerPublishabilityResponseSchema])
  .meta({
    description:
      "Forbidden response for seller publishability checks. This may be a standard seller API error envelope or an ineligible-but-resolved publishability payload.",
    id: "SellerPublishabilityForbiddenResponse"
  });

const categorySlugPathParamsSchema = z.object({
  categorySlug: z.string().meta({
    description: "Category slug.",
    example: "trading-cards"
  })
});

const listingIdPathParamsSchema = z.object({
  listingId: z.string().meta({
    description: "Listing identifier.",
    example: "lst_123"
  })
});

export function buildOpenApiDocument() {
  const createOpenClawAuthorizationSessionRoute = findSellerApiRoute("/api/openclaw/authorization-sessions");
  const openClawAuthorizationSessionStatusRoute = findSellerApiRoute(
    "/api/openclaw/authorization-sessions/{sessionId}/status"
  );
  const openClawAuthorizationSessionRedeemRoute = findSellerApiRoute(
    "/api/openclaw/authorization-sessions/{sessionId}/redeem"
  );
  const sellerContextRoute = findSellerApiRoute("/api/seller/context");
  const sellerPublishabilityRoute = findSellerApiRoute("/api/seller/publishability");
  const sellerListingsRoute = findSellerApiRoute("/api/seller/listings");
  const sellerListingRoute = findSellerApiRoute("/api/seller/listings/{listingId}");
  const sellerUploadSessionsRoute = findSellerApiRoute("/api/seller/upload-sessions");
  const sellerListingMediaRoute = findSellerApiRoute("/api/seller/listings/{listingId}/media");
  const sellerListingPublishRoute = findSellerApiRoute("/api/seller/listings/{listingId}/publish");

  return createDocument({
    components: {
      securitySchemes: {
        browserSession: {
          description:
            "Cookie-backed BetterAuth browser session. Browser `/seller/*` routes also require the normal browser sign-in flow and active workspace context where applicable. API keys do not authenticate browser `/seller/*` routes.",
          in: "cookie",
          name: "better-auth.session_token",
          type: "apiKey"
        },
        sellerApiKey: {
          description:
            "Seller-scoped API key sent in the `x-api-key` header for `/api/seller/*` requests. API keys do not authenticate browser `/seller/*` routes.",
          in: "header",
          name: "x-api-key",
          type: "apiKey"
        }
      }
    },
    info: {
      description:
        "Current OpenAPI description for the implemented CMD Market public and seller API routes. CMD Market is built to support many agent clients over time; OpenClaw is the first implemented browser handoff integration described here. This document is intentionally narrow and does not describe planned marketplace routes that are not live yet.",
      title: "CMD Market API",
      version: openApiVersion
    },
    openapi: "3.1.0",
    paths: {
      "/api/categories": {
        get: {
          description:
            "Lists the current active category summaries that sellers and agents can use before authoring listing attributes.",
          responses: publicResponses({
            success: {
              description: publicApiRoutes[0].description,
              schema: categorySummariesResponseSchema
            }
          }),
          summary: "List public categories"
        }
      },
      "/api/categories/{categorySlug}": {
        get: {
          description:
            "Reads category metadata, including required attributes and allowed values for authoring.",
          requestParams: {
            path: categorySlugPathParamsSchema
          },
          responses: publicResponses({
            additional: {
              "404": errorResponse("Category could not be found.")
            },
            success: {
              description: publicApiRoutes[1].description,
              schema: categoryResponseSchema
            }
          }),
          summary: "Read category metadata"
        }
      },
      "/api/listings/{listingId}": {
        get: {
          description:
            "Reads the canonical public listing resource for a published listing. Unpublished or missing listings return 404.",
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: publicResponses({
            additional: {
              "404": errorResponse("Published listing could not be found.")
            },
            success: {
              description: publicApiRoutes[2].description,
              schema: publicListingResponseSchema
            }
          }),
          summary: "Read a public listing"
        }
      },
      "/api/openclaw/authorization-sessions": {
        post: {
          description:
            "Starts a short-lived OpenClaw browser handoff authorization session for a public client instance and returns the browser URL. The request includes a PKCE code challenge and optional proposed first-workspace details.",
          requestBody: jsonRequestBody(
            openClawAuthorizationSessionCreateRequestSchema,
            "PKCE code challenge for the initiating OpenClaw client instance, plus optional proposed first-workspace details to prefill during the browser handoff.",
            true
          ),
          responses: sellerResponses({
            success: {
              description: createOpenClawAuthorizationSessionRoute.description,
              schema: openClawAuthorizationSessionCreateResponseSchema
            }
          }),
          summary: "Create an OpenClaw authorization session"
        }
      },
      "/api/openclaw/authorization-sessions/{sessionId}/status": {
        post: {
          description:
            "Polls the current state of an OpenClaw browser handoff authorization session using the PKCE code verifier from the same client instance that started it.",
          requestBody: jsonRequestBody(
            openClawAuthorizationSessionVerifierRequestSchema,
            "PKCE code verifier for the OpenClaw authorization session.",
            true
          ),
          requestParams: {
            path: z.object({
              sessionId: z.string().meta({
                description: "OpenClaw authorization session identifier.",
                example: "auth_123"
              })
            })
          },
          responses: sellerResponses({
            success: {
              description: openClawAuthorizationSessionStatusRoute.description,
              schema: openClawAuthorizationSessionStatusResponseSchema
            }
          }),
          summary: "Poll an OpenClaw authorization session"
        }
      },
      "/api/openclaw/authorization-sessions/{sessionId}/redeem": {
        post: {
          description:
            "Redeems an authorized OpenClaw browser handoff authorization session into a seller-scoped API key using the PKCE code verifier from the same client instance that started it.",
          requestBody: jsonRequestBody(
            openClawAuthorizationSessionVerifierRequestSchema,
            "PKCE code verifier for the OpenClaw authorization session.",
            true
          ),
          requestParams: {
            path: z.object({
              sessionId: z.string().meta({
                description: "OpenClaw authorization session identifier.",
                example: "auth_123"
              })
            })
          },
          responses: sellerResponses({
            success: {
              description: openClawAuthorizationSessionRedeemRoute.description,
              schema: openClawAuthorizationSessionRedeemResponseSchema
            }
          }),
          summary: "Redeem an OpenClaw authorization session"
        }
      },
      "/api/seller/context": {
        get: {
          description:
            "Returns the resolved seller workspace and actor metadata for the current browser session or seller API key. API keys do not authenticate browser `/seller/*` routes.",
          responses: sellerResponses({
            success: {
              description: sellerContextRoute.description,
              schema: sellerContextResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Resolve seller context"
        }
      },
      "/api/seller/listings": {
        post: {
          description:
            "Creates a seller-owned draft listing. Use a browser session or seller API key for the request itself; API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            createDraftListingSchema,
            "Optional initial fields for a seller-owned draft listing."
          ),
          responses: sellerResponses({
            success: {
              description: sellerListingsRoute.description,
              schema: sellerListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Create a draft listing"
        }
      },
      "/api/seller/listings/{listingId}": {
        get: {
          description:
            "Reads a seller-owned listing resource for the active seller context. API keys do not authenticate browser `/seller/*` routes.",
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerListingRoute.description,
              schema: sellerListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Read a seller listing"
        },
        patch: {
          description:
            "Patches draft listing fields and typed category attributes for the active seller context. API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            updateDraftListingSchema,
            "Draft listing patch payload."
          ),
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerListingRoute.description,
              schema: sellerListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Patch a draft listing"
        }
      },
      "/api/seller/listings/{listingId}/media": {
        post: {
          description:
            "Attaches uploaded media to a seller-owned draft listing. API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            attachListingMediaSchema,
            "Media attachment payload for a seller-owned draft listing.",
            true
          ),
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerListingMediaRoute.description,
              schema: sellerListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Attach draft listing media"
        }
      },
      "/api/seller/listings/{listingId}/publish": {
        post: {
          description:
            "Publishes a seller-owned draft listing after seller eligibility, media, and category requirements pass validation. API keys do not authenticate browser `/seller/*` routes.",
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: {
            ...sellerResponses({
              additional: {
                "404": errorResponse("Draft listing could not be found."),
                "422": {
                  content: {
                    "application/json": {
                      schema: listingValidationProblemSchema
                    }
                  },
                  description: "Listing draft is not publishable yet."
                }
              },
              success: {
                description: sellerListingPublishRoute.description,
                schema: sellerListingResponseSchema
              }
            })
          },
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Publish a draft listing"
        }
      },
      "/api/seller/publishability": {
        get: {
          description:
            "Checks whether the resolved seller workspace is currently publishable. API keys do not authenticate browser `/seller/*` routes.",
          responses: sellerResponses({
            additional: {
              "403": {
                content: {
                  "application/json": {
                    schema: sellerPublishabilityForbiddenResponseSchema
                  }
                },
                description:
                  "Seller workspace is either unresolved/forbidden or resolved successfully but not publishable yet."
              }
            },
            success: {
              description: sellerPublishabilityRoute.description,
              schema: sellerPublishabilityResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Resolve seller publishability"
        }
      },
      "/api/seller/upload-sessions": {
        post: {
          description:
            "Creates draft-scoped direct-upload sessions for listing media. API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            uploadSessionsSchema,
            "Draft-scoped upload session request payload.",
            true
          ),
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerUploadSessionsRoute.description,
              schema: uploadSessionsResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Create draft upload sessions"
        }
      }
    }
  });
}

function jsonRequestBody(schema: z.ZodType, description: string, required = false) {
  return {
    content: {
      "application/json": {
        schema
      }
    },
    description,
    required
  };
}

function publicResponses(input: {
  additional?: Record<string, unknown>;
  success: {
    description: string;
    schema: z.ZodType;
  };
}) {
  return {
    "200": {
      content: {
        "application/json": {
          schema: input.success.schema
        }
      },
      description: input.success.description
    },
    ...input.additional
  };
}

function sellerResponses(input: {
  additional?: Record<string, unknown>;
  success: {
    description: string;
    schema: z.ZodType;
  };
}) {
  return {
    "200": {
      content: {
        "application/json": {
          schema: input.success.schema
        }
      },
      description: input.success.description
    },
    "400": errorResponse("Request body or route input is invalid."),
    "401": errorResponse("Authentication is required."),
    "403": errorResponse("Seller context or access is forbidden for this request."),
    "409": errorResponse("Seller context or listing state is invalid for this request."),
    "429": errorResponse("Request rate limit exceeded."),
    ...input.additional
  };
}

function errorResponse(description: string) {
  return {
    content: {
      "application/json": {
        schema: sellerApiErrorBodySchema
      }
    },
    description
  };
}

function findSellerApiRoute(href: string) {
  const route = sellerApiRoutes.find((item) => item.href === href);

  if (!route) {
    throw new Error(`Missing seller API route: ${href}`);
  }

  return route;
}
