import { headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "../../lib/env";
import { getSellerWorkspacePageData } from "../../lib/seller/service";
import { SignInButton } from "./sign-in-button";

export const metadata: Metadata = {
  description: "Sign in with Twitter/X to access CMD Market seller workspaces.",
  title: "Seller Sign In"
};

export default async function SignInPage() {
  const workspaceData = await getSellerWorkspacePageData(await headers());

  if (workspaceData) {
    redirect("/seller/workspace");
  }

  const twitterEnabled = Boolean(env.twitterClientId && env.twitterClientSecret);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-stone-100">
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-stone-800 bg-stone-950/80 p-8 shadow-2xl shadow-black/20">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Seller Access</p>
          <h1 className="text-3xl font-semibold text-stone-50">Sign in to manage your seller workspace.</h1>
          <p className="text-sm leading-6 text-stone-400">
            Issue #1 uses Twitter/X only for authentication. Eligibility is still gated separately inside the seller
            workspace settings.
          </p>
        </div>
        <SignInButton twitterEnabled={twitterEnabled} />
      </div>
    </main>
  );
}
