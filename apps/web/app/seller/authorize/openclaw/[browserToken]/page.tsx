import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  authorizeOpenClawAuthorizationAction,
  cancelOpenClawAuthorizationAction,
  rejectOpenClawAuthorizationAction
} from "./actions";
import { getOpenClawAuthorizationPageState } from "../../../../../lib/seller/service";

export const metadata: Metadata = {
  description: "Approve OpenClaw to manage your CMD Market seller workspace.",
  title: "Authorize OpenClaw"
};

export default async function OpenClawAuthorizationPage({
  params
}: OpenClawAuthorizationPageProps) {
  const resolvedParams = await params;
  const browserToken = resolvedParams.browserToken;
  const state = await getOpenClawAuthorizationPageState(await headers(), browserToken);

  if (state.kind === "sign_in_required") {
    redirect(`/sign-in?next=${encodeURIComponent(state.nextPath)}`);
  }

  if (state.kind === "workspace_required") {
    redirect(`/seller/workspace?next=${encodeURIComponent(state.nextPath)}`);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-stone-800 bg-stone-950/80 p-8">
        {state.kind === "invalid" ? (
          <OpenClawAuthorizationMessage
            body="This OpenClaw authorization link is invalid or no longer available."
            eyebrow="OpenClaw Authorization"
            title="Authorization session unavailable."
            tone="neutral"
          />
        ) : null}

        {state.kind === "terminal" ? (
          <OpenClawAuthorizationMessage
            body={getTerminalBody(state.status)}
            eyebrow="OpenClaw Authorization"
            title={getTerminalTitle(state.status)}
            tone={getTerminalTone(state.status)}
          />
        ) : null}

        {state.kind === "consent" ? (
          <>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">OpenClaw Authorization</p>
              <h1 className="text-3xl font-semibold text-stone-50">Authorize OpenClaw</h1>
              <p className="text-sm leading-6 text-stone-400">
                You are authorizing OpenClaw to manage the active CMD Market seller workspace for {state.email}.
              </p>
            </div>

            <section className="rounded-2xl border border-stone-800 bg-stone-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Workspace</p>
              <p className="mt-3 text-lg font-medium text-stone-50">{state.workspace.name}</p>
              <p className="mt-1 text-sm text-stone-400">{state.workspace.slug}</p>
            </section>

            <section className="rounded-2xl border border-stone-800 bg-stone-900/40 p-5 text-sm leading-6 text-stone-300">
              CMD Market will only mint the OpenClaw API key after you approve this workspace. If you reject the
              request, OpenClaw will receive a structured failure and no long-lived credential will be issued.
            </section>

            <div className="flex flex-wrap gap-3">
              <form action={authorizeOpenClawAuthorizationAction}>
                <input name="browserToken" type="hidden" value={browserToken} />
                <button className="rounded-full border border-stone-700 bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white">
                  Authorize OpenClaw
                </button>
              </form>
              <form action={rejectOpenClawAuthorizationAction}>
                <input name="browserToken" type="hidden" value={browserToken} />
                <button className="rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-800">
                  Reject Request
                </button>
              </form>
              <form action={cancelOpenClawAuthorizationAction}>
                <input name="browserToken" type="hidden" value={browserToken} />
                <button className="rounded-full border border-stone-800 px-5 py-3 text-sm font-medium text-stone-400 transition hover:border-stone-600 hover:text-stone-200">
                  Cancel For Now
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

function OpenClawAuthorizationMessage({
  body,
  eyebrow,
  title,
  tone
}: OpenClawAuthorizationMessageProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{eyebrow}</p>
        <h1 className="text-3xl font-semibold text-stone-50">{title}</h1>
        <p className="text-sm leading-6 text-stone-400">{body}</p>
      </div>
      <div className={getTerminalPanelClassName(tone)}>
        {tone === "success"
          ? "You can return to OpenClaw and finish the connection there."
          : "Start a new connection from OpenClaw when you are ready to try again."}
      </div>
    </div>
  );
}

function getTerminalBody(status: OpenClawTerminalStatus) {
  switch (status) {
    case "authorized":
      return "OpenClaw has been approved for this CMD Market workspace. Return to OpenClaw to redeem the credential.";
    case "cancelled":
      return "This authorization session was cancelled before completion.";
    case "expired":
      return "This authorization session expired before OpenClaw could finish the exchange.";
    case "redeemed":
      return "This authorization session has already been redeemed into a seller-scoped OpenClaw credential.";
    case "rejected":
      return "You rejected OpenClaw access for this CMD Market workspace.";
  }
}

function getTerminalPanelClassName(tone: OpenClawAuthorizationTone) {
  if (tone === "success") {
    return "rounded-2xl border border-emerald-900/70 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200";
  }

  if (tone === "warning") {
    return "rounded-2xl border border-amber-900/70 bg-amber-950/30 px-4 py-3 text-sm text-amber-200";
  }

  return "rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 text-sm text-stone-300";
}

function getTerminalTitle(status: OpenClawTerminalStatus) {
  switch (status) {
    case "authorized":
      return "OpenClaw authorized."
    case "cancelled":
      return "Authorization cancelled."
    case "expired":
      return "Authorization expired."
    case "redeemed":
      return "Authorization complete."
    case "rejected":
      return "Authorization rejected."
  }
}

function getTerminalTone(status: OpenClawTerminalStatus): OpenClawAuthorizationTone {
  switch (status) {
    case "authorized":
    case "redeemed":
      return "success";
    case "cancelled":
    case "expired":
    case "rejected":
      return "warning";
  }
}

type OpenClawTerminalStatus = "authorized" | "cancelled" | "expired" | "redeemed" | "rejected";

type OpenClawAuthorizationTone = "neutral" | "success" | "warning";

type OpenClawAuthorizationMessageProps = {
  body: string;
  eyebrow: string;
  title: string;
  tone: OpenClawAuthorizationTone;
};

type OpenClawAuthorizationPageProps = {
  params: Promise<{
    browserToken: string;
  }>;
};
