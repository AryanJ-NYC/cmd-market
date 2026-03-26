import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createWorkspaceAction } from "./actions";
import { getSellerWorkspacePageData } from "../../../lib/seller/service";

export const metadata: Metadata = {
  description: "Create, select, and activate your CMD Market seller workspace.",
  title: "Seller Workspace"
};

export default async function SellerWorkspacePage({
  searchParams
}: SellerWorkspacePageProps) {
  const workspaceData = await getSellerWorkspacePageData(await headers());

  if (!workspaceData) {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await searchParams;
  const error =
    typeof resolvedSearchParams.error === "string" ? decodeURIComponent(resolvedSearchParams.error) : null;

  if (workspaceData.organizations.length === 1 && workspaceData.flow.kind === "activate") {
    redirect(`/seller/workspace/activate?organizationId=${workspaceData.flow.organizationId}`);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Seller Workspace</p>
          <h1 className="text-3xl font-semibold text-stone-50">
            {workspaceData.organizations.length === 0 ? "Create your seller workspace." : "Choose your seller workspace."}
          </h1>
          <p className="text-sm leading-6 text-stone-400">
            Seller workspaces map one-to-one with BetterAuth organizations. You can create one workspace from this app
            when none exists yet, or switch between existing workspaces here.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {workspaceData.organizations.length === 0 ? (
          <section className="rounded-3xl border border-stone-800 bg-stone-950/80 p-6">
            <form action={createWorkspaceAction} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-200" htmlFor="workspace-name">
                  Workspace name
                </label>
                <input
                  className="w-full rounded-2xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none ring-0 placeholder:text-stone-500"
                  id="workspace-name"
                  name="name"
                  placeholder="OpenClaw Seller Studio"
                  required
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-200" htmlFor="workspace-slug">
                  Workspace slug
                </label>
                <input
                  className="w-full rounded-2xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 outline-none ring-0 placeholder:text-stone-500"
                  id="workspace-slug"
                  name="slug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="openclaw-seller-studio"
                  required
                  type="text"
                />
                <p className="text-xs text-stone-500">Use lowercase letters, numbers, and hyphens only.</p>
              </div>
              <button className="rounded-full border border-stone-700 bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white">
                Create Workspace
              </button>
            </form>
          </section>
        ) : (
          <section className="space-y-4 rounded-3xl border border-stone-800 bg-stone-950/80 p-6">
            {workspaceData.organizations.map((organization) => {
              const isActive = workspaceData.activeOrganization?.id === organization.id;

              return (
                <div
                  className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={organization.id}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-stone-100">{organization.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{organization.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="rounded-full border border-emerald-800 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-200">
                        Active
                      </span>
                    ) : null}
                    <Link
                      className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                      href={`/seller/workspace/activate?organizationId=${organization.id}`}
                    >
                      {isActive ? "Refresh Selection" : "Use Workspace"}
                    </Link>
                  </div>
                </div>
              );
            })}
            <div className="pt-2">
              <Link className="text-sm text-stone-300 underline decoration-stone-700 underline-offset-4" href="/seller/settings">
                Continue to seller settings
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

type SellerWorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
