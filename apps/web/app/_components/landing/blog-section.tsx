import Link from "next/link";

export function BlogSection({ monoClassName }: BlogSectionProps) {
  return (
    <section id="blog" className="border-t border-white/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <p className={`mb-3 text-sm text-fuchsia-400 ${monoClassName}`}>02</p>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-stone-500">First post</p>

        <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
          Sell Stuff with OpenClaw
        </h2>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-400">
          From one photo to marketplace-ready listings in seconds. Why we built the first OpenClaw
          selling skill, how it works, and why it&apos;s the first step toward CMD Market.
        </p>

        <Link
          href="/blog/sell-stuff-with-openclaw"
          className={`mt-8 inline-flex items-center gap-2 text-sm text-stone-100 transition-colors hover:text-rose-400 ${monoClassName}`}
        >
          Read the post
          <ArrowUpRightIcon />
        </Link>
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
