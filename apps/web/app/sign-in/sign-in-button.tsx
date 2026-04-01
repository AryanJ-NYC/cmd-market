"use client";

import { useState, useTransition } from "react";
import { authClient } from "../../lib/auth-client";

export function SignInButton({ callbackUrl, twitterEnabled }: SignInButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!twitterEnabled) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await authClient.signIn.social({
          callbackURL: callbackUrl,
          provider: "twitter"
        });
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Twitter sign-in could not be started.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        className="w-full rounded-full border border-stone-700 bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white disabled:cursor-not-allowed disabled:border-stone-800 disabled:bg-stone-900 disabled:text-stone-500"
        disabled={!twitterEnabled || isPending}
        onClick={handleClick}
        type="button"
      >
        {twitterEnabled ? (isPending ? "Starting Twitter sign-in..." : "Continue With Twitter/X") : "Twitter/X Is Not Configured"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!twitterEnabled ? (
        <p className="text-sm text-stone-400">Twitter/X sign-in is disabled for this environment.</p>
      ) : null}
    </div>
  );
}

type SignInButtonProps = {
  callbackUrl: string;
  twitterEnabled: boolean;
};
