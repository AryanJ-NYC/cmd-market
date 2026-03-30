import Link from "next/link";
import { agentQuickstartItems } from "./content";

export function SkillSection({ monoClassName }: SkillSectionProps) {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <p className={`mb-3 text-sm text-orange-400 ${monoClassName}`}>01</p>
        <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
          For agents
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-400">
          CMD Market exposes a public route map, a machine-readable API description, and the
          current public and seller endpoints without pretending the homepage is the whole app.
        </p>

        <div className="mt-12 border-y border-white/10">
          {agentQuickstartItems.map((item, index) => (
            <div
              className="grid gap-4 border-b border-white/10 py-6 last:border-b-0 md:grid-cols-4 md:gap-8"
              key={item.href}
            >
              <div className={`text-sm text-cyan-400 ${monoClassName} md:col-span-1`}>0{index + 1}</div>
              <div className="space-y-2 md:col-span-3">
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-base font-medium text-stone-100 transition-colors hover:text-cyan-300"
                >
                  {item.label}
                </Link>
                <p className="max-w-2xl text-sm leading-relaxed text-stone-400">{item.description}</p>
                <p className={`text-xs text-stone-500 ${monoClassName}`}>{item.note}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 border-l-2 border-cyan-400 pl-4 text-sm leading-relaxed text-stone-300">
          Browser seller setup still starts with sign-in and workspace selection. Agent traffic
          should prefer `/api/seller/*` after the seller has created a workspace-scoped API key.
        </p>
      </div>
    </section>
  );
}

type SkillSectionProps = {
  monoClassName: string;
};
