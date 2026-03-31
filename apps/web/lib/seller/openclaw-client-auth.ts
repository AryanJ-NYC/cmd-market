import { timingSafeEqual } from "node:crypto";
import { env } from "../env";
import { createSellerApiErrorResponse } from "./api";

export function requireOpenClawClientAuthorization(request: Request) {
  if (isOpenClawClientAuthorized(request)) {
    return null;
  }

  return createSellerApiErrorResponse({
    code: "unauthorized",
    message: "Valid OpenClaw client authorization is required.",
    status: 401
  });
}

function isOpenClawClientAuthorized(request: Request) {
  const authorizationHeader = request.headers.get("authorization");
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  const providedSecret = match?.[1]?.trim();

  if (!providedSecret) {
    return false;
  }

  return timingSafeEqualIfSameLength(providedSecret, env.openClawClientSecret);
}

function timingSafeEqualIfSameLength(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
