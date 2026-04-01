import { sellerBrowserRoutes, sellerFlowSteps } from "../../lib/discovery/content";

const sellerWorkspaceRoute = findSellerBrowserRoute("/seller/workspace");
const sellerSettingsRoute = findSellerBrowserRoute("/seller/settings");

export const sellerEntryContent = {
  boundaryNote:
    "Start here in the browser. OpenClaw can now launch the preferred browser handoff flow, and seller settings remains the manual fallback if you ever need to mint a key directly.",
  eyebrow: "Seller Setup",
  intro:
    "Create your seller workspace in the browser, then connect OpenClaw through the browser handoff when you are ready to speed up the repetitive listing work.",
  links: [
    {
      description: "Sign in with X to begin your seller setup.",
      href: "/sign-in",
      title: "Sign in"
    },
    {
      description: "Create or choose the workspace that will own your CMD Market listings.",
      href: sellerWorkspaceRoute.href,
      title: "Seller workspace"
    },
    {
      description: "Review seller status and manually create an OpenClaw API key if you need the fallback path.",
      href: sellerSettingsRoute.href,
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

function findSellerBrowserRoute(href: string) {
  const route = sellerBrowserRoutes.find((item) => item.href === href);

  if (!route) {
    throw new Error(`Missing seller browser route: ${href}`);
  }

  return route;
}
