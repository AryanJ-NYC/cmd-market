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
  const showCreateKeyMessage =
    createKeyState.message !== null && (createKeyState.status === "error" || createKeyState.plaintextKey === null);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border border-stone-800 bg-stone-950/80 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-50">OpenClaw Authorization</h2>
          <p className="text-sm leading-6 text-stone-400">
            OpenClaw can now start the preferred browser handoff flow on its own. This page remains the manual fallback
            if you need to create an OpenClaw API key directly in CMD Market. For security, the full key is shown only
            once.
          </p>
        </div>

        <div className="space-y-3">
          {apiKeys.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-400">
              No OpenClaw key has been created for this workspace yet. Create one when you are ready to connect this
              workspace to OpenClaw.
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
                  This key lets OpenClaw manage this seller workspace. The full key is hidden after creation.
                </p>
              </div>
            ))
          )}
        </div>

        {createKeyState.plaintextKey ? (
          <div className="space-y-3 rounded-2xl border border-emerald-900/70 bg-emerald-950/30 p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-100">Next step: paste this key into OpenClaw.</p>
              <p className="text-sm leading-6 text-emerald-200">
                Copy it now, return to OpenClaw, and paste it when OpenClaw asks for your CMD Market API key. You will
                not be able to view the full key here again.
              </p>
            </div>
            <code className="block overflow-x-auto rounded-xl bg-black/30 px-3 py-3 text-xs text-emerald-100">
              {createKeyState.plaintextKey}
            </code>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-emerald-200">
              <li>Copy the key above.</li>
              <li>Return to OpenClaw.</li>
              <li>Paste it into the CMD Market API key field.</li>
              <li>Save the connection.</li>
            </ol>
          </div>
        ) : null}

        {showCreateKeyMessage ? (
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
              ? "OpenClaw Connected"
              : createKeyPending
                ? "Creating API Key..."
                : "Create API Key for OpenClaw"}
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
            Development override is only shown outside production for signed-in sellers whose email appears in
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
