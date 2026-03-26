export async function ensureSellerAccountForOrganization({
  organizationId,
  repository,
  createId,
  now
}: EnsureSellerAccountForOrganizationInput): Promise<SellerAccountRecord> {
  const existingAccount = await repository.findByOrganizationId(organizationId);

  if (existingAccount) {
    return existingAccount;
  }

  return repository.create({
    id: createId(),
    organizationId,
    status: "active",
    listingEligibilityStatus: "pending",
    listingEligibilitySource: null,
    listingEligibilityNote: null,
    defaultDisplayCurrencyCode: DEFAULT_DISPLAY_CURRENCY_CODE,
    createdAt: now,
    updatedAt: now
  });
}

export async function resolveSellerContextFromSession({
  session,
  membershipOrganizationIds,
  repository
}: ResolveSellerContextFromSessionInput): Promise<SellerContextResolution> {
  if (!session) {
    return createResolutionError(401, "unauthorized", "Authentication is required.");
  }

  if (!session.activeOrganizationId) {
    return createResolutionError(
      409,
      "organization_context_required",
      "An active seller workspace is required for this request."
    );
  }

  if (!membershipOrganizationIds.includes(session.activeOrganizationId)) {
    return createResolutionError(
      403,
      "forbidden",
      "Authenticated user is not a member of the active seller workspace."
    );
  }

  const sellerAccount = await repository.findByOrganizationId(session.activeOrganizationId);

  if (!sellerAccount) {
    return createResolutionError(
      403,
      "seller_workspace_not_found",
      "Seller workspace could not be resolved for the active organization."
    );
  }

  return {
    ok: true,
    context: {
      sellerAccountId: sellerAccount.id,
      organizationId: sellerAccount.organizationId,
      eligibilityStatus: sellerAccount.listingEligibilityStatus,
      eligibilitySource: sellerAccount.listingEligibilitySource,
      actorType: "user",
      actorUserId: session.userId,
      actorApiKeyId: null
    }
  };
}

export async function resolveSellerContextFromApiKey({
  apiKey,
  repository
}: ResolveSellerContextFromApiKeyInput): Promise<SellerContextResolution> {
  if (!apiKey?.organizationId) {
    return createResolutionError(401, "unauthorized", "Valid seller API key is required.");
  }

  const sellerAccount = await repository.findByOrganizationId(apiKey.organizationId);

  if (!sellerAccount) {
    return createResolutionError(
      403,
      "seller_workspace_not_found",
      "Seller workspace could not be resolved for the provided API key."
    );
  }

  return {
    ok: true,
    context: {
      sellerAccountId: sellerAccount.id,
      organizationId: sellerAccount.organizationId,
      eligibilityStatus: sellerAccount.listingEligibilityStatus,
      eligibilitySource: sellerAccount.listingEligibilitySource,
      actorType: "api_key",
      actorUserId: null,
      actorApiKeyId: apiKey.id
    }
  };
}

export function getSellerPublishability(
  sellerAccount: SellerAccountRecord
): SellerPublishabilityResult {
  if (sellerAccount.status !== "active") {
    return {
      publishable: false,
      issues: [
        {
          code: "seller_not_active",
          message: "Seller workspace is not active."
        }
      ]
    };
  }

  if (sellerAccount.listingEligibilityStatus !== "eligible") {
    return {
      publishable: false,
      issues: [
        {
          code: "seller_not_eligible",
          message: "Seller workspace is not eligible to publish listings."
        }
      ]
    };
  }

  return {
    publishable: true,
    issues: []
  };
}

export async function applyDevelopmentEligibilityOverride({
  actorUserId,
  actorUserEmail,
  allowlistedEmails,
  note,
  now,
  sellerAccountId,
  repository,
  writeAuditEvent
}: ApplyDevelopmentEligibilityOverrideInput): Promise<SellerAccountRecord> {
  if (!isAllowlistedEmail(actorUserEmail, allowlistedEmails)) {
    throw new SellerDomainError(403, "forbidden", "Seller is not allowlisted for development overrides.");
  }

  const sellerAccount = await repository.findBySellerAccountId(sellerAccountId);

  if (!sellerAccount) {
    throw new SellerDomainError(404, "seller_account_not_found", "Seller account does not exist.");
  }

  const updatedAccount = await repository.updateEligibility({
    sellerAccountId,
    listingEligibilityStatus: "eligible",
    listingEligibilitySource: "manual_override",
    listingEligibilityNote: note,
    updatedAt: now
  });

  await writeAuditEvent({
    entityTable: "seller_account",
    entityId: sellerAccountId,
    action: "seller_account.manual_override_approved",
    actorType: "user",
    actorUserId,
    actorApiKeyId: null,
    sellerAccountId,
    metadata: {
      note
    },
    createdAt: now
  });

  return updatedAccount;
}

