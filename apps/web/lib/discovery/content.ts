export const discoverySummary =
  "CMD Market is a Scarce City marketplace for physical goods where humans and agents share one marketplace surface.";

export const discoveryNotes = [
  "Use the public site to understand route intent, current scope, and seller entry points.",
  "Browser `/seller/*` routes require a browser session.",
  "API keys authenticate seller API routes only.",
  "Seller API keys do not authenticate browser `/seller/*` routes. Browser seller flows still start with sign-in and workspace selection."
] as const;

export const publicRoutes = [
  {
    description: "Brand-led public entrypoint for marketplace positioning and route intent.",
    href: "/",
    title: "Homepage"
  },
  {
    description: "Public seller overview that explains the browser flow and auth boundary.",
    href: "/seller",
    title: "Seller Entry"
  },
  {
    description: "Start seller authentication through Twitter/X in the browser.",
    href: "/sign-in",
    title: "Sign In"
  },
  {
    description: "Agent-readable route map and operating notes for the current CMD Market slice.",
    href: "/llms.txt",
    title: "llms.txt"
  },
  {
    description: "Machine-readable OpenAPI description for the currently implemented seller API routes.",
    href: "/openapi.json",
    title: "OpenAPI"
  }
] as const satisfies RouteLink[];

export const sellerBrowserRoutes = [
  {
    description: "Create or select the active seller workspace after browser sign-in.",
    href: "/seller/workspace",
    title: "Seller Workspace"
  },
  {
    description: "Review seller eligibility and create the OpenClaw seller API key for the active workspace.",
    href: "/seller/settings",
    title: "Seller Settings"
  }
] as const satisfies RouteLink[];

export const sellerApiRoutes = [
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
    description: "Create a thin seller-owned draft listing.",
    href: "/api/seller/listings",
    title: "POST /api/seller/listings"
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
  }
] as const satisfies RouteLink[];

export const sellerFlowSteps = [
  {
    body: "Start at the public seller entry page, then sign in with Twitter/X in the browser.",
    label: "Open the seller flow"
  },
  {
    body: "Create or activate the seller workspace that will own browser actions and API keys.",
    label: "Choose the active workspace"
  },
  {
    body: "Create the OpenClaw seller API key in settings. The plaintext key is shown once and then used only on `/api/seller/*` routes.",
    label: "Authorize the seller agent"
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

export const openApiVersion = "0.1.0";

export function rawGitHubUrl(path: string) {
  return `https://raw.githubusercontent.com/AryanJ-NYC/cmd-market/master/${path}`;
}

export type RouteLink = {
  description: string;
  href: string;
  title: string;
};
