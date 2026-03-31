export const OPENCLAW_API_KEY_CONFIG_ID = "openclaw";
export const OPENCLAW_PENDING_ROTATION_API_KEY_CONFIG_ID = "openclaw_pending_rotation";
export const OPENCLAW_API_KEY_NAME = "OpenClaw";
export const OPENCLAW_API_KEY_PREFIX = "cmdmkt_";
export const OPENCLAW_API_KEY_RATE_LIMIT_MAX_REQUESTS = 300;
export const OPENCLAW_API_KEY_RATE_LIMIT_WINDOW_MS = 1000 * 60;

export function getSellerWorkspaceFlow({
  organizations,
  activeOrganizationId
}: GetSellerWorkspaceFlowOptions): SellerWorkspaceFlow {
  if (organizations.length === 0) {
    return { kind: "create" };
  }

  if (activeOrganizationId) {
    return {
      kind: "ready",
      organizationId: activeOrganizationId
    };
  }

  if (organizations.length === 1) {
    return {
      kind: "activate",
      organizationId: organizations[0].id
    };
  }

  return { kind: "select" };
}

export function assertWorkspaceCreationAllowed({
  organizations
}: AssertWorkspaceCreationAllowedOptions): void {
  if (organizations.length === 0) {
    return;
  }

  throw new SellerWorkspaceError(
    "workspace_creation_not_allowed",
    "Seller already has a workspace and must use workspace selection instead."
  );
}

export function buildOpenClawApiKeyRequest({
  organizationId,
  existingKeys
}: BuildOpenClawApiKeyRequestOptions): OpenClawApiKeyRequest {
  const existingOpenClawKey = existingKeys.find(
    (key) => key.configId === OPENCLAW_API_KEY_CONFIG_ID
  );

  if (existingOpenClawKey) {
    throw new SellerWorkspaceError(
      "openclaw_key_exists",
      "OpenClaw is already authorized for this seller workspace."
    );
  }

  return {
    configId: OPENCLAW_API_KEY_CONFIG_ID,
    organizationId,
    name: OPENCLAW_API_KEY_NAME,
    prefix: OPENCLAW_API_KEY_PREFIX,
    metadata: { integration: "openclaw" }
  };
}

export function buildSellerReturnPath(candidatePath: string | null, fallbackPath: string) {
  if (!candidatePath || !candidatePath.startsWith("/") || candidatePath.startsWith("//")) {
    return fallbackPath;
  }

  return candidatePath;
}

export function shouldAutoSubmitWorkspaceActivation(error: string | null) {
  return error === null;
}

export class SellerWorkspaceError extends Error {
  constructor(
    public readonly code: SellerWorkspaceErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SellerWorkspaceError";
  }
}

type GetSellerWorkspaceFlowOptions = {
  organizations: SellerOrganizationSummary[];
  activeOrganizationId: string | null;
};

type AssertWorkspaceCreationAllowedOptions = {
  organizations: SellerOrganizationSummary[];
};

type BuildOpenClawApiKeyRequestOptions = {
  organizationId: string;
  existingKeys: ExistingApiKeySummary[];
};

type SellerOrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

type ExistingApiKeySummary = {
  id: string;
  configId: string | null;
};

type SellerWorkspaceFlow =
  | { kind: "create" }
  | { kind: "select" }
  | { kind: "activate"; organizationId: string }
  | { kind: "ready"; organizationId: string };

type OpenClawApiKeyRequest = {
  configId: string;
  organizationId: string;
  name: string;
  prefix: string;
  metadata: { integration: "openclaw" };
};

type SellerWorkspaceErrorCode = "openclaw_key_exists" | "workspace_creation_not_allowed";
