import Link from "next/link";
import { TerminalBlock } from "../terminal-block";
import { scopeContent } from "./content";

export function BlogSection({ monoClassName }: BlogSectionProps) {
  return (
    <section id="blog" className="border-t border-white/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <p className={`mb-3 text-sm text-fuchsia-400 ${monoClassName}`}>{scopeContent.eyebrow}</p>

        <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
          {scopeContent.headline}
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-400">
          {scopeContent.body}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <TerminalBlock
              command="clawhub install AryanJ-NYC/cross-listing-ai"
              monoClassName={monoClassName}
            />

            <p className="max-w-2xl border-l-2 border-cyan-400 pl-4 text-sm leading-relaxed text-stone-300">
              {scopeContent.supportingNote}
            </p>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-8">
            <p className={`text-xs uppercase tracking-[0.3em] text-stone-500 ${monoClassName}`}>
              Proof
            </p>
            <p className="text-sm leading-6 text-stone-400">
              Read how the first OpenClaw selling flow fits into the broader marketplace direction.
            </p>
            <Link
              href="/blog/sell-stuff-with-openclaw"
              className={`inline-flex items-center gap-2 text-sm text-stone-100 transition-colors hover:text-rose-400 ${monoClassName}`}
            >
              Read the first post
              <ArrowUpRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 11L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M6 5H11V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type BlogSectionProps = {
  monoClassName: string;
};
