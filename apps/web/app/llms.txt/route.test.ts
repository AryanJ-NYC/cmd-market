import { describe, expect, test } from "vitest";
import { GET } from "./route";

describe("GET /llms.txt", () => {
  test("returns plain text llms content", async () => {
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("# CMD Market");
  });
});
