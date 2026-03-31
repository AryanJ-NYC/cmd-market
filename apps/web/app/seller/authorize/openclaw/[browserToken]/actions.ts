"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SellerDomainError } from "../../../../../lib/seller/domain";
import {
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  createWorkspaceAndAuthorizeOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession
} from "../../../../../lib/seller/service";
import { isValidSellerWorkspaceSlug } from "../../../../../lib/seller/workspace";

export async function authorizeOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await runOpenClawAuthorizationAction(browserToken, async () =>
    authorizeOpenClawAuthorizationSession(await headers(), browserToken)
  );
}

export async function rejectOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await runOpenClawAuthorizationAction(browserToken, async () =>
    rejectOpenClawAuthorizationSession(await headers(), browserToken)
  );
}

export async function cancelOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await runOpenClawAuthorizationAction(browserToken, async () =>
    cancelOpenClawAuthorizationSession(await headers(), browserToken)
  );
}

export async function createWorkspaceAndAuthorizeOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!name || !slug) {
    redirectToWorkspaceCreationError({
      browserToken,
      message: "Workspace name and slug are required.",
      name,
      slug
    });
  }

  if (!isValidSellerWorkspaceSlug(slug)) {
    redirectToWorkspaceCreationError({
      browserToken,
      message: "Workspace slug must use lowercase letters, numbers, and hyphens.",
      name,
      slug
    });
  }

  try {
    await createWorkspaceAndAuthorizeOpenClawAuthorizationSession(await headers(), browserToken, {
      name,
      slug
    });
  } catch (caughtError) {
    if (caughtError instanceof SellerDomainError) {
      redirect(`/seller/authorize/openclaw/${browserToken}`);
    }

    redirectToWorkspaceCreationError({
      browserToken,
      message: getActionErrorMessage(caughtError),
      name,
      slug
    });
  }

  redirect(`/seller/authorize/openclaw/${browserToken}`);
}

async function runOpenClawAuthorizationAction(browserToken: string, action: () => Promise<unknown>) {
  try {
    await action();
  } catch (caughtError) {
    if (caughtError instanceof SellerDomainError) {
      redirect(`/seller/authorize/openclaw/${browserToken}`);
    }

    throw caughtError;
  }

  redirect(`/seller/authorize/openclaw/${browserToken}`);
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Workspace creation could not be completed.";
}

function redirectToWorkspaceCreationError(input: {
  browserToken: string;
  message: string;
  name: string;
  slug: string;
}) {
  const searchParams = new URLSearchParams({
    error: input.message,
    name: input.name,
    slug: input.slug
  });

  redirect(`/seller/authorize/openclaw/${input.browserToken}?${searchParams.toString()}`);
}
