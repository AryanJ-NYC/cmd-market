"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { activateSellerWorkspace, createSellerWorkspace } from "../../../lib/seller/service";
import { buildSellerReturnPath } from "../../../lib/seller/workspace";

export async function createWorkspaceAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const nextPath = getNextPath(formData);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!name || !slug) {
    redirect("/seller/workspace?error=Workspace+name+and+slug+are+required.");
  }

  if (!isValidSlug(slug)) {
    redirect("/seller/workspace?error=Workspace+slug+must+use+lowercase+letters%2C+numbers%2C+and+hyphens.");
  }

  try {
    await createSellerWorkspace(await headers(), { name, slug });
  } catch (caughtError) {
    redirect(`/seller/workspace?error=${encodeURIComponent(getActionErrorMessage(caughtError))}`);
  }

  redirect(nextPath);
}

export async function activateWorkspaceAction(formData: FormData) {
  const nextPath = getNextPath(formData);
  const organizationId = String(formData.get("organizationId") ?? "").trim();

  if (!organizationId) {
    redirect("/seller/workspace?error=Workspace+selection+is+required.");
  }

  try {
    await activateSellerWorkspace(await headers(), organizationId);
  } catch (caughtError) {
    redirect(`/seller/workspace?error=${encodeURIComponent(getActionErrorMessage(caughtError))}`);
  }

  redirect(nextPath);
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Workspace creation could not be completed.";
}

function isValidSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function getNextPath(formData: FormData) {
  const nextValue = String(formData.get("next") ?? "").trim();

  return buildSellerReturnPath(nextValue || null, "/seller/settings");
}
