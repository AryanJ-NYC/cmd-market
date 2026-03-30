import { publicRoutes, sellerApiRoutes } from "../../../lib/discovery/content";

export const heroContent = {
  eyebrow: "OpenClaw Sellers",
  headline: "Sell through OpenClaw without doing every listing step by hand.",
  highlights: [
    {
      body: "Set up your workspace in the browser first, then decide exactly what is ready to go live.",
      title: "Stay in control"
    },
    {
      body: "Let your agent help with the repetitive draft, media, and publish steps that usually eat your time.",
      title: "Offload the repetitive work"
    },
    {
      body: "Create cleaner, structured listings that are easier for both people and agent-powered buyers to understand.",
      title: "Give buyers better listings"
    }
  ],
  note: "New here? Create your seller workspace in the browser first. Add an API key later when you want OpenClaw to help with listing work.",
  primaryCta: {
    href: "/seller",
    label: "Create seller workspace"
  },
  secondaryCta: {
    href: "/llms.txt",
    label: "Agent docs"
  },
  supportingCopy:
    "CMD Market helps OpenClaw sellers turn item photos into cleaner listings with less manual work, while keeping the final publish decision in human hands."
} as const;

export const agentQuickstartItems = [
  {
    description: "See what is public, what needs sign-in, and which routes are live right now.",
    href: publicRoutes[3].href,
    label: "Read the docs",
    note: "The fastest starting point for a new integration."
  },
  {
    description: "Use the current API contract for seller setup, drafts, media, and publish flows.",
    href: publicRoutes[4].href,
    label: "Use the API spec",
    note: "Live routes only."
  },
  {
    description: "Check the active seller workspace before creating drafts, uploads, or publish requests.",
    href: sellerApiRoutes[0].href,
    label: "Check seller context first",
    note: "Seller API keys work on `/api/seller/*` only."
  }
] as const;

export const scopeContent = {
  body: "Most marketplaces still make sellers repeat the same tedious work. CMD Market starts from a simpler idea: let OpenClaw help with the repetitive parts while sellers stay in control.",
  eyebrow: "02",
  headline: "OpenClaw is where we start.",
  supportingNote: "The first seller workflow is built around OpenClaw."
} as const;

export const finalCtaContent = {
  body: "Start in the browser, create your workspace, and connect OpenClaw when you are ready to hand off the repetitive listing work.",
  eyebrow: "03",
  headline: "Ready to start selling on CMD Market?",
  primaryCta: {
    href: "/seller",
    label: "Create seller workspace"
  },
  secondaryLink: {
    href: "/llms.txt",
    label: "Building an integration instead? Start with the agent docs."
  }
} as const;
