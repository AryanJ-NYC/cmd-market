"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSellerWorkspace } from "../../../lib/seller/service";

export async function createWorkspaceAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
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

  redirect("/seller/settings");
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
