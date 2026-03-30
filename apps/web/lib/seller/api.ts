import { NextResponse } from "next/server";
import { z } from "zod";

export function createSellerApiErrorResponse(result: {
  code: string;
  message: string;
  retryAfterMs?: number;
  status: number;
}) {
  return NextResponse.json(
    {
      error: {
        code: result.code,
        message: result.message,
        retryAfterMs: result.retryAfterMs ?? null
      }
    },
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

export async function parseOptionalSellerApiRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  invalidRequestMessage: string,
  fallbackValue: unknown
) {
  const payload = await readOptionalRequestJson(request);

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

  const parsed = schema.safeParse(payload.isEmpty ? fallbackValue : payload.data);

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
  const payload = await readRawRequestJson(request);

  if (!payload.ok || payload.isEmpty || payload.data == null) {
    return {
      ok: false as const
    };
  }

  return payload;
}

async function readOptionalRequestJson(request: Request) {
  return readRawRequestJson(request);
}

async function readRawRequestJson(request: Request) {
  try {
    const text = await request.text();

    if (text.trim().length === 0) {
      return {
        data: null,
        isEmpty: true as const,
        ok: true as const
      };
    }

    return {
      data: JSON.parse(text),
      isEmpty: false as const,
      ok: true as const
    };
  } catch {
    return {
      ok: false as const
    };
  }
}
