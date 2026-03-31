import { buildOpenApiDocument } from "../../lib/discovery/openapi";

export async function GET() {
  return Response.json(buildOpenApiDocument());
}
