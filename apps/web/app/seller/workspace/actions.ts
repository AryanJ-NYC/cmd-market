"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { activateSellerWorkspace, createSellerWorkspace } from "../../../lib/seller/service";
import { buildSellerReturnPath, isValidSellerWorkspaceSlug } from "../../../lib/seller/workspace";

export async function createWorkspaceAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const nextPath = getNextPath(formData);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!name || !slug) {
    redirectToWorkspaceError("Workspace name and slug are required.", nextPath);
  }

  if (!isValidSellerWorkspaceSlug(slug)) {
    redirectToWorkspaceError("Workspace slug must use lowercase letters, numbers, and hyphens.", nextPath);
  }

  try {
    await createSellerWorkspace(await headers(), { name, slug });
  } catch (caughtError) {
    redirectToWorkspaceError(getActionErrorMessage(caughtError), nextPath);
  }

  redirect(nextPath);
}

export async function activateWorkspaceAction(formData: FormData) {
  const nextPath = getNextPath(formData);
  const organizationId = String(formData.get("organizationId") ?? "").trim();

  if (!organizationId) {
    redirectToWorkspaceError("Workspace selection is required.", nextPath);
  }

  try {
    await activateSellerWorkspace(await headers(), organizationId);
  } catch (caughtError) {
    redirectToWorkspaceError(getActionErrorMessage(caughtError), nextPath);
  }

  redirect(nextPath);
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Workspace creation could not be completed.";
}

function getNextPath(formData: FormData) {
  const nextValue = String(formData.get("next") ?? "").trim();

  return buildSellerReturnPath(nextValue || null, "/seller/settings");
}

function redirectToWorkspaceError(message: string, nextPath: string) {
  const params = new URLSearchParams({
    error: message,
    next: nextPath
  });

  redirect(`/seller/workspace?${params.toString()}`);
}
