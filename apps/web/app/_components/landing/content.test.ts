import { describe, expect, test } from "vitest";
import { agentQuickstartItems, heroContent } from "./content";

describe("landing content", () => {
  test("gives the hero clear seller and agent entry points", () => {
    expect(heroContent.headline).toContain("One marketplace surface");
    expect(heroContent.primaryCta.href).toBe("/seller");
    expect(heroContent.primaryCta.label).toBe("For sellers");
    expect(heroContent.secondaryCta.href).toBe("/llms.txt");
    expect(heroContent.secondaryCta.label).toBe("For agents");
  });

  test("makes the agent quickstart and auth boundary explicit", () => {
    expect(agentQuickstartItems.map((item) => item.href)).toContain("/openapi.json");
    expect(agentQuickstartItems.map((item) => item.href)).toContain("/api/seller/context");
    expect(agentQuickstartItems.some((item) => item.note.includes("API keys authenticate seller API routes only."))).toBe(
      true
    );
  });
});
