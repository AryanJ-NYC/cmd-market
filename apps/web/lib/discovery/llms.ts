import {
  discoveryNotes,
  discoverySummary,
  publicApiRoutes,
  publicRoutes,
  repoDocs,
  sellerApiRoutes,
  sellerBrowserRoutes
} from "./content";

export function buildLlmsText() {
  return [
    "# CMD Market",
    "",
    `> ${discoverySummary}`,
    "",
    ...discoveryNotes,
    "",
    "## Public Routes",
    ...formatLinkSection(publicRoutes),
    "",
    "## Seller Browser Routes",
    ...formatLinkSection(sellerBrowserRoutes),
    "",
    "## Public APIs",
    ...formatLinkSection(publicApiRoutes),
    "",
    "## Seller APIs",
    ...formatLinkSection(sellerApiRoutes),
    "",
    "## Repo Docs",
    ...formatLinkSection(repoDocs),
    "",
    "## Optional",
    "- [README](https://raw.githubusercontent.com/AryanJ-NYC/cmd-market/master/README.md): Repo entrypoint and quick-start commands."
  ].join("\n");
}

function formatLinkSection(items: readonly { description: string; href: string; title: string }[]) {
  return items.map((item) => `- [${item.title}](${item.href}): ${item.description}`);
}