function createResolutionError(
  status: ResolutionErrorStatus,
  code: string,
  message: string
): SellerContextResolution {
  return {
    ok: false,
    status,
    code,
    message
  };
}

function isAllowlistedEmail(email: string, allowlistedEmails: string[]) {
  const normalizedEmail = email.trim().toLowerCase();

  return allowlistedEmails.some((value) => value.trim().toLowerCase() === normalizedEmail);
}

const DEFAULT_DISPLAY_CURRENCY_CODE = "USD";

export class SellerDomainError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "SellerDomainError";
  }
}

type EnsureSellerAccountForOrganizationInput = {
  organizationId: string;
  repository: SellerAccountRepository;
  createId: () => string;
  now: Date;
};

type ResolveSellerContextFromSessionInput = {
  session: SessionActor | null;
  membershipOrganizationIds: string[];
  repository: SellerAccountRepository;
};

type ResolveSellerContextFromApiKeyInput = {
  apiKey: ApiKeyActor | null;
  repository: SellerAccountRepository;
};

type ApplyDevelopmentEligibilityOverrideInput = {
  actorUserId: string;
  actorUserEmail: string;
  allowlistedEmails: string[];
  note: string | null;
  now: Date;
  sellerAccountId: string;
  repository: SellerAccountRepository;
  writeAuditEvent: AuditEventWriter;
};

type ResolutionErrorStatus = 401 | 403 | 409;

type SessionActor = {
  userId: string;
  activeOrganizationId: string | null;
};

type ApiKeyActor = {
  id: string;
  organizationId: string | null;
};

type SellerPublishabilityResult = {
  publishable: boolean;
  issues: SellerPublishabilityIssue[];
};

export type SellerPublishabilityIssue = {
  code: string;
  message: string;
};

type AuditEventWriter = (event: AuditEventInput) => Promise<void>;

type AuditEventInput = {
  entityTable: string;
  entityId: string;
  action: string;
  actorType: "user" | "api_key" | "system" | "admin";
  actorUserId: string | null;
  actorApiKeyId: string | null;
  sellerAccountId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type SellerAccountRepository = {
  create(record: SellerAccountRecord): Promise<SellerAccountRecord>;
  findByOrganizationId(organizationId: string): Promise<SellerAccountRecord | null>;
  findBySellerAccountId(sellerAccountId: string): Promise<SellerAccountRecord | null>;
  updateEligibility(input: UpdateSellerEligibilityInput): Promise<SellerAccountRecord>;
};

type UpdateSellerEligibilityInput = {
  sellerAccountId: string;
  listingEligibilityStatus: SellerEligibilityStatus;
  listingEligibilitySource: SellerEligibilitySource;
  listingEligibilityNote: string | null;
  updatedAt: Date;
};

export type SellerAccountRecord = {
  id: string;
  organizationId: string;
  status: SellerStatus;
  listingEligibilityStatus: SellerEligibilityStatus;
  listingEligibilitySource: SellerEligibilitySource;
  listingEligibilityNote: string | null;
  defaultDisplayCurrencyCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SellerStatus = "active" | "suspended" | "closed";

export type SellerEligibilityStatus = "pending" | "eligible" | "revoked" | "suspended";

export type SellerEligibilitySource = "manual_override" | "x_verification" | null;

export type SellerContext = {
  sellerAccountId: string;
  organizationId: string;
  eligibilityStatus: SellerEligibilityStatus;
  eligibilitySource: SellerEligibilitySource;
  actorType: "user" | "api_key";
  actorUserId: string | null;
  actorApiKeyId: string | null;
};

export type SellerContextResolution =
  | {
      ok: true;
      context: SellerContext;
    }
  | {
      ok: false;
      status: ResolutionErrorStatus;
      code: string;
      message: string;
    };
