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

- The canonical file lives at `apps/web/public/llms.txt`, so the Next.js app serves it directly.
- The file should stay focused on agent-operable entry points, especially seller bootstrap and OpenClaw authorization.
- Prefer linking to raw Markdown docs when pointing at repository documentation.
- Prefer plain-language operating instructions above the link sections so agents can act without guessing.
