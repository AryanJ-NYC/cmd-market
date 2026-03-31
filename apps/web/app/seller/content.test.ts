import { describe, expect, test } from "vitest";
import { sellerEntryContent } from "./content";

describe("seller entry content", () => {
  test("explains the browser seller flow and route boundaries", () => {
    expect(sellerEntryContent.title).toBe("Start selling on CMD Market");
    expect(sellerEntryContent.links.map((link) => link.href)).toEqual([
      "/sign-in",
      "/seller/workspace",
      "/seller/settings"
    ]);
    expect(sellerEntryContent.boundaryNote).toBe(
      "Start here in the browser. Once your workspace is ready, you can add an API key so OpenClaw can help with drafts and publishing."
    );
  });
});
