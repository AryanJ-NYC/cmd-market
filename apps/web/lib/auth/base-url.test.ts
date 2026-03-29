import { describe, expect, it } from "vitest";
import { AUTH_ALLOWED_HOSTS, getAuthBaseUrl } from "./base-url";

describe("auth base url", () => {
  it("allows local, preview, and approved production hosts", () => {
    expect(AUTH_ALLOWED_HOSTS).toEqual([
      "localhost:*",
      "*.vercel.app",
      "cmd.market",
      "www.cmd.market",
      "testnet.cmd.market"
    ]);
  });

  it("uses http locally and https elsewhere", () => {
    expect(getAuthBaseUrl("development")).toEqual({
      allowedHosts: AUTH_ALLOWED_HOSTS,
      protocol: "http"
    });

    expect(getAuthBaseUrl("production")).toEqual({
      allowedHosts: AUTH_ALLOWED_HOSTS,
      protocol: "https"
    });
  });
});
