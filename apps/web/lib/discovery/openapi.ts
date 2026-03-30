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
  sellerApiErrorBodySchema,
  sellerContextResponseSchema,
  sellerPublishabilityResponseSchema
} from "../seller/http";

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
        "Current OpenAPI description for the implemented CMD Market public and seller API routes. This document is intentionally narrow and does not describe planned marketplace routes that are not live yet.",
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
            "Creates a seller-owned draft listing. Use a browser session or seller API key for the request itself; API keys do not authenticate browser `/seller/*` routes.",
          requestBody: jsonRequestBody(
            createDraftListingSchema,
            "Optional initial fields for a seller-owned draft listing."
          ),
          responses: sellerResponses({
            success: {
              description: sellerApiRoutes[2].description,
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
              description: sellerApiRoutes[3].description,
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
              description: sellerApiRoutes[4].description,
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
              description: sellerApiRoutes[6].description,
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
                description: sellerApiRoutes[7].description,
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
              description: sellerApiRoutes[5].description,
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
