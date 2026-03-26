import { auth } from "../auth";
import { createMarketplaceId } from "../db/ids";
import { env } from "../env";
import {
  applyDevelopmentEligibilityOverride,
  ensureSellerAccountForOrganization,
  getSellerPublishability,
  resolveSellerContextFromApiKey,
  resolveSellerContextFromSession,
  SellerAccountRecord,
  SellerContextResolution,
  SellerDomainError
} from "./domain";
import { sellerAccountRepository } from "./repository";
import {
  assertWorkspaceCreationAllowed,
  buildOpenClawApiKeyRequest,
  getSellerWorkspaceFlow,
  OPENCLAW_API_KEY_CONFIG_ID
} from "./workspace";

export async function activateSellerWorkspace(headers: HeadersLike, organizationId: string) {
  const requestHeaders = toHeaders(headers);
  const session = await requireSellerSession(requestHeaders);
  const organizations = await listSellerOrganizations(requestHeaders);

  if (!organizations.some((organization) => organization.id === organizationId)) {
    throw new SellerDomainError(403, "forbidden", "Authenticated user is not a member of that seller workspace.");
  }

  await auth.api.setActiveOrganization({
    body: { organizationId },
    headers: requestHeaders
  });

  await ensureSellerAccountForOrganization({
    organizationId,
    repository: sellerAccountRepository,
    createId: createMarketplaceId,
    now: new Date()
  });

  return session;
}

export async function createOpenClawApiKey(headers: HeadersLike, organizationId: string) {
  const requestHeaders = toHeaders(headers);
  const existingKeys = await listOpenClawApiKeys(requestHeaders, organizationId);
  const request = buildOpenClawApiKeyRequest({
    organizationId,
    existingKeys: existingKeys.map((key) => ({
      id: key.id,
      configId: key.configId
    }))
  });

  const created = await auth.api.createApiKey({
    body: request,
    headers: requestHeaders
  });

  const refreshedKeys = await listOpenClawApiKeys(requestHeaders, organizationId);

  return {
    createdKey: created,
    keys: refreshedKeys
  };
}

export async function createSellerWorkspace(headers: HeadersLike, input: CreateSellerWorkspaceInput) {
  const requestHeaders = toHeaders(headers);
  await requireSellerSession(requestHeaders);

  const organizations = await listSellerOrganizations(requestHeaders);
  assertWorkspaceCreationAllowed({ organizations });

  const createdOrganization = await auth.api.createOrganization({
    body: {
      keepCurrentActiveOrganization: false,
      name: input.name,
      slug: input.slug
    },
    headers: requestHeaders
  });

  await ensureSellerAccountForOrganization({
    organizationId: createdOrganization.id,
    repository: sellerAccountRepository,
    createId: createMarketplaceId,
    now: new Date()
  });

  await auth.api.setActiveOrganization({
    body: { organizationId: createdOrganization.id },
    headers: requestHeaders
  });

  return createdOrganization;
}

export async function getSellerWorkspacePageData(headers: HeadersLike): Promise<SellerWorkspacePageData | null> {
  const requestHeaders = toHeaders(headers);
  const sessionResult = await auth.api.getSession({ headers: requestHeaders });

  if (!sessionResult) {
    return null;
  }

  const organizations = await listSellerOrganizations(requestHeaders);
  const sessionActiveOrganizationId = readActiveOrganizationId(sessionResult.session);
  const activeOrganizationId = organizations.some(
    (organization) => organization.id === sessionActiveOrganizationId
  )
    ? sessionActiveOrganizationId
    : null;

  const flow = getSellerWorkspaceFlow({
    organizations,
    activeOrganizationId
  });

  const activeOrganization =
    flow.kind === "activate" || flow.kind === "ready"
      ? organizations.find((organization) => organization.id === flow.organizationId) ?? null
      : null;

  const activeSellerAccount = activeOrganization
    ? await ensureSellerAccountForOrganization({
        organizationId: activeOrganization.id,
        repository: sellerAccountRepository,
        createId: createMarketplaceId,
        now: new Date()
      })
    : null;

  const apiKeys = activeOrganization ? await listOpenClawApiKeys(requestHeaders, activeOrganization.id) : [];

  return {
    activeOrganization,
    activeSellerAccount,
    apiKeys,
    developmentOverrideAllowed: isDevelopmentOverrideAllowed(sessionResult.user.email),
    flow,
    organizations,
    session: {
      email: sessionResult.user.email,
      id: sessionResult.user.id,
      name: sessionResult.user.name
    }
  };
}

async function listOpenClawApiKeys(headers: HeadersLike, organizationId: string) {
  const requestHeaders = toHeaders(headers);
  const result = await auth.api.listApiKeys({
    headers: requestHeaders,
    query: {
      configId: OPENCLAW_API_KEY_CONFIG_ID,
      organizationId
    }
  });

  return result.apiKeys.map((key) => ({
    configId: key.configId,
    createdAt: key.createdAt,
    id: key.id,
    lastRequest: key.lastRequest,
    metadata: key.metadata,
    name: key.name,
    permissions: key.permissions,
    prefix: key.prefix,
    start: key.start
  }));
}

async function listSellerOrganizations(headers: HeadersLike) {
  const requestHeaders = toHeaders(headers);
  const organizations = await auth.api.listOrganizations({ headers: requestHeaders });

  for (const organization of organizations) {
    await ensureSellerAccountForOrganization({
      organizationId: organization.id,
      repository: sellerAccountRepository,
      createId: createMarketplaceId,
      now: new Date()
    });
  }

  return organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    slug: organization.slug
  }));
}

