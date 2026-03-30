import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeSellerApiErrorBody } from "./http";

export function createSellerApiErrorResponse(result: {
  code: string;
  message: string;
  retryAfterMs?: number;
  status: number;
}) {
  return NextResponse.json(
    serializeSellerApiErrorBody(result),
    {
      headers:
        typeof result.retryAfterMs === "number"
          ? {
              "Retry-After": String(Math.ceil(result.retryAfterMs / 1000))
            }
          : undefined,
      status: result.status
    }
  );
}

export async function parseSellerApiRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  invalidRequestMessage: string
) {
  const payload = await readRequestJson(request);

  if (!payload.ok) {
    return {
      ok: false as const,
      response: createSellerApiErrorResponse({
        code: "invalid_request",
        message: invalidRequestMessage,
        status: 400
      })
    };
  }

  const parsed = schema.safeParse(payload.data);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: createSellerApiErrorResponse({
        code: "invalid_request",
        message: invalidRequestMessage,
        status: 400
      })
    };
  }

  return {
    data: parsed.data,
    ok: true as const
  };
}

async function readRequestJson(request: Request) {
  try {
    return {
      data: await request.json(),
      ok: true as const
    };
  } catch {
    return {
      ok: false as const
    };
  }
}
