import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { activateSellerWorkspace } from "../../../../lib/seller/service";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const organizationId = requestUrl.searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.redirect(new URL("/seller/workspace?error=Workspace+selection+is+required.", request.url));
  }

  try {
    await activateSellerWorkspace(await headers(), organizationId);
  } catch (caughtError) {
    return NextResponse.redirect(
      new URL(`/seller/workspace?error=${encodeURIComponent(getActivationErrorMessage(caughtError))}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/seller/settings", request.url));
}

function getActivationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Workspace activation could not be completed.";
}
