"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import {
  createOpenClawApiKey,
  getSellerWorkspacePageData,
  overrideSellerEligibility
} from "../../../lib/seller/service";

export async function createOpenClawApiKeyAction(
  _previousState: CreateOpenClawApiKeyActionState,
  _formData: FormData
): Promise<CreateOpenClawApiKeyActionState> {
  void _previousState;
  void _formData;

  const requestHeaders = await headers();
  const workspaceData = await getSellerWorkspacePageData(requestHeaders);

  if (!workspaceData?.activeOrganization) {
    return {
      apiKeys: [],
      message: "Choose a seller workspace before connecting OpenClaw.",
      plaintextKey: null,
      status: "error"
    };
  }

  try {
    const result = await createOpenClawApiKey(requestHeaders, workspaceData.activeOrganization.id);
    revalidatePath("/seller/settings");

    return {
      apiKeys: result.keys.map(serializeApiKeySummary),
      message: "Key created. Return to OpenClaw and paste it there to finish connecting this workspace.",
      plaintextKey: result.createdKey.key,
      status: "success"
    };
  } catch (caughtError) {
    const refreshedWorkspaceData = await getSellerWorkspacePageData(requestHeaders);

    return {
      apiKeys: refreshedWorkspaceData?.apiKeys.map(serializeApiKeySummary) ?? [],
      message: getActionErrorMessage(caughtError, "OpenClaw authorization could not be created."),
      plaintextKey: null,
      status: "error"
    };
  }
}

export async function applyDevelopmentOverrideAction(
  _previousState: EligibilityActionState,
  formData: FormData
): Promise<EligibilityActionState> {
  void _previousState;

  const requestHeaders = await headers();
  const noteValue = String(formData.get("note") ?? "").trim();

  try {
    const updatedAccount = await overrideSellerEligibility(requestHeaders, noteValue || null);
    revalidatePath("/seller/settings");

    return {
      eligibilityNote: updatedAccount.listingEligibilityNote,
      eligibilitySource: updatedAccount.listingEligibilitySource,
      eligibilityStatus: updatedAccount.listingEligibilityStatus,
      message: "Development eligibility override applied.",
      status: "success"
    };
  } catch (caughtError) {
    return {
      eligibilityNote: null,
      eligibilitySource: null,
      eligibilityStatus: null,
      message: getActionErrorMessage(caughtError, "Development eligibility override failed."),
      status: "error"
    };
  }
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers()
  });

  redirect("/sign-in");
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function serializeApiKeySummary(key: {
  configId: string;
  createdAt: Date;
  id: string;
  lastRequest: Date | null;
  metadata: Record<string, unknown> | null;
  name: string | null;
  permissions: Record<string, string[]> | null;
  prefix: string | null;
  start: string | null;
}): SerializedApiKeySummary {
  return {
    configId: key.configId,
    createdAt: key.createdAt.toISOString(),
    id: key.id,
    lastRequest: key.lastRequest ? key.lastRequest.toISOString() : null,
    metadata: key.metadata,
    name: key.name,
    permissions: key.permissions,
    prefix: key.prefix,
    start: key.start
  };
}

export type CreateOpenClawApiKeyActionState = {
  apiKeys: SerializedApiKeySummary[];
  message: string | null;
  plaintextKey: string | null;
  status: "error" | "idle" | "success";
};

export type EligibilityActionState = {
  eligibilityNote: string | null;
  eligibilitySource: string | null;
  eligibilityStatus: string | null;
  message: string | null;
  status: "error" | "idle" | "success";
};

export type SerializedApiKeySummary = {
  configId: string;
  createdAt: string;
  id: string;
  lastRequest: string | null;
  metadata: Record<string, unknown> | null;
  name: string | null;
  permissions: Record<string, string[]> | null;
  prefix: string | null;
  start: string | null;
};
