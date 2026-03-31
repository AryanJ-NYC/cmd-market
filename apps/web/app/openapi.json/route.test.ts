import { describe, expect, test } from "vitest";
import { GET } from "./route";

describe("GET /openapi.json", () => {
  test("returns the generated OpenAPI document", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/api/seller/context"]).toBeDefined();
    expect(body.paths["/api/categories"]).toBeDefined();
  });
});
