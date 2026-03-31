import { createHash, randomBytes } from "node:crypto";
import { auth } from "../auth";
import { createMarketplaceId } from "../db/ids";
import { env } from "../env";
import {
  openClawAuthorizationSessionRepository,
  type OpenClawAuthorizationSessionRecord
} from "./openclaw-authorization-repository";
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
  buildSellerReturnPath,
  buildOpenClawApiKeyRequest,
  getSellerWorkspaceFlow,
  OPENCLAW_API_KEY_CONFIG_ID,
  OPENCLAW_API_KEY_NAME,
  OPENCLAW_API_KEY_PREFIX,
  OPENCLAW_PENDING_ROTATION_API_KEY_CONFIG_ID
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

export async function createOpenClawAuthorizationSession(request: Request) {
  const now = new Date();
  const browserToken = createAuthorizationSecret();
  const exchangeCode = createAuthorizationSecret();
  const expiresAt = new Date(now.getTime() + OPENCLAW_AUTHORIZATION_SESSION_TTL_MS);

  const session = await openClawAuthorizationSessionRepository.createSession({
    authorizedAt: null,
    authorizedByUserId: null,
    browserTokenHash: hashAuthorizationSecret(browserToken),
    cancelledAt: null,
    createdAt: now,
    exchangeCodeHash: hashAuthorizationSecret(exchangeCode),
    expiredAt: null,
    expiresAt,
    failureCode: null,
    failureMessage: null,
    id: createMarketplaceId(),
    organizationId: null,
    redeemedAt: null,
    rejectedAt: null,
    status: "pending",
    updatedAt: now
  });

  return {
    data: {
      browserUrl: new URL(`/seller/authorize/openclaw/${browserToken}`, request.url).toString(),
      exchangeCode,
      expiresAt: session.expiresAt.toISOString(),
      sessionId: session.id
    },
    ok: true as const
  };
}

export async function getOpenClawAuthorizationSessionStatus(input: OpenClawAuthorizationSessionLookup) {
  const session = await readOpenClawAuthorizationSessionForExchange(input);

  if (!session) {
    throw new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization exchange is invalid.");
  }

  return {
    data: {
      expiresAt: session.expiresAt.toISOString(),
      sessionId: session.id,
      status: session.status
    },
    ok: true as const
  };
}

export async function getOpenClawAuthorizationPageState(headers: HeadersLike, browserToken: string) {
  const nextPath = buildSellerReturnPath(
    `/seller/authorize/openclaw/${browserToken}`,
    "/seller/workspace"
  );
  const pageContext = await getOpenClawAuthorizationPageContext(headers, browserToken);

  if (!pageContext.session) {
    return {
      kind: "invalid" as const
    };
  }

  if (pageContext.session.status !== "pending") {
    return {
      kind: "terminal" as const,
      sessionId: pageContext.session.id,
      status: pageContext.session.status
    };
  }

  if (!pageContext.workspaceData) {
    return {
      kind: "sign_in_required" as const,
      nextPath
    };
  }

  if (
    pageContext.workspaceData.flow.kind !== "ready" ||
    !pageContext.workspaceData.activeOrganization ||
    !pageContext.workspaceData.activeSellerAccount
  ) {
    return {
      kind: "workspace_required" as const,
      nextPath
    };
  }

  return {
    email: pageContext.workspaceData.session.email,
    kind: "consent" as const,
    sessionId: pageContext.session.id,
    workspace: pageContext.workspaceData.activeOrganization
  };
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

  let created: Awaited<ReturnType<typeof auth.api.createApiKey>>;

  try {
    created = await auth.api.createApiKey({
      body: request,
      headers: requestHeaders
    });
  } catch (caughtError) {
    const refreshedKeys = await listOpenClawApiKeys(requestHeaders, organizationId);

    buildOpenClawApiKeyRequest({
      organizationId,
      existingKeys: refreshedKeys.map((key) => ({
        configId: key.configId,
        id: key.id
      }))
    });

    throw caughtError;
  }

  const refreshedKeys = await listOpenClawApiKeys(requestHeaders, organizationId);

  return {
    createdKey: created,
    keys: refreshedKeys
  };
}

