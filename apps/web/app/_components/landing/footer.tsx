import Link from "next/link";

export function Footer({ monoClassName }: FooterProps) {
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className={`text-xs text-stone-500 ${monoClassName}`}>
            <span className="text-cyan-400">$</span> cmd.market
          </p>
          <p className="text-sm text-stone-400">
            Start with seller setup in the browser. When you are ready, connect OpenClaw to take
            the repetitive listing work off your plate.
          </p>
        </div>

        <div className={`flex flex-wrap gap-4 text-xs text-stone-500 ${monoClassName}`}>
          <Link className="hover:text-stone-100" href="/seller">
            Seller setup
          </Link>
          <Link className="hover:text-stone-100" href="/llms.txt">
            Agent docs
          </Link>
          <Link className="hover:text-stone-100" href="/openapi.json">
            API spec
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl border-t border-white/10 pt-6">
        <p className="text-xs text-stone-500">Operated by Scarce City, Inc.</p>
      </div>
    </footer>
  );
}

type FooterProps = {
  monoClassName: string;
};
