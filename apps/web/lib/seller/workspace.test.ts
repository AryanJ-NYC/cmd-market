import { describe, expect, it } from "vitest";
import {
  OPENCLAW_API_KEY_CONFIG_ID,
  OPENCLAW_API_KEY_NAME,
  OPENCLAW_API_KEY_PREFIX,
  SellerWorkspaceError,
  buildOpenClawApiKeyRequest,
  getSellerWorkspaceFlow,
  assertWorkspaceCreationAllowed,
  shouldAutoSubmitWorkspaceActivation
} from "./workspace";

describe("seller workspace", () => {
  it("routes sellers with no workspaces to creation", () => {
    expect(
      getSellerWorkspaceFlow({
        organizations: [],
        activeOrganizationId: null
      })
    ).toEqual({ kind: "create" });
  });

  it("auto-activates when exactly one workspace exists", () => {
    expect(
      getSellerWorkspaceFlow({
        organizations: [{ id: "org_123", name: "Only Workspace", slug: "only-workspace" }],
        activeOrganizationId: null
      })
    ).toEqual({
      kind: "activate",
      organizationId: "org_123"
    });
  });

  it("requires explicit selection when multiple workspaces exist without an active workspace", () => {
    expect(
      getSellerWorkspaceFlow({
        organizations: [
          { id: "org_123", name: "First", slug: "first" },
          { id: "org_456", name: "Second", slug: "second" }
        ],
        activeOrganizationId: null
      })
    ).toEqual({
      kind: "select"
    });
  });

  it("treats an active workspace as ready", () => {
    expect(
      getSellerWorkspaceFlow({
        organizations: [
          { id: "org_123", name: "First", slug: "first" },
          { id: "org_456", name: "Second", slug: "second" }
        ],
        activeOrganizationId: "org_456"
      })
    ).toEqual({
      kind: "ready",
      organizationId: "org_456"
    });
  });

  it("only allows workspace creation when the seller has no existing organizations", () => {
    expect(() =>
      assertWorkspaceCreationAllowed({
        organizations: [{ id: "org_123", name: "Existing", slug: "existing" }]
      })
    ).toThrowError(
      new SellerWorkspaceError(
        "workspace_creation_not_allowed",
        "Seller already has a workspace and must use workspace selection instead."
      )
    );
  });

  it("builds a single OpenClaw organization key request", () => {
    expect(
      buildOpenClawApiKeyRequest({
        organizationId: "org_123",
        existingKeys: []
      })
    ).toEqual({
      configId: OPENCLAW_API_KEY_CONFIG_ID,
      organizationId: "org_123",
      name: OPENCLAW_API_KEY_NAME,
      prefix: OPENCLAW_API_KEY_PREFIX,
      metadata: { integration: "openclaw" }
    });
  });

  it("rejects creating a second OpenClaw key for the same organization", () => {
    expect(() =>
      buildOpenClawApiKeyRequest({
        organizationId: "org_123",
        existingKeys: [
          {
            id: "key_123",
            configId: OPENCLAW_API_KEY_CONFIG_ID
          }
        ]
      })
    ).toThrowError(
      new SellerWorkspaceError(
        "openclaw_key_exists",
        "OpenClaw is already authorized for this seller workspace."
      )
    );
  });

  it("disables auto-submit when a workspace activation error is already present", () => {
    expect(shouldAutoSubmitWorkspaceActivation(null)).toBe(true);
    expect(shouldAutoSubmitWorkspaceActivation("Activation failed.")).toBe(false);
  });
});