export async function authorizeOpenClawAuthorizationSession(headers: HeadersLike, browserToken: string) {
  const pageContext = await getOpenClawAuthorizationPageContext(headers, browserToken);

  if (!pageContext.session) {
    throw new SellerDomainError(404, "authorization_not_found", "OpenClaw authorization session was not found.");
  }

  if (pageContext.session.status === "authorized" && pageContext.session.organizationId) {
    if (
      !pageContext.workspaceData ||
      pageContext.workspaceData.flow.kind !== "ready" ||
      !pageContext.workspaceData.activeOrganization
    ) {
      throw new SellerDomainError(
        409,
        "organization_context_required",
        "Choose a seller workspace before authorizing OpenClaw."
      );
    }

    return {
      data: {
        sessionId: pageContext.session.id,
        status: pageContext.session.status,
        workspace: pageContext.workspaceData.activeOrganization
      },
      ok: true as const
    };
  }

  assertOpenClawAuthorizationPending(pageContext.session);

  if (
    !pageContext.workspaceData ||
    pageContext.workspaceData.flow.kind !== "ready" ||
    !pageContext.workspaceData.activeOrganization
  ) {
    throw new SellerDomainError(
      409,
      "organization_context_required",
      "Choose a seller workspace before authorizing OpenClaw."
    );
  }

  const authorizedSession = await openClawAuthorizationSessionRepository.markAuthorized({
    authorizedAt: new Date(),
    authorizedByUserId: pageContext.workspaceData.session.id,
    id: pageContext.session.id,
    organizationId: pageContext.workspaceData.activeOrganization.id
  });

  if (!authorizedSession.applied) {
    const currentSession = await requireResolvedOpenClawAuthorizationSession(authorizedSession.session);

    if (
      currentSession.status === "authorized" &&
      currentSession.organizationId === pageContext.workspaceData.activeOrganization.id
    ) {
      return {
        data: {
          sessionId: currentSession.id,
          status: currentSession.status,
          workspace: pageContext.workspaceData.activeOrganization
        },
        ok: true as const
      };
    }

    throw createOpenClawRedeemError(currentSession.status);
  }

  await openClawAuthorizationSessionRepository.createAuditEvent({
    action: "openclaw_authorization.approved",
    actorApiKeyId: null,
    actorType: "user",
    actorUserId: pageContext.workspaceData.session.id,
    createdAt: authorizedSession.session.authorizedAt ?? new Date(),
    entityId: authorizedSession.session.id,
    entityTable: "openclaw_authorization_session",
    id: createMarketplaceId(),
    metadata: {
      organizationId: pageContext.workspaceData.activeOrganization.id,
      sessionStatus: authorizedSession.session.status
    },
    note: "Seller approved OpenClaw workspace access.",
    sellerAccountId: pageContext.workspaceData.activeSellerAccount?.id ?? null
  });

  return {
    data: {
      sessionId: authorizedSession.session.id,
      status: authorizedSession.session.status,
      workspace: pageContext.workspaceData.activeOrganization
    },
    ok: true as const
  };
}

export async function rejectOpenClawAuthorizationSession(headers: HeadersLike, browserToken: string) {
  const pageContext = await getOpenClawAuthorizationPageContext(headers, browserToken);

  if (!pageContext.session) {
    throw new SellerDomainError(404, "authorization_not_found", "OpenClaw authorization session was not found.");
  }

  assertOpenClawAuthorizationPending(pageContext.session);
  const workspaceData = requireOpenClawAuthorizationWorkspace(pageContext, "rejecting");

  const rejectedAt = new Date();
  const rejectedSession = await openClawAuthorizationSessionRepository.markRejected({
    id: pageContext.session.id,
    rejectedAt
  });

  if (!rejectedSession.applied) {
    const currentSession = await requireResolvedOpenClawAuthorizationSession(rejectedSession.session);

    if (currentSession.status === "rejected") {
      return {
        data: {
          sessionId: currentSession.id,
          status: currentSession.status
        },
        ok: true as const
      };
    }

    throw createOpenClawRedeemError(currentSession.status);
  }

  await openClawAuthorizationSessionRepository.createAuditEvent({
    action: "openclaw_authorization.rejected",
    actorApiKeyId: null,
    actorType: "user",
    actorUserId: workspaceData.session.id,
    createdAt: rejectedAt,
    entityId: rejectedSession.session.id,
    entityTable: "openclaw_authorization_session",
    id: createMarketplaceId(),
    metadata: {
      organizationId: workspaceData.activeOrganization.id,
      sessionStatus: rejectedSession.session.status
    },
    note: "OpenClaw workspace access was rejected.",
    sellerAccountId: workspaceData.activeSellerAccount.id
  });

  return {
    data: {
      sessionId: rejectedSession.session.id,
      status: rejectedSession.session.status
    },
    ok: true as const
  };
}

