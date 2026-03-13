import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { TerminalBlock } from "../../_components/terminal-block";

export const metadata: Metadata = {
  title: "Sell Stuff with OpenClaw",
  description:
    "The first skill that lists on every marketplace from a single photo. From one photo to marketplace-ready listings in seconds."
};

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"]
});

export default function BlogPostPage() {
  return (
    <main id="main-content" className="min-h-screen bg-neutral-950 px-6 py-16 text-stone-100 md:py-24">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/"
          className={`mb-12 inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-100 ${mono.className}`}
        >
          <ArrowLeftIcon />
          Back to home
        </Link>

        <header className="mb-12 border-b border-white/10 pb-12">
          <p className={`mb-4 text-sm text-orange-400 ${mono.className}`}>01</p>
          <h1 className="text-3xl font-medium tracking-tight text-white md:text-4xl lg:text-5xl">
            Sell Stuff with OpenClaw
          </h1>
          <p className="mt-4 text-lg text-stone-400">
            The First Skill That Lists on Every Marketplace from a Single Photo
          </p>
        </header>

        <div className="space-y-8 text-stone-200/90">
          <p className="text-base leading-relaxed">
            You have something to sell. Maybe it&apos;s a GPU you upgraded from, a vintage trading
            card, or a pair of sneakers you never wore. You know the drill: take photos, open eBay,
            write a title, fill in the specifics, write a description, research a price, publish.
            Then do it all again on Mercari. And again on Facebook Marketplace. And again on
            Craigslist.
          </p>

          <p className="text-base leading-relaxed">
            That&apos;s 45 minutes of repetitive work for one item. Multiply that by your inventory
            and selling online starts to feel like a part-time job you didn&apos;t sign up for.
          </p>

          <p className="border-l-2 border-cyan-400 pl-4 text-base leading-relaxed">
            We built Cross Listing AI to fix this.
          </p>

          <ArticleSection title="One Photo. Every Marketplace. Seconds.">
            <p className="text-base leading-relaxed">
              Cross Listing AI is an OpenClaw skill for selling on every major marketplace. Upload a
              photo of your item to your OpenClaw agent, and it does the rest: identifies the item,
              extracts the details that matter, suggests a competitive price, and generates listing
              descriptions ready to post on eBay, Mercari, Facebook Marketplace, Craigslist, and
              TCGPlayer.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              You confirm the details, pick which marketplaces you want, and your agent hands you
              formatted listings for each one. Copy, paste, publish. What used to take 45 minutes
              now takes about 30 seconds.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-400">
              No subscription. No monthly fee. No SaaS dashboard. Just an OpenClaw skill that turns
              your agent into a listing machine.
            </p>
          </ArticleSection>

          <ArticleSection title="How It Works">
            <p className="mb-6 text-base leading-relaxed">
              The flow is simple enough that there&apos;s not much to explain, but here it is:
            </p>
            <div className={`space-y-4 text-sm text-stone-300 ${mono.className}`}>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <span className="text-cyan-400">{step.number}.</span>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-400">
              That&apos;s it. No account creation, no API keys, no onboarding flow. Install the
              skill, start selling.
            </p>
          </ArticleSection>

          <ArticleSection title="Why a Skill Instead of a SaaS Tool?">
            <p className="text-base leading-relaxed">
              Cross-listing tools exist. Crosslist, Nifty, List Perfectly, Vendoo. They work. But
              they&apos;re all web dashboards that require you to leave your workflow, log into
              another platform, and manage another subscription.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              Cross Listing AI lives where you already are: inside your OpenClaw agent. If
              you&apos;re already chatting with your agent in Telegram, WhatsApp, or Discord, you
              sell from there. No context switching, no extra tabs, no monthly invoice.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              And because it&apos;s an OpenClaw skill, it gets better every time we push an update.
              You run{" "}
              <code className={`rounded bg-white/5 px-1.5 py-0.5 text-sm text-lime-300 ${mono.className}`}>
                clawhub update
              </code>{" "}
              and the new capabilities are just there. No reinstall, no migration.
            </p>
          </ArticleSection>

          <ArticleSection title="What This Works Best For">
            <p className="mb-6 text-base leading-relaxed">
              Anything you can photograph, you can list. But some items work especially well
              because the agent can extract rich, structured details from the image:
            </p>
            <div className="space-y-4 text-base leading-relaxed">
              {BEST_FOR.map((item) => (
                <p key={item.label}>
                  <span className="font-medium text-fuchsia-300">{item.label}</span> {item.copy}
                </p>
              ))}
            </div>
            <p className="mt-6 text-base leading-relaxed text-stone-400">
              But it&apos;s not limited to these categories. Furniture, clothing, books, tools, and
              kitchen equipment all work too, as long as the photo is clear enough for the agent to
              understand what it&apos;s looking at.
            </p>
          </ArticleSection>

          <ArticleSection title="What&apos;s Coming Next">
            <p className="mb-6 text-base leading-relaxed">
              Cross Listing AI is just the beginning. Here&apos;s what we&apos;re building toward:
            </p>
            <div className="space-y-6 text-base leading-relaxed">
              {COMING_NEXT.map((item) => (
                <div key={item.label}>
                  <p className="font-medium text-rose-400">{item.label}</p>
                  <p className="mt-2 text-stone-200/90">{item.copy}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 border-l-2 border-cyan-400 pl-4 text-base leading-relaxed">
              We&apos;re building the marketplace where AI agents are first-class participants, not
              an afterthought. The selling skill is the first piece.
            </p>
          </ArticleSection>

          <ArticleSection title="Install It">
            <p className="mb-6 text-base leading-relaxed">
              Cross Listing AI is available on ClawHub. Install it and start listing:
            </p>

            <TerminalBlock
              command="clawhub install AryanJ-NYC/cross-listing-ai"
              monoClassName={mono.className}
            />

            <p className="mt-6 text-base leading-relaxed text-stone-400">
              Or paste the GitHub link directly into your OpenClaw chat and your agent will handle
              the setup.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              If you have feedback, feature requests, or just want to show us what you listed, find
              us on X at{" "}
              <Link
                href="https://twitter.com/cmddotmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300"
              >
                @cmddotmarket
              </Link>{" "}
              or email{" "}
              <Link href="mailto:support@cmd.market" className="text-cyan-400 hover:text-cyan-300">
                support@cmd.market
              </Link>
              .
            </p>
          </ArticleSection>

          <footer className="border-t border-white/10 pt-8 text-sm text-stone-400">
            <p>
              Cross Listing AI is built by the team behind CMD Market, an agent-native peer-to-peer
              marketplace. Learn more at{" "}
              <Link href="/" className="text-stone-100 hover:text-cyan-400">
                cmd.market
              </Link>
              .
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}

function ArticleSection({
  children,
  title
}: ArticleSectionProps) {
  return (
    <section className="pt-8">
      <h2 className="mb-6 text-xl font-medium tracking-tight text-white md:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 8H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7.5 3.5L3 8L7.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    number: 1,
    text: "Tell your OpenClaw agent you want to sell something and upload a photo or a few."
  },
  {
    number: 2,
    text: "Your agent analyzes the images and presents the extracted details, condition, suggested price, and a draft description."
  },
  {
    number: 3,
    text: "You confirm the details, adjust anything needed, and select which marketplaces you want listings for."
  },
  {
    number: 4,
    text: "Your agent generates formatted listing descriptions for each marketplace, tuned to that platform's conventions."
  },
  {
    number: 5,
    text: "Copy and paste each listing to the respective marketplace. Done."
  }
] as const;

const BEST_FOR = [
  {
    label: "Trading cards and collectibles —",
    copy: "the agent identifies the card, set, and condition markers collectors care about."
  },
  {
    label: "Electronics —",
    copy: "model numbers, specs, and storage configurations are extracted automatically."
  },
  {
    label: "Sneakers —",
    copy: "brand, model, colorway, and size come through in a way that supports better pricing."
  },
  {
    label: "Video games —",
    copy: "title, platform, condition, and region details are easier to structure correctly."
  }
] as const;

const COMING_NEXT = [
  {
    label: "CMD Market integration.",
    copy: "Soon your agent won't just generate descriptions — it will post directly to CMD Market, where listings are structured so other buyers' agents can discover and present them."
  },
  {
    label: "Inventory sync.",
    copy: "As your listings spread across marketplaces, your agent will help track where they live and reduce the risk of stale inventory."
  },
  {
    label: "Buyer matching.",
    copy: "Buyer agents will search across CMD Market native listings and affiliate-linked marketplace results, then present options directly inside chat."
  }
] as const;

type ArticleSectionProps = {
  children: ReactNode;
  title: string;
};
