import { env } from "./env";

export function createPublicUrlBuilder(input: Headers | Request) {
  const origin = resolvePublicOrigin(input);

  return (pathname: string) => new URL(pathname, `${origin}/`).toString();
}

function resolvePublicOrigin(input: Headers | Request) {
  if (input instanceof Request) {
    return new URL(input.url).origin;
  }

  const host = readForwardedHeader(input, "x-forwarded-host") ?? input.get("host");

  if (!host) {
    throw new Error("Cannot resolve public origin without a host header.");
  }

  const protocol =
    readForwardedHeader(input, "x-forwarded-proto") ??
    (env.nodeEnv === "development" ? "http" : "https");

  return `${protocol}://${host}`;
}

function readForwardedHeader(headers: Headers, name: string) {
  const value = headers.get(name);

  if (!value) {
    return null;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean) ?? null;
}
