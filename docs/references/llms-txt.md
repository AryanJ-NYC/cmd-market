# llms.txt Reference

This repo follows the `llms.txt` proposal described at [llmstxt.org](https://llmstxt.org/).

## Format Rules We Use

- Serve the file at the web root as `/llms.txt`.
- Use Markdown, with sections in this order:
  - one required H1 naming the project
  - a short blockquote summary
  - optional freeform notes before any headings
  - H2 sections that contain markdown link lists
- Use the `Optional` section only for lower-priority links that an agent can skip when context is tight.

## CMD Market-Specific Guidance

- The canonical generator lives in `apps/web/lib/discovery/llms.ts`, and `apps/web/app/llms.txt/route.ts` serves the built output.
- The file should stay focused on agent-operable entry points, especially seller bootstrap, category metadata, public listing reads, and OpenClaw authorization.
- Prefer linking to raw Markdown docs when pointing at repository documentation.
- Prefer plain-language operating instructions above the link sections so agents can act without guessing.
