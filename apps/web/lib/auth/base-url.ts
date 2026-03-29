const AUTH_ALLOWED_HOSTS = [
  "localhost:*",
  "*.vercel.app",
  "cmd.market",
  "www.cmd.market",
  "testnet.cmd.market"
] as const;

function getAuthBaseUrl(nodeEnv: string | undefined) {
  const protocol: "http" | "https" = nodeEnv === "development" ? "http" : "https";

  return {
    allowedHosts: [...AUTH_ALLOWED_HOSTS],
    protocol
  };
}

export { AUTH_ALLOWED_HOSTS, getAuthBaseUrl };
