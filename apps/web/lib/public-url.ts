import { env } from "./env";

export function createPublicUrlBuilder(input: Headers | Request) {
  const origin = resolvePublicOrigin(input);

  return (pathname: string) => new URL(pathname, `${origin}/`).toString();
}

function resolvePublicOrigin(input: Headers | Request) {
  const headers = input instanceof Request ? input.headers : input;
  const forwardedOrigin = resolveForwardedOrigin(headers);

  if (forwardedOrigin) {
    return forwardedOrigin;
  }

  if (input instanceof Request) {
    return new URL(input.url).origin;
  }

  throw new Error("Cannot resolve public origin without a host header.");
}

function resolveForwardedOrigin(headers: Headers) {
  const host = readForwardedHeader(headers, "x-forwarded-host") ?? headers.get("host");

  if (!host) {
    return null;
  }

  const protocol =
    readForwardedHeader(headers, "x-forwarded-proto") ??
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
