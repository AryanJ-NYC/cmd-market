import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSellerWorkspacePageData } from "../../../lib/seller/service";
import { SellerSettingsControls } from "./settings-controls";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  description: "Review seller workspace eligibility and authorize OpenClaw for CMD Market.",
  title: "Seller Settings"
};

export default async function SellerSettingsPage() {
  const workspaceData = await getSellerWorkspacePageData(await headers());

  if (!workspaceData) {
    redirect("/sign-in");
  }

  if (workspaceData.flow.kind === "create" || workspaceData.flow.kind === "select") {
    redirect("/seller/workspace");
  }

  if (workspaceData.flow.kind === "activate") {
    redirect("/seller/workspace");
  }

  if (!workspaceData.activeOrganization || !workspaceData.activeSellerAccount) {
    redirect("/seller/workspace");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Seller Settings</p>
            <h1 className="text-3xl font-semibold text-stone-50">{workspaceData.activeOrganization.name}</h1>
            <p className="text-sm leading-6 text-stone-400">
              Active workspace `{workspaceData.activeOrganization.slug}` for {workspaceData.session.email}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
              href="/seller/workspace"
            >
              Switch Workspace
            </Link>
            <form action={signOutAction}>
              <button className="rounded-full border border-stone-800 px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-stone-600 hover:bg-stone-900">
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Seller Account</p>
            <p className="mt-3 text-sm text-stone-100">{workspaceData.activeSellerAccount.id}</p>
          </div>
          <div className="rounded-3xl border border-stone-800 bg-stone-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Eligibility</p>
            <p className="mt-3 text-sm capitalize text-stone-100">
              {workspaceData.activeSellerAccount.listingEligibilityStatus}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Source {workspaceData.activeSellerAccount.listingEligibilitySource ?? "not set"}
            </p>
          </div>
          <div className="rounded-3xl border border-stone-800 bg-stone-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Default Currency</p>
            <p className="mt-3 text-sm text-stone-100">{workspaceData.activeSellerAccount.defaultDisplayCurrencyCode}</p>
          </div>
        </section>

        <SellerSettingsControls
          developmentOverrideAllowed={workspaceData.developmentOverrideAllowed}
          initialApiKeys={workspaceData.apiKeys.map((apiKey) => ({
            configId: apiKey.configId,
            createdAt: apiKey.createdAt.toISOString(),
            id: apiKey.id,
            lastRequest: apiKey.lastRequest ? apiKey.lastRequest.toISOString() : null,
            metadata: apiKey.metadata,
            name: apiKey.name,
            permissions: apiKey.permissions,
            prefix: apiKey.prefix,
            start: apiKey.start
          }))}
          initialEligibilityNote={workspaceData.activeSellerAccount.listingEligibilityNote}
          initialEligibilitySource={workspaceData.activeSellerAccount.listingEligibilitySource}
          initialEligibilityStatus={workspaceData.activeSellerAccount.listingEligibilityStatus}
        />
      </div>
    </main>
  );
}
