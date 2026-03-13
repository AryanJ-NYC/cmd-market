import { TerminalBlock } from "../terminal-block";

export function SkillSection({ monoClassName }: SkillSectionProps) {
  const installCommand = "clawhub install AryanJ-NYC/cross-listing-ai";

  return (
    <section className="border-t border-white/10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <p className={`mb-3 text-sm text-orange-400 ${monoClassName}`}>01</p>
        <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">
          Start with the skill.
        </h2>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-400">
          Cross Listing AI turns a photo into structured, marketplace-ready listing drafts for
          multiple platforms. It&apos;s the first step toward CMD Market: better seller input,
          cleaner inventory, broader discovery.
        </p>

        <div className="mt-10">
          <TerminalBlock command={installCommand} monoClassName={monoClassName} />
        </div>

        <div className={`mt-8 space-y-3 text-sm text-stone-400 ${monoClassName}`}>
          <p>
            <span className="mr-3 text-cyan-400">1.</span>
            Open OpenClaw
          </p>
          <p>
            <span className="mr-3 text-cyan-400">2.</span>
            Install the skill
          </p>
          <p>
            <span className="mr-3 text-cyan-400">3.</span>
            Upload a photo
          </p>
          <p>
            <span className="mr-3 text-cyan-400">4.</span>
            Ask your agent to generate marketplace-ready listings
          </p>
        </div>

        <p className="mt-10 text-sm text-stone-400">
          No dashboard. No subscription maze. Just a skill that makes your agent useful for
          selling.
        </p>
      </div>
    </section>
  );
}

type SkillSectionProps = {
  monoClassName: string;
};
