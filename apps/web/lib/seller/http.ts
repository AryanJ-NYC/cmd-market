import "zod-openapi";
import { z } from "zod";
import type { SellerContext, SellerPublishabilityIssue } from "./domain";

export const sellerEligibilityStatusSchema = z
  .enum(["pending", "eligible", "revoked", "suspended"])
  .meta({
    description: "Current listing eligibility state for the seller workspace.",
    example: "eligible",
    id: "SellerEligibilityStatus"
  });

export const sellerEligibilitySourceSchema = z
  .enum(["manual_override", "x_verification"])
  .nullable()
  .meta({
    description: "Current source of seller eligibility, if one has been applied.",
    example: "x_verification",
    id: "SellerEligibilitySource"
  });

export const sellerContextSchema = z
  .object({
    actorApiKeyId: z.string().nullable(),
    actorType: z.enum(["user", "api_key"]),
    actorUserId: z.string().nullable(),
    eligibilitySource: sellerEligibilitySourceSchema,
    eligibilityStatus: sellerEligibilityStatusSchema,
    organizationId: z.string(),
    sellerAccountId: z.string()
  })
  .meta({
    description: "Resolved seller workspace and actor metadata for the current request.",
    id: "SellerContext"
  });

export const sellerContextResponseSchema = z
  .object({
    data: sellerContextSchema
  })
  .meta({
    description: "Seller context response envelope.",
    id: "SellerContextResponse"
  });

export const sellerPublishabilityIssueSchema = z
  .object({
    code: z.string(),
    message: z.string()
  })
  .meta({
    description: "A publishability issue blocking listing publication.",
    id: "SellerPublishabilityIssue"
  });

export const sellerPublishabilityResponseSchema = z
  .object({
    data: z.object({
      issues: z.array(sellerPublishabilityIssueSchema),
      publishable: z.boolean(),
      sellerContext: sellerContextSchema
    })
  })
  .meta({
    description: "Seller publishability response envelope.",
    id: "SellerPublishabilityResponse"
  });

export const sellerApiErrorBodySchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      retryAfterMs: z.number().int().positive().nullable()
    })
  })
  .meta({
    description: "Standard seller API error envelope.",
    id: "SellerApiErrorResponse"
  });

export const openClawAuthorizationSessionStatusSchema = z
  .enum(["authorized", "cancelled", "expired", "pending", "redeemed", "rejected"])
  .meta({
    description: "Current state of an OpenClaw browser handoff authorization session.",
    example: "pending",
    id: "OpenClawAuthorizationSessionStatus"
  });

export const openClawAuthorizationExchangeRequestSchema = z
  .object({
    exchange_code: z.string().min(1)
  })
  .meta({
    description: "One-time exchange code provided when the OpenClaw authorization session starts.",
    id: "OpenClawAuthorizationExchangeRequest"
  });

export const openClawAuthorizationSessionCreateResponseSchema = z
  .object({
    data: z.object({
      browser_url: z.string().url(),
      exchange_code: z.string(),
      expires_at: z.iso.datetime(),
      session_id: z.string()
    })
  })
  .meta({
    description: "OpenClaw authorization-session creation response.",
    id: "OpenClawAuthorizationSessionCreateResponse"
  });

export const openClawAuthorizationSessionStatusResponseSchema = z
  .object({
    data: z.object({
      expires_at: z.iso.datetime(),
      session_id: z.string(),
      status: openClawAuthorizationSessionStatusSchema
    })
  })
  .meta({
    description: "OpenClaw authorization-session polling response.",
    id: "OpenClawAuthorizationSessionStatusResponse"
  });

export const openClawAuthorizationSessionRedeemResponseSchema = z
  .object({
    data: z.object({
      api_key: z.string(),
      seller_context: z.object({
        eligibility_source: sellerEligibilitySourceSchema,
        eligibility_status: sellerEligibilityStatusSchema,
        organization_id: z.string(),
        seller_account_id: z.string()
      }),
      session_id: z.string()
    })
  })
  .meta({
    description: "OpenClaw authorization-session redeem response.",
    id: "OpenClawAuthorizationSessionRedeemResponse"
  });

export function serializeSellerApiErrorBody(result: {
  code: string;
  message: string;
  retryAfterMs?: number;
}) {
  return sellerApiErrorBodySchema.parse({
    error: {
      code: result.code,
      message: result.message,
      retryAfterMs: result.retryAfterMs ?? null
    }
  });
}

export function serializeSellerContextResponse(context: SellerContext) {
  return sellerContextResponseSchema.parse({
    data: context
  });
}

export function serializeSellerPublishabilityResponse(input: {
  issues: SellerPublishabilityIssue[];
  publishable: boolean;
  sellerContext: SellerContext;
}) {
  return sellerPublishabilityResponseSchema.parse({
    data: {
      issues: input.issues,
      publishable: input.publishable,
      sellerContext: input.sellerContext
    }
  });
}
