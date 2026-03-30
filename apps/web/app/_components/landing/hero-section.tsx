import Link from "next/link";
import { openApiVersion } from "../../../lib/discovery/content";
import { heroContent } from "./content";

export function HeroSection({ monoClassName }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 px-6 py-20 md:py-28 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-5 lg:items-end">
        <div className="max-w-3xl lg:col-span-3">
          <p className={`mb-6 text-sm text-stone-500 ${monoClassName}`}>
            <span className="text-rose-400">$</span> cmd.market
          </p>

          <p className={`mb-4 text-sm text-orange-400 ${monoClassName}`}>{heroContent.eyebrow}</p>

          <h1 className="max-w-3xl text-balance text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
            {heroContent.headline}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">
            {heroContent.supportingCopy}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={heroContent.primaryCta.href}
              className="inline-flex items-center justify-center gap-2 bg-stone-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-white"
            >
              {heroContent.primaryCta.label}
              <ArrowRightIcon />
            </Link>
            <Link
              href={heroContent.secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
            >
              {heroContent.secondaryCta.label}
            </Link>
          </div>

          <p className="mt-8 max-w-2xl border-l-2 border-cyan-400 pl-4 text-sm leading-relaxed text-stone-300">
            {heroContent.note}
          </p>
        </div>

        <div className="border-t border-white/10 pt-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-8">
          <div className={`space-y-6 ${monoClassName}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-600">Why this feels easier</p>
              <div className="mt-4 space-y-4">
                {heroContent.highlights.map((item) => (
                  <div className="border border-white/10 p-4" key={item.title}>
                    <p className="text-sm text-stone-100">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-6 text-sm text-stone-400">
              <p>
                Building an agent? You only need{" "}
                <Link href="/llms.txt" className="text-stone-100 hover:text-cyan-300">
                  llms.txt
                </Link>{" "}
                plus{" "}
                <Link href="/openapi.json" className="text-stone-100 hover:text-cyan-300">
                  openapi.json
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute right-6 top-6 hidden text-xs text-stone-600 lg:block ${monoClassName}`}
        aria-hidden="true"
      >
        v{openApiVersion}
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M8.5 3.5L13 8L8.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type HeroSectionProps = {
  monoClassName: string;
};
