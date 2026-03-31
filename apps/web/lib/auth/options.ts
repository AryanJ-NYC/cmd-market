import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { getAuthBaseUrl } from "./base-url";
import { sellerAccessControl, sellerOrganizationRoles } from "./access";
import { createMarketplaceId } from "../db/ids";
import { prisma } from "../db/client";
import { env } from "../env";
import { ensureSellerAccountForOrganization } from "../seller/domain";
import { sellerAccountRepository } from "../seller/repository";
import {
  OPENCLAW_API_KEY_CONFIG_ID,
  OPENCLAW_PENDING_ROTATION_API_KEY_CONFIG_ID,
  OPENCLAW_API_KEY_PREFIX,
  OPENCLAW_API_KEY_RATE_LIMIT_MAX_REQUESTS,
  OPENCLAW_API_KEY_RATE_LIMIT_WINDOW_MS
} from "../seller/workspace";

const authOptions = {
  baseURL: getAuthBaseUrl(env.nodeEnv),
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  secret: env.betterAuthSecret,
  ...(env.xClientId && env.xClientSecret
    ? {
        socialProviders: {
          twitter: {
            clientId: env.xClientId,
            clientSecret: env.xClientSecret
          }
        }
      }
    : {}),
  plugins: [
    nextCookies(),
    organization({
      ac: sellerAccessControl,
      allowUserToCreateOrganization: false,
      organizationLimit: 1,
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          await ensureSellerAccountForOrganization({
            organizationId: organization.id,
            repository: sellerAccountRepository,
            createId: createMarketplaceId,
            now: new Date()
          });
        }
      },
      roles: sellerOrganizationRoles
    }),
    apiKey([
      createOpenClawApiKeyConfiguration(OPENCLAW_API_KEY_CONFIG_ID),
      createOpenClawApiKeyConfiguration(OPENCLAW_PENDING_ROTATION_API_KEY_CONFIG_ID)
    ])
  ]
};

export const auth = betterAuth(authOptions);

function createOpenClawApiKeyConfiguration(configId: string) {
  return {
    apiKeyHeaders: "x-api-key",
    configId,
    defaultPrefix: OPENCLAW_API_KEY_PREFIX,
    enableMetadata: true,
    enableSessionForAPIKeys: false,
    permissions: {
      defaultPermissions: {
        seller: ["manage"]
      }
    },
    rateLimit: {
      enabled: true,
      maxRequests: OPENCLAW_API_KEY_RATE_LIMIT_MAX_REQUESTS,
      timeWindow: OPENCLAW_API_KEY_RATE_LIMIT_WINDOW_MS
    },
    references: "organization" as const,
    requireName: true
  };
}
