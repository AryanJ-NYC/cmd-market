import "zod-openapi";
import { createDocument } from "zod-openapi";
import { z } from "zod";
import {
  openApiVersion,
  sellerApiRoutes
} from "./content";
import {
  attachListingMediaSchema,
  uploadSessionsSchema
} from "../listing/service";
import {
  draftListingResponseSchema,
  uploadSessionsResponseSchema
} from "../listing/http";
import {
  sellerApiErrorBodySchema,
  sellerContextResponseSchema,
  sellerPublishabilityResponseSchema
} from "../seller/http";

const listingIdPathParamsSchema = z.object({
  listingId: z.string().meta({
    description: "Draft listing identifier.",
    example: "lst_123"
  })
});

export function buildOpenApiDocument() {
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
        "Current OpenAPI description for the implemented CMD Market seller endpoints. This document is intentionally narrow and does not describe planned marketplace routes that are not live yet.",
      title: "CMD Market Seller API",
      version: openApiVersion
    },
    openapi: "3.1.0",
    paths: {
      "/api/seller/context": {
        get: {
          description:
            "Returns the resolved seller workspace and actor metadata for the current browser session or seller API key. API keys do not authenticate browser `/seller/*` routes.",
          responses: sellerResponses({
            success: {
              description: sellerApiRoutes[0].description,
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
            "Creates a thin seller-owned draft listing. Use a browser session or seller API key for the request itself; API keys do not authenticate browser `/seller/*` routes.",
          responses: sellerResponses({
            success: {
              description: sellerApiRoutes[2].description,
              schema: draftListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Create a draft listing"
        }
      },
      "/api/seller/listings/{listingId}/media": {
        post: {
          description:
            "Attaches uploaded media to a seller-owned draft listing. API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            attachListingMediaSchema,
            "Media attachment payload for a seller-owned draft listing."
          ),
          requestParams: {
            path: listingIdPathParamsSchema
          },
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerApiRoutes[4].description,
              schema: draftListingResponseSchema
            }
          }),
          security: [{ browserSession: [] }, { sellerApiKey: [] }],
          summary: "Attach draft listing media"
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
                    schema: sellerPublishabilityResponseSchema
                  }
                },
                description: "Seller workspace resolved successfully, but it is not publishable yet."
              }
            },
            success: {
              description: sellerApiRoutes[1].description,
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
            "Draft-scoped upload session request payload."
          ),
          responses: sellerResponses({
            additional: {
              "404": errorResponse("Draft listing could not be found.")
            },
            success: {
              description: sellerApiRoutes[3].description,
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

function jsonRequestBody(schema: z.ZodType, description: string) {
  return {
    content: {
      "application/json": {
        schema
      }
    },
    description
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
