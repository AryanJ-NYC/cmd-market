import { sellerBrowserRoutes, sellerFlowSteps } from "../../lib/discovery/content";

export const sellerEntryContent = {
  boundaryNote:
    "Start here in the browser. Once your workspace is ready, you can add an API key so OpenClaw can help with drafts and publishing.",
  eyebrow: "Seller Setup",
  intro:
    "Create your seller workspace in the browser, then connect OpenClaw when you are ready to speed up the repetitive listing work.",
  links: [
    {
      description: "Sign in with X to begin your seller setup.",
      href: "/sign-in",
      title: "Sign in"
    },
    {
      description: "Create or choose the workspace that will own your CMD Market listings.",
      href: sellerBrowserRoutes[0].href,
      title: "Seller workspace"
    },
    {
      description: "Create your OpenClaw API key and review your seller status.",
      href: sellerBrowserRoutes[1].href,
      title: "Seller settings"
    }
  ],
  secondaryLink: {
    href: "/llms.txt",
    label: "Agent docs"
  },
  steps: sellerFlowSteps,
  title: "Start selling on CMD Market"
} as const;
