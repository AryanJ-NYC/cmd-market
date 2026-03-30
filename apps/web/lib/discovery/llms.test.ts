import { describe, expect, test } from "vitest";
import { buildLlmsText } from "./llms";

describe("buildLlmsText", () => {
  test("describes public routes, seller boundaries, and discovery docs", () => {
    const llms = buildLlmsText();

    expect(llms).toContain("# CMD Market");
    expect(llms).toContain("[Seller Entry](/seller)");
    expect(llms).toContain("[Sign In](/sign-in)");
    expect(llms).toContain("## Public APIs");
    expect(llms).toContain("[GET /api/categories](/api/categories)");
    expect(llms).toContain("[POST /api/seller/listings/{listingId}/publish](/api/seller/listings/{listingId}/publish)");
    expect(llms).toContain("[OpenAPI](/openapi.json)");
    expect(llms).toContain("Browser `/seller/*` routes require a browser session.");
    expect(llms).toContain("API keys authenticate seller API routes only.");
    expect(llms).toContain(
      "[Architecture](https://raw.githubusercontent.com/AryanJ-NYC/cmd-market/master/ARCHITECTURE.md)"
    );
  });
});
