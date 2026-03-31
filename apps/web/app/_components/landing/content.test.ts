import { describe, expect, test } from "vitest";
import { agentQuickstartItems, finalCtaContent, heroContent } from "./content";

describe("landing content", () => {
  test("gives the hero clear seller and agent entry points", () => {
    expect(heroContent.headline).toContain("listing step by hand");
    expect(heroContent.primaryCta.href).toBe("/seller");
    expect(heroContent.primaryCta.label).toBe("Create seller workspace");
    expect(heroContent.secondaryCta.href).toBe("/llms.txt");
    expect(heroContent.secondaryCta.label).toBe("Agent docs");
  });

  test("makes the agent quickstart and auth boundary explicit", () => {
    expect(agentQuickstartItems.map((item) => item.href)).toContain("/openapi.json");
    expect(agentQuickstartItems.map((item) => item.href)).toContain("/api/seller/context");
    expect(agentQuickstartItems.some((item) => item.note.includes("Seller API keys work on `/api/seller/*` only."))).toBe(
      true
    );
  });

  test("repeats a seller-focused CTA near the bottom of the page", () => {
    expect(finalCtaContent.primaryCta.href).toBe("/seller");
    expect(finalCtaContent.primaryCta.label).toBe("Create seller workspace");
    expect(finalCtaContent.headline).toContain("start selling");
  });
});
