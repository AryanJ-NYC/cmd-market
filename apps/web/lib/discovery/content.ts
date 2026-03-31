export const discoverySummary =
  "CMD Market is a Scarce City marketplace for physical goods, built to support buying and selling with many agent clients.";

export const discoveryNotes = [
  "Use the public site to see how seller setup works and what is live today.",
  "Current live APIs cover category metadata, seller draft authoring, direct-upload media attachment, publish validation, and public listing reads.",
  "CMD Market is built to support many agent clients over time, even though OpenClaw is the first implemented browser handoff integration today.",
  "OpenClaw should start CMD Market auth through the short-lived authorization-session handoff, not by scraping a long-lived key from settings.",
  "The OpenClaw authorization-session API now uses a PKCE-style verifier flow for public clients instead of a shared client secret.",
  "Browser `/seller/*` routes require a browser session.",
  "API keys authenticate seller API routes only.",
  "Seller API keys do not authenticate browser `/seller/*` routes. Browser seller flows still start with sign-in and either first-workspace creation or workspace selection."
] as const;

export const publicRoutes = [
  {
    description: "Public homepage for CMD Market and the main seller entry points.",
    href: "/",
    title: "Homepage"
  },
  {
    description: "Public seller setup overview for the browser-first flow.",
    href: "/seller",
    title: "Seller Entry"
  },
  {
    description: "Start seller authentication through Twitter/X in the browser.",
    href: "/sign-in",
    title: "Sign In"
  },
  {
    description: "Agent-readable guide to the current CMD Market routes and operating notes.",
    href: "/llms.txt",
    title: "llms.txt"
  },
  {
    description: "Machine-readable OpenAPI description for the currently implemented public and seller API routes.",
    href: "/openapi.json",
    title: "OpenAPI"
  }
] as const satisfies RouteLink[];

export const sellerBrowserRoutes = [
  {
    description: "Create or choose the seller workspace you want to sell from after browser sign-in.",
    href: "/seller/workspace",
    title: "Seller Workspace"
  },
  {
    description: "Human handoff screen for an OpenClaw-started browser session, including first-workspace creation when needed.",
    href: "/seller/authorize/openclaw/{browserToken}",
    title: "OpenClaw Authorization Handoff"
  },
  {
    description: "Review seller status and manually create the OpenClaw API key as a fallback path.",
    href: "/seller/settings",
    title: "Seller Settings"
  }
] as const satisfies RouteLink[];

export const sellerApiRoutes = [
  {
    description:
      "Start a short-lived OpenClaw authorization session for the current client instance and return the browser handoff URL, with optional proposed first-workspace details and a PKCE code challenge.",
    href: "/api/openclaw/authorization-sessions",
    title: "POST /api/openclaw/authorization-sessions"
  },
  {
    description:
      "Poll the current state of an OpenClaw authorization session using the matching PKCE code verifier from the client instance that started it.",
    href: "/api/openclaw/authorization-sessions/{sessionId}/status",
    title: "POST /api/openclaw/authorization-sessions/{sessionId}/status"
  },
  {
    description:
      "Redeem an authorized OpenClaw authorization session into a seller-scoped API key using the matching PKCE code verifier from the client instance that started it.",
    href: "/api/openclaw/authorization-sessions/{sessionId}/redeem",
    title: "POST /api/openclaw/authorization-sessions/{sessionId}/redeem"
  },
  {
    description: "Resolve the seller workspace and actor for the current browser session or seller API key.",
    href: "/api/seller/context",
    title: "GET /api/seller/context"
  },
  {
    description: "Check whether the resolved seller workspace is currently allowed to publish listings.",
    href: "/api/seller/publishability",
    title: "GET /api/seller/publishability"
  },
  {
    description: "Create a seller-owned draft listing with optional initial listing fields.",
    href: "/api/seller/listings",
    title: "POST /api/seller/listings"
  },
  {
    description: "Read a seller-owned draft or published listing resource.",
    href: "/api/seller/listings/{listingId}",
    title: "GET /api/seller/listings/{listingId}"
  },
  {
    description: "Patch draft listing fields and typed category attributes.",
    href: "/api/seller/listings/{listingId}",
    title: "PATCH /api/seller/listings/{listingId}"
  },
  {
    description: "Mint draft-scoped direct-upload sessions for listing media.",
    href: "/api/seller/upload-sessions",
    title: "POST /api/seller/upload-sessions"
  },
  {
    description: "Attach uploaded media to a seller-owned draft listing.",
    href: "/api/seller/listings/{listingId}/media",
    title: "POST /api/seller/listings/{listingId}/media"
  },
  {
    description: "Publish a draft listing once seller eligibility, media, and required attributes are complete.",
    href: "/api/seller/listings/{listingId}/publish",
    title: "POST /api/seller/listings/{listingId}/publish"
  }
] as const satisfies RouteLink[];

export const publicApiRoutes = [
  {
    description: "List the current active public categories that agents can use for seller authoring flows.",
    href: "/api/categories",
    title: "GET /api/categories"
  },
  {
    description: "Read category metadata, including required attributes and allowed values.",
    href: "/api/categories/{categorySlug}",
    title: "GET /api/categories/{categorySlug}"
  },
  {
    description: "Read the canonical public listing resource after a draft has been published.",
    href: "/api/listings/{listingId}",
    title: "GET /api/listings/{listingId}"
  }
] as const satisfies RouteLink[];

export const sellerFlowSteps = [
  {
    body: "Sign in and either create your first seller workspace or choose the one that should own your CMD Market listings.",
    label: "Set up your seller workspace"
  },
  {
    body: "Prefer letting your agent start the browser handoff flow. OpenClaw is the first implemented integration today, and seller settings still supports manual OpenClaw key creation as a fallback.",
    label: "Connect your agent"
  },
  {
    body: "Once setup is done, your agent can help with the repetitive parts while you stay in control of what gets published.",
    label: "Start listing faster"
  }
] as const;

export const repoDocs = [
  {
    description: "Product scope and marketplace direction.",
    href: rawGitHubUrl("docs/product.md"),
    title: "Product"
  },
  {
    description: "Current runtime shape, auth flow, and storage boundaries.",
    href: rawGitHubUrl("ARCHITECTURE.md"),
    title: "Architecture"
  },
  {
    description: "Environment setup, commands, auth notes, and route lists.",
    href: rawGitHubUrl("docs/development.md"),
    title: "Development"
  },
  {
    description: "Verification expectations and current test coverage.",
    href: rawGitHubUrl("docs/testing.md"),
    title: "Testing"
  },
  {
    description: "Durable web visual system and landing page composition rules.",
    href: rawGitHubUrl("apps/web/docs/design.md"),
    title: "Web Design"
  }
] as const satisfies RouteLink[];

export const openApiVersion = "0.3.0";

export function rawGitHubUrl(path: string) {
  return `https://raw.githubusercontent.com/AryanJ-NYC/cmd-market/master/${path}`;
}

export type RouteLink = {
  description: string;
  href: string;
  title: string;
};
