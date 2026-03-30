import { describe, expect, test } from "vitest";
import { sellerEntryContent } from "./content";

describe("seller entry content", () => {
  test("explains the browser seller flow and route boundaries", () => {
    expect(sellerEntryContent.title).toBe("Sell on CMD Market");
    expect(sellerEntryContent.links.map((link) => link.href)).toEqual([
      "/sign-in",
      "/seller/workspace",
      "/seller/settings"
    ]);
    expect(sellerEntryContent.boundaryNote).toBe("API keys do not sign you into browser seller pages.");
  });
});