export async function cancelOpenClawAuthorizationSession(headers: HeadersLike, browserToken: string) {
  const pageContext = await getOpenClawAuthorizationPageContext(headers, browserToken);

  if (!pageContext.session) {
    throw new SellerDomainError(404, "authorization_not_found", "OpenClaw authorization session was not found.");
  }

  assertOpenClawAuthorizationPending(pageContext.session);
  const workspaceData = requireOpenClawAuthorizationWorkspace(pageContext, "cancelling");

  const cancelledAt = new Date();

  const cancelledSession = await openClawAuthorizationSessionRepository.markCancelled({
    cancelledAt,
    id: pageContext.session.id
  });

  if (!cancelledSession.applied) {
    const currentSession = await requireResolvedOpenClawAuthorizationSession(cancelledSession.session);

    if (currentSession.status === "cancelled") {
      return {
        data: {
          sessionId: currentSession.id,
          status: currentSession.status
        },
        ok: true as const
      };
    }

    throw createOpenClawRedeemError(currentSession.status);
  }

  await openClawAuthorizationSessionRepository.createAuditEvent({
    action: "openclaw_authorization.cancelled",
    actorApiKeyId: null,
    actorType: "user",
    actorUserId: workspaceData.session.id,
    createdAt: cancelledAt,
    entityId: cancelledSession.session.id,
    entityTable: "openclaw_authorization_session",
    id: createMarketplaceId(),
    metadata: {
      organizationId: workspaceData.activeOrganization.id,
      sessionStatus: cancelledSession.session.status
    },
    note: "OpenClaw authorization session was cancelled.",
    sellerAccountId: workspaceData.activeSellerAccount.id
  });

  return {
    data: {
      sessionId: cancelledSession.session.id,
      status: cancelledSession.session.status
    },
    ok: true as const
  };
}

export async function redeemOpenClawAuthorizationSession(input: OpenClawAuthorizationSessionLookup) {
  const session = await readOpenClawAuthorizationSessionForExchange(input);

  if (!session) {
    throw new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization exchange is invalid.");
  }

  if (session.status !== "authorized" || !session.organizationId || !session.authorizedByUserId) {
    throw createOpenClawRedeemError(session.status);
  }

  const sellerAccount = await sellerAccountRepository.findByOrganizationId(session.organizationId);

  if (!sellerAccount) {
    throw new SellerDomainError(
      403,
      "seller_workspace_not_found",
      "Seller workspace could not be resolved for the authorized OpenClaw session."
    );
  }

  const existingKey = await openClawAuthorizationSessionRepository.findApiKeyByOrganizationId(
    session.organizationId
  );

  const createdKey = await createOpenClawPendingRotationApiKey(input, session);

  const redeemedAt = new Date();

  try {
    const redeemResult = await openClawAuthorizationSessionRepository.redeemSessionWithApiKeyRotation({
      auditEvent: {
        action: "openclaw_authorization.redeemed",
        actorApiKeyId: null,
        actorType: "system",
        actorUserId: null,
        createdAt: redeemedAt,
        entityId: session.id,
        entityTable: "openclaw_authorization_session",
        id: createMarketplaceId(),
        metadata: {
          newApiKeyId: createdKey.id,
          organizationId: session.organizationId,
          replacedApiKeyId: existingKey?.id ?? null,
          sessionStatus: "redeemed"
        },
        note: "OpenClaw authorization session was redeemed into a seller API key.",
        sellerAccountId: sellerAccount.id
      },
      newApiKeyId: createdKey.id,
      previousApiKeyId: existingKey?.id ?? null,
      redeemedAt,
      sessionId: session.id
    });

    if (!redeemResult.applied) {
      throw createOpenClawRedeemError(
        (await requireResolvedOpenClawAuthorizationSession(redeemResult.session)).status
      );
    }
  } catch (caughtError) {
    const normalizedError = await normalizeOpenClawRedeemFailure({
      error: caughtError,
      input,
      organizationId: session.organizationId
    });

    try {
      await openClawAuthorizationSessionRepository.deleteApiKeyById(createdKey.id);
    } catch (cleanupError) {
      throw new AggregateError(
        [normalizedError, cleanupError],
        "OpenClaw redeem failed and cleanup of the staged API key also failed."
      );
    }

    throw normalizedError;
  }

  return {
    data: {
      apiKey: createdKey.key,
      sellerContext: {
        eligibilitySource: sellerAccount.listingEligibilitySource,
        eligibilityStatus: sellerAccount.listingEligibilityStatus,
        organizationId: sellerAccount.organizationId,
        sellerAccountId: sellerAccount.id
      },
      sessionId: session.id
    },
    ok: true as const
  };
}

