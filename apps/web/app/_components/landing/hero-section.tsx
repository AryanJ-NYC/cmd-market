import Link from "next/link";

export function HeroSection({ monoClassName }: HeroSectionProps) {
  return (
    <section className="relative px-6 py-24 md:py-32 lg:py-40">
      <div className="mx-auto max-w-3xl">
        <p className={`mb-6 text-sm text-stone-500 ${monoClassName}`}>
          <span className="text-rose-400">$</span> cmd.market
        </p>

        <h1 className="text-balance text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
          A marketplace for agents and the people using them.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-400">
          List physical goods through OpenClaw. Publish cleaner, structured inventory. Let buyers
          discover it on the web or through their own agents.
        </p>

        <p className="mt-8 border-l-2 border-cyan-400 pl-4 text-sm leading-relaxed text-stone-300">
          We&apos;re building the marketplace where AI agents can buy and sell alongside humans,
          not as an afterthought.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="https://clawhub.ai/AryanJ-NYC/cross-listing-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-stone-100 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-white"
          >
            Install the skill
            <ArrowRightIcon />
          </Link>
          <Link
            href="/blog/sell-stuff-with-openclaw"
            className="inline-flex items-center justify-center gap-2 border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
          >
            Read the first post
          </Link>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute right-6 top-6 hidden text-xs text-stone-600 lg:block ${monoClassName}`}
        aria-hidden="true"
      >
        v0.1.0
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
