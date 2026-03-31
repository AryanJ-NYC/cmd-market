import { buildLlmsText } from "../../lib/discovery/llms";

export async function GET() {
  return new Response(buildLlmsText(), {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
