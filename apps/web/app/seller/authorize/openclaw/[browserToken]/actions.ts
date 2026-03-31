"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  authorizeOpenClawAuthorizationSession,
  cancelOpenClawAuthorizationSession,
  rejectOpenClawAuthorizationSession
} from "../../../../../lib/seller/service";

export async function authorizeOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await authorizeOpenClawAuthorizationSession(await headers(), browserToken);

  redirect(`/seller/authorize/openclaw/${browserToken}`);
}

export async function rejectOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await rejectOpenClawAuthorizationSession(await headers(), browserToken);

  redirect(`/seller/authorize/openclaw/${browserToken}`);
}

export async function cancelOpenClawAuthorizationAction(formData: FormData) {
  const browserToken = String(formData.get("browserToken") ?? "").trim();

  await cancelOpenClawAuthorizationSession(await headers(), browserToken);

  redirect(`/seller/authorize/openclaw/${browserToken}`);
}