export async function overrideSellerEligibility(headers: HeadersLike, note: string | null) {
  if (!env.allowDevelopmentOverrides) {
    throw new SellerDomainError(
      403,
      "forbidden",
      "Development seller override is unavailable in production."
    );
  }

  const workspaceData = await getSellerWorkspacePageData(headers);

  if (!workspaceData) {
    throw new SellerDomainError(401, "unauthorized", "Authentication is required.");
  }

  if (!workspaceData.activeSellerAccount) {
    throw new SellerDomainError(
      409,
      "organization_context_required",
      "An active seller workspace is required for this request."
    );
  }

  return applyDevelopmentEligibilityOverride({
    actorUserEmail: workspaceData.session.email,
    actorUserId: workspaceData.session.id,
    allowlistedEmails: env.developmentSellerOverrideEmails,
    developmentOverrideEnabled: env.allowDevelopmentOverrides,
    note,
    now: new Date(),
    repository: sellerAccountRepository,
    sellerAccountId: workspaceData.activeSellerAccount.id,
    writeAuditEvent: async (event) => {
      await sellerAccountRepository.createAuditEvent({
        action: event.action,
        actorApiKeyId: event.actorApiKeyId,
        actorType: event.actorType,
        actorUserId: event.actorUserId,
        createdAt: event.createdAt,
        entityId: event.entityId,
        entityTable: event.entityTable,
        id: createMarketplaceId(),
        metadata: event.metadata,
        note: typeof event.metadata.note === "string" ? event.metadata.note : null,
        sellerAccountId: event.sellerAccountId
      });
    }
  });
}

export async function resolveSellerRequestContext(request: Request): Promise<SellerContextResolution> {
  const apiKeyValue = request.headers.get("x-api-key");

  if (apiKeyValue) {
    const verification = await auth.api.verifyApiKey({
      body: {
        configId: OPENCLAW_API_KEY_CONFIG_ID,
        key: apiKeyValue,
        permissions: { seller: ["manage"] }
      },
      headers: request.headers
    });

    if (!verification.valid || !verification.key) {
      return {
        code: verification.error?.code ?? "unauthorized",
        message: "Valid seller API key is required.",
        ok: false,
        status: 401
      };
    }

    await ensureSellerAccountForOrganization({
      organizationId: verification.key.referenceId,
      repository: sellerAccountRepository,
      createId: createMarketplaceId,
      now: new Date()
    });

    return resolveSellerContextFromApiKey({
      apiKey: {
        id: verification.key.id,
        organizationId: verification.key.referenceId
      },
      repository: sellerAccountRepository
    });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const organizations = session ? await listSellerOrganizations(request.headers) : [];
  const sessionActiveOrganizationId = session ? readActiveOrganizationId(session.session) : null;

  if (sessionActiveOrganizationId) {
    await ensureSellerAccountForOrganization({
      organizationId: sessionActiveOrganizationId,
      repository: sellerAccountRepository,
      createId: createMarketplaceId,
      now: new Date()
    });
  }

  return resolveSellerContextFromSession({
    membershipOrganizationIds: organizations.map((organization) => organization.id),
    repository: sellerAccountRepository,
    session: session
      ? {
          activeOrganizationId: sessionActiveOrganizationId,
          userId: session.user.id
        }
      : null
  });
}

export async function resolveSellerPublishability(request: Request) {
  const context = await resolveSellerRequestContext(request);

  if (!context.ok) {
    return context;
  }

  const sellerAccount = await sellerAccountRepository.findBySellerAccountId(context.context.sellerAccountId);

  if (!sellerAccount) {
    return {
      code: "seller_workspace_not_found",
      message: "Seller workspace could not be resolved for this request.",
      ok: false as const,
      status: 403 as const
    };
  }

  return {
    context: context.context,
    ok: true as const,
    publishability: getSellerPublishability(sellerAccount),
    sellerAccount
  };
}

async function requireSellerSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new SellerDomainError(401, "unauthorized", "Authentication is required.");
  }

  return session;
}

function isDevelopmentOverrideAllowed(email: string) {
  return env.allowDevelopmentOverrides && env.developmentSellerOverrideEmails.some(
    (allowlistedEmail) => allowlistedEmail.toLowerCase() === email.toLowerCase()
  );
}

function readActiveOrganizationId(session: Record<string, unknown>) {
  return typeof session.activeOrganizationId === "string" ? session.activeOrganizationId : null;
}

function toHeaders(headers: HeadersLike): Headers {
  if (headers instanceof Headers) {
    return headers;
  }

  return new Headers(Array.from(headers.entries()));
}

type CreateSellerWorkspaceInput = {
  name: string;
  slug: string;
};

type SellerWorkspacePageData = {
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  activeSellerAccount: SellerAccountRecord | null;
  apiKeys: Awaited<ReturnType<typeof listOpenClawApiKeys>>;
  developmentOverrideAllowed: boolean;
  flow: ReturnType<typeof getSellerWorkspaceFlow>;
  organizations: Awaited<ReturnType<typeof listSellerOrganizations>>;
  session: {
    email: string;
    id: string;
    name: string;
  };
};

type HeadersLike = {
  entries(): IterableIterator<[string, string]>;
  get(name: string): string | null;
};
