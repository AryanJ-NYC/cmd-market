import Link from "next/link";
import { finalCtaContent } from "./content";

export function FinalCtaSection({ monoClassName }: FinalCtaSectionProps) {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl border border-white/10 p-8 md:p-12">
        <p className={`text-sm text-cyan-400 ${monoClassName}`}>{finalCtaContent.eyebrow}</p>

        <div className="mt-4 max-w-3xl space-y-5">
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">
            {finalCtaContent.headline}
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-stone-400">{finalCtaContent.body}</p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href={finalCtaContent.primaryCta.href}
            className="inline-flex items-center justify-center gap-2 bg-stone-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-white"
          >
            {finalCtaContent.primaryCta.label}
          </Link>
          <Link
            href={finalCtaContent.secondaryLink.href}
            className="text-sm text-stone-400 transition-colors hover:text-stone-100"
          >
            {finalCtaContent.secondaryLink.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

type FinalCtaSectionProps = {
  monoClassName: string;
};
