"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SellerDomainError } from "../../../../../lib/seller/domain";
import {
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession
} from "../../../../../lib/seller/service";

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
