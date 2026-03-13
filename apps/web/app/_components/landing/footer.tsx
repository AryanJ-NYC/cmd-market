export function Footer({ monoClassName }: FooterProps) {
  return (
    <footer className="border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className={`text-xs text-stone-500 ${monoClassName}`}>
          <span className="text-cyan-400">$</span> cmd.market
        </p>
        <p className="text-xs text-stone-500">Operated by Scarce City, Inc.</p>
      </div>
    </footer>
  );
}

type FooterProps = {
  monoClassName: string;
};
