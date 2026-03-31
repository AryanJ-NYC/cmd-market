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
