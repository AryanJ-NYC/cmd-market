import Link from "next/link";
import type { Metadata } from "next";
import { sellerEntryContent } from "./content";

export const metadata: Metadata = {
  description: "Public seller entry page for CMD Market browser setup and seller route intent.",
  title: "Seller Entry"
};

export default function SellerEntryPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-stone-100">
      <div className="mx-auto max-w-5xl space-y-16">
        <section className="space-y-6 border-b border-white/10 pb-12">
          <div className="space-y-3">
            <p className="font-mono text-sm text-orange-400">{sellerEntryContent.eyebrow}</p>
            <h1 className="max-w-3xl text-balance text-4xl font-medium tracking-tight text-stone-50 md:text-5xl">
              {sellerEntryContent.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-400">{sellerEntryContent.intro}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              className="inline-flex items-center justify-center bg-stone-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-white"
              href="/sign-in"
            >
              Start in the browser
            </Link>
            <Link
              className="inline-flex items-center justify-center border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
              href={sellerEntryContent.secondaryLink.href}
            >
              {sellerEntryContent.secondaryLink.label}
            </Link>
          </div>

          <p className="max-w-2xl border-l-2 border-cyan-400 pl-4 text-sm leading-relaxed text-stone-300">
            {sellerEntryContent.boundaryNote}
          </p>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-sm text-cyan-400">01</p>
            <h2 className="text-2xl font-medium tracking-tight text-stone-50">Browser-first seller flow</h2>
          </div>

          <div className="border-y border-white/10">
            {sellerEntryContent.links.map((link, index) => (
              <div
                className="grid gap-4 border-b border-white/10 py-6 last:border-b-0 md:grid-cols-4 md:gap-8"
                key={link.href}
              >
                <p className="font-mono text-sm text-stone-500 md:col-span-1">0{index + 1}</p>
                <div className="space-y-2 md:col-span-3">
                  <Link className="text-base font-medium text-stone-100 hover:text-cyan-300" href={link.href}>
                    {link.title}
                  </Link>
                  <p className="max-w-2xl text-sm leading-6 text-stone-400">{link.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-sm text-fuchsia-400">02</p>
            <h2 className="text-2xl font-medium tracking-tight text-stone-50">What happens next</h2>
          </div>

          <div className="space-y-6 border-t border-white/10 pt-6">
            {sellerEntryContent.steps.map((step, index) => (
              <div className="grid gap-4 md:grid-cols-4 md:gap-8" key={step.label}>
                <p className="font-mono text-sm text-stone-500 md:col-span-1">Step 0{index + 1}</p>
                <div className="space-y-2 md:col-span-3">
                  <p className="text-base font-medium text-stone-100">{step.label}</p>
                  <p className="max-w-2xl text-sm leading-6 text-stone-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
