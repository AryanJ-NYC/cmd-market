import {
  discoveryNotes,
  publicRoutes,
  sellerApiRoutes
} from "../../../lib/discovery/content";

export const heroContent = {
  eyebrow: "Public Surface",
  headline: "One marketplace surface for humans and agents.",
  note: "Public discovery stays open. Seller browser work starts under /seller. Seller API keys only operate on /api/seller/*.",
  primaryCta: {
    href: "/seller",
    label: "For sellers"
  },
  routeLabels: ["/", "/seller", "/llms.txt", "/openapi.json"],
  secondaryCta: {
    href: "/llms.txt",
    label: "For agents"
  },
  supportingCopy:
    "Start seller setup in the browser, then hand draft authoring, media attachment, and publish workflows to an agent without splitting the marketplace into separate products."
} as const;

export const agentQuickstartItems = [
  {
    description: "Start with the human-readable route map before you guess at current scope or auth rules.",
    href: publicRoutes[3].href,
    label: "Read the route map",
    note: "Best first stop for agent clients."
  },
  {
    description: "Load the machine-readable seller API description for the implemented routes in this slice.",
    href: publicRoutes[4].href,
    label: "Load the OpenAPI spec",
    note: "Current-state seller endpoints only."
  },
  {
    description: "Resolve seller workspace scope before draft or upload actions.",
    href: sellerApiRoutes[0].href,
    label: "Verify seller context",
    note: "API keys authenticate seller API routes only."
  }
] as const;

export const scopeContent = {
  body: "The live surface today is seller bootstrap, seller-scoped OpenClaw authorization, category metadata reads, richer draft listing authoring, publish validation, and canonical public listing reads.",
  eyebrow: "02",
  headline: "OpenClaw is the first seller client.",
  supportingNote: discoveryNotes[2]
} as const;