export async function createSellerWorkspace(headers: HeadersLike, input: CreateSellerWorkspaceInput) {
  const requestHeaders = toHeaders(headers);
  const session = await requireSellerSession(requestHeaders);

  const organizations = await listSellerOrganizations(requestHeaders);
  assertWorkspaceCreationAllowed({ organizations });

  const createdOrganization = await auth.api.createOrganization({
    body: {
      keepCurrentActiveOrganization: false,
      name: input.name,
      slug: input.slug,
      userId: session.user.id
    }
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
    auditEventId: createMarketplaceId(),
    actorUserEmail: workspaceData.session.email,
    actorUserId: workspaceData.session.id,
    allowlistedEmails: env.developmentSellerOverrideEmails,
    developmentOverrideEnabled: env.allowDevelopmentOverrides,
    note,
    now: new Date(),
    repository: sellerAccountRepository,
    sellerAccountId: workspaceData.activeSellerAccount.id
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
      const retryAfterMs = getApiKeyRetryAfterMs(verification.error);

      return {
        code: verification.error?.code ?? "unauthorized",
        message: getApiKeyVerificationMessage(verification.error),
        ok: false,
        retryAfterMs,
        status: verification.error?.code === "RATE_LIMITED" ? 429 : 401
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

function createAuthorizationSecret() {
  return randomBytes(24).toString("base64url");
}

function hashAuthorizationSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function createOpenClawPendingRotationApiKey(
  input: OpenClawAuthorizationSessionLookup,
  session: OpenClawAuthorizationSessionRecord
) {
  try {
    return await auth.api.createApiKey({
      body: {
        configId: OPENCLAW_PENDING_ROTATION_API_KEY_CONFIG_ID,
        metadata: { integration: "openclaw" },
        name: OPENCLAW_API_KEY_NAME,
        organizationId: session.organizationId,
        prefix: OPENCLAW_API_KEY_PREFIX,
        userId: session.authorizedByUserId
      }
    });
  } catch (caughtError) {
    if (!isOpenClawApiKeyUniquenessConflictError(caughtError)) {
      throw caughtError;
    }

    const currentSession = await readOpenClawAuthorizationSessionForExchange(input);

    if (!currentSession) {
      throw new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization exchange is invalid.");
    }

    throw createOpenClawRedeemError(currentSession.status);
  }
}

async function normalizeOpenClawRedeemFailure(input: {
  error: unknown;
  input: OpenClawAuthorizationSessionLookup;
  organizationId: string;
}) {
  if (!isOpenClawApiKeyUniquenessConflictError(input.error)) {
    return input.error;
  }

  const [currentSession, currentOpenClawKey] = await Promise.all([
    readOpenClawAuthorizationSessionForExchange(input.input),
    openClawAuthorizationSessionRepository.findApiKeyByOrganizationId(input.organizationId)
  ]);

  if (currentOpenClawKey) {
    return createOpenClawRedeemError("redeemed");
  }

  if (!currentSession) {
    return new SellerDomainError(401, "unauthorized_exchange", "OpenClaw authorization exchange is invalid.");
  }

  return createOpenClawRedeemError(currentSession.status);
}

async function requireResolvedOpenClawAuthorizationSession(session: OpenClawAuthorizationSessionRecord) {
  const resolvedSession = await resolveExpiredOpenClawAuthorizationSession(session);

  if (!resolvedSession) {
    throw new SellerDomainError(404, "authorization_not_found", "OpenClaw authorization session was not found.");
  }

  return resolvedSession;
}

function requireOpenClawAuthorizationWorkspace(
  pageContext: Awaited<ReturnType<typeof getOpenClawAuthorizationPageContext>>,
  action: "cancelling" | "rejecting"
) {
  const workspaceData = pageContext.workspaceData;
  const activeOrganization = workspaceData?.activeOrganization ?? null;
  const activeSellerAccount = workspaceData?.activeSellerAccount ?? null;

  if (
    !workspaceData ||
    workspaceData.flow.kind !== "ready" ||
    !activeOrganization ||
    !activeSellerAccount
  ) {
    throw new SellerDomainError(
      409,
      "organization_context_required",
      `Choose a seller workspace before ${action} OpenClaw.`
    );
  }

  return {
    ...workspaceData,
    activeOrganization,
    activeSellerAccount
  };
}

async function getOpenClawAuthorizationPageContext(headers: HeadersLike, browserToken: string) {
  const session = await readOpenClawAuthorizationSessionByBrowserToken(browserToken);

  if (!session) {
    return {
      session: null,
      workspaceData: null
    };
  }

  return {
    session,
    workspaceData: await getSellerWorkspacePageData(headers)
  };
}

async function readOpenClawAuthorizationSessionByBrowserToken(browserToken: string) {
  const session = await openClawAuthorizationSessionRepository.findSessionByBrowserTokenHash(
    hashAuthorizationSecret(browserToken)
  );

  return resolveExpiredOpenClawAuthorizationSession(session);
}

async function readOpenClawAuthorizationSessionForExchange(input: OpenClawAuthorizationSessionLookup) {
  const session = await openClawAuthorizationSessionRepository.findSessionByIdAndExchangeCodeHash(
    input.sessionId,
    hashAuthorizationSecret(input.exchangeCode)
  );

  return resolveExpiredOpenClawAuthorizationSession(session);
}

async function resolveExpiredOpenClawAuthorizationSession(
  session: OpenClawAuthorizationSessionRecord | null
) {
  if (!session) {
    return null;
  }

  if (!shouldExpireOpenClawAuthorizationSession(session, new Date())) {
    return session;
  }

  return openClawAuthorizationSessionRepository.markExpired({
    expiredAt: new Date(),
    failureCode: "authorization_expired",
    failureMessage: "OpenClaw authorization session expired before completion.",
    id: session.id
  });
}

function assertOpenClawAuthorizationPending(session: OpenClawAuthorizationSessionRecord) {
  if (session.status === "pending") {
    return;
  }

  throw createOpenClawRedeemError(session.status);
}

function createOpenClawRedeemError(status: OpenClawAuthorizationSessionRecord["status"]) {
  switch (status) {
    case "authorized":
    case "pending":
      return new SellerDomainError(
        409,
        "authorization_pending",
        "OpenClaw authorization is not ready to redeem yet."
      );
    case "cancelled":
      return new SellerDomainError(
        409,
        "authorization_cancelled",
        "OpenClaw authorization session was cancelled."
      );
    case "expired":
      return new SellerDomainError(
        409,
        "authorization_expired",
        "OpenClaw authorization session has expired."
      );
    case "redeemed":
      return new SellerDomainError(
        409,
        "authorization_redeemed",
        "OpenClaw authorization session has already been redeemed."
      );
    case "rejected":
      return new SellerDomainError(
        409,
        "authorization_rejected",
        "OpenClaw authorization session was rejected."
      );
  }
}

function isOpenClawApiKeyUniquenessConflictError(error: unknown) {
  const uniqueTarget = readPrismaUniqueTarget(error);

  if (uniqueTarget.length > 0) {
    return uniqueTarget.some((value) => value.includes("config")) &&
      uniqueTarget.some((value) => value.includes("reference"));
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const looksLikeUniqueConflict =
    message.includes("p2002") ||
    message.includes("unique constraint") ||
    message.includes("duplicate key");

  return looksLikeUniqueConflict &&
    (message.includes("configid") || message.includes("config_id")) &&
    (message.includes("referenceid") || message.includes("reference_id"));
}

function readPrismaUniqueTarget(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code?: unknown }).code !== "P2002" ||
    !("meta" in error)
  ) {
    return [];
  }

  const target = (error as { meta?: { target?: unknown } }).meta?.target;

  if (Array.isArray(target)) {
    return target
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());
  }

  if (typeof target === "string") {
    return [target.toLowerCase()];
  }

  return [];
}

function shouldExpireOpenClawAuthorizationSession(
  session: OpenClawAuthorizationSessionRecord,
  now: Date
) {
  return (
    (session.status === "authorized" || session.status === "pending") &&
    session.expiresAt.getTime() <= now.getTime()
  );
}

function readActiveOrganizationId(session: Record<string, unknown>) {
  return typeof session.activeOrganizationId === "string" ? session.activeOrganizationId : null;
}

function getApiKeyVerificationMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Valid seller API key is required.";
}

function getApiKeyRetryAfterMs(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "details" in error &&
    typeof error.details === "object" &&
    error.details !== null &&
    "tryAgainIn" in error.details &&
    typeof error.details.tryAgainIn === "number"
  ) {
    return error.details.tryAgainIn;
  }

  return undefined;
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

const OPENCLAW_AUTHORIZATION_SESSION_TTL_MS = 1000 * 60 * 15;

type OpenClawAuthorizationSessionLookup = {
  exchangeCode: string;
  sessionId: string;
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
