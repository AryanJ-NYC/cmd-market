"use client";

import { useActionState } from "react";
import {
  applyDevelopmentOverrideAction,
  type CreateOpenClawApiKeyActionState,
  createOpenClawApiKeyAction,
  type EligibilityActionState,
  type SerializedApiKeySummary
} from "./actions";

const INITIAL_CREATE_KEY_STATE: CreateOpenClawApiKeyActionState = {
  apiKeys: [],
  message: null,
  plaintextKey: null,
  status: "idle"
};

const INITIAL_ELIGIBILITY_STATE: EligibilityActionState = {
  eligibilityNote: null,
  eligibilitySource: null,
  eligibilityStatus: null,
  message: null,
  status: "idle"
};

export function SellerSettingsControls({
  developmentOverrideAllowed,
  initialApiKeys,
  initialEligibilityNote,
  initialEligibilitySource,
  initialEligibilityStatus
}: SellerSettingsControlsProps) {
  const [createKeyState, createKeyAction, createKeyPending] = useActionState(
    createOpenClawApiKeyAction,
    {
      ...INITIAL_CREATE_KEY_STATE,
      apiKeys: initialApiKeys
    }
  );
  const [eligibilityState, eligibilityAction, eligibilityPending] = useActionState(
    applyDevelopmentOverrideAction,
    INITIAL_ELIGIBILITY_STATE
  );

  const apiKeys = createKeyState.apiKeys.length > 0 ? createKeyState.apiKeys : initialApiKeys;
  const eligibilityStatus = eligibilityState.eligibilityStatus ?? initialEligibilityStatus;
  const eligibilitySource = eligibilityState.eligibilitySource ?? initialEligibilitySource;
  const eligibilityNote = eligibilityState.eligibilityNote ?? initialEligibilityNote;

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border border-stone-800 bg-stone-950/80 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-50">OpenClaw Authorization</h2>
          <p className="text-sm leading-6 text-stone-400">
            Issue #1 allows one organization-owned OpenClaw key per seller workspace. The plaintext key is only shown
            once, at creation time.
          </p>
        </div>

        <div className="space-y-3">
          {apiKeys.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-400">
              No OpenClaw key has been created for this workspace yet.
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div
                className="space-y-2 rounded-2xl border border-stone-800 bg-stone-900/70 p-4"
                key={apiKey.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-100">{apiKey.name ?? "OpenClaw"}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    {formatMaskedKey(apiKey.prefix, apiKey.start)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-stone-400">
                  <span>Created {new Date(apiKey.createdAt).toLocaleString()}</span>
                  <span>Last used {apiKey.lastRequest ? new Date(apiKey.lastRequest).toLocaleString() : "Never"}</span>
                </div>
                <p className="text-xs text-stone-500">
                  Permissions {JSON.stringify(apiKey.permissions ?? {}, null, 0)} • Metadata{" "}
                  {JSON.stringify(apiKey.metadata ?? {}, null, 0)}
                </p>
              </div>
            ))
          )}
        </div>

        {createKeyState.plaintextKey ? (
          <div className="space-y-2 rounded-2xl border border-emerald-900/70 bg-emerald-950/30 p-4">
            <p className="text-sm font-medium text-emerald-100">Copy this API key now.</p>
            <code className="block overflow-x-auto rounded-xl bg-black/30 px-3 py-3 text-xs text-emerald-100">
              {createKeyState.plaintextKey}
            </code>
          </div>
        ) : null}

        {createKeyState.message ? (
          <p className={createKeyState.status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-200"}>
            {createKeyState.message}
          </p>
        ) : null}

        <form action={createKeyAction}>
          <button
            className="rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-900 disabled:text-stone-500"
            disabled={apiKeys.length > 0 || createKeyPending}
          >
            {apiKeys.length > 0
              ? "OpenClaw Already Authorized"
              : createKeyPending
                ? "Creating OpenClaw Key..."
                : "Create OpenClaw Key"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-3xl border border-stone-800 bg-stone-950/80 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-50">Eligibility State</h2>
          <p className="text-sm leading-6 text-stone-400">
            Seller publishing remains blocked until the workspace becomes eligible. In this issue, development-only
            manual override is the only eligibility path.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-sm text-stone-300">
          <p>Status: {eligibilityStatus ?? "pending"}</p>
          <p>Source: {eligibilitySource ?? "not set"}</p>
          <p>Note: {eligibilityNote ?? "No note recorded."}</p>
        </div>

        {eligibilityState.message ? (
          <p className={eligibilityState.status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-200"}>
            {eligibilityState.message}
          </p>
        ) : null}

        {developmentOverrideAllowed ? (
          <form action={eligibilityAction} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-200" htmlFor="override-note">
                Override note
              </label>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500"
                defaultValue={eligibilityNote ?? ""}
                id="override-note"
                name="note"
                placeholder="Approved in local development for seller publishing verification."
              />
            </div>
            <button
              className="rounded-full border border-emerald-800 bg-emerald-950/40 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:border-stone-900 disabled:text-stone-500"
              disabled={eligibilityStatus === "eligible" || eligibilityPending}
            >
              {eligibilityStatus === "eligible"
                ? "Workspace Already Eligible"
                : eligibilityPending
                  ? "Applying Override..."
                  : "Approve In Development"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-stone-500">
            Development override is only shown for signed-in sellers whose email appears in
            `DEV_SELLER_OVERRIDE_EMAILS`.
          </p>
        )}
      </section>
    </div>
  );
}

function formatMaskedKey(prefix: string | null, start: string | null) {
  if (!prefix && !start) {
    return "masked";
  }

  return `${prefix ?? ""}${start ?? ""}••••••••`;
}

type SellerSettingsControlsProps = {
  developmentOverrideAllowed: boolean;
  initialApiKeys: SerializedApiKeySummary[];
  initialEligibilityNote: string | null;
  initialEligibilitySource: string | null;
  initialEligibilityStatus: string;
};
