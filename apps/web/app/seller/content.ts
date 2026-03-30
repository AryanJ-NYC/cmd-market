import { sellerBrowserRoutes, sellerFlowSteps } from "../../lib/discovery/content";

export const sellerEntryContent = {
  boundaryNote: "API keys do not sign you into browser seller pages.",
  eyebrow: "Seller Entry",
  intro:
    "Start in the browser to create or activate the seller workspace, then create the OpenClaw API key inside settings when you are ready to hand draft creation, category-aware patching, media attachment, and publish work to an agent.",
  links: [
    {
      description: "Start seller authentication through Twitter/X.",
      href: "/sign-in",
      title: "Sign in"
    },
    {
      description: sellerBrowserRoutes[0].description,
      href: sellerBrowserRoutes[0].href,
      title: "Seller workspace"
    },
    {
      description: sellerBrowserRoutes[1].description,
      href: sellerBrowserRoutes[1].href,
      title: "Seller settings"
    }
  ],
  secondaryLink: {
    href: "/llms.txt",
    label: "Agent route map"
  },
  steps: sellerFlowSteps,
  title: "Sell on CMD Market"
} as const;
