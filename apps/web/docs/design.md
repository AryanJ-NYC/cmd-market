# CMD Market Design System

## Aesthetic

**Tokyo Night, Post-Apocalyptic Terminal**

The design evokes a neon-lit Tokyo at night, refined, slightly futuristic, but warm. Think terminal interfaces in a cyberpunk world where agents handle commerce. The aesthetic is operator-aware, human-readable, and intentional. Not a hacker parody: a refined artifact.

### Mood

- Dark, atmospheric, minimal
- Neon accents that feel like signage glimpsed through rain
- Terminal-native but not intimidating
- Code as interface, text as design
- Confidence without aggression

---

## Color Palette

Based on Tokyo Night with boosted contrast for readability.

### Backgrounds

| Token          | Hex       | Usage                                                |
| -------------- | --------- | ---------------------------------------------------- |
| `--background` | `#0f0f14` | Page background, deep near-black with blue undertone |
| `--card`       | `#16161e` | Elevated surfaces, terminal blocks                   |
| `--secondary`  | `#1a1b26` | Subtle differentiation, input backgrounds            |
| `--border`     | `#292e42` | Dividers, terminal borders                           |

### Text

| Token                    | Hex       | Usage                            |
| ------------------------ | --------- | -------------------------------- |
| `--foreground`           | `#e4e8f7` | Primary text, high contrast      |
| `--secondary-foreground` | `#c8cee0` | Secondary text                   |
| `--muted-foreground`     | `#8892b3` | Tertiary text, timestamps, hints |

### Accent Colors (The Neon Palette)

Use these sparingly for emphasis. Each has a specific semantic role:

| Token             | Hex       | Usage                                                 |
| ----------------- | --------- | ----------------------------------------------------- |
| `--tokyo-red`     | `#f7768e` | Terminal prompts (`$`), primary actions, hover states |
| `--tokyo-orange`  | `#ff9e64` | Section numbers (`01`, `02`), warnings                |
| `--tokyo-yellow`  | `#e0af68` | Highlights, attention                                 |
| `--tokyo-green`   | `#9ece6a` | Success states, confirmations                         |
| `--tokyo-cyan`    | `#7dcfff` | Step numbers, blockquote borders, links               |
| `--tokyo-blue`    | `#7aa2f7` | Information, secondary links                          |
| `--tokyo-purple`  | `#bb9af7` | Categories, tags, metadata                            |
| `--tokyo-magenta` | `#ff007c` | Reserved for critical emphasis                        |

### Color Usage Rules

1. **Never use all colors at once.** Pick 2-3 accents per section.
2. **Red for prompts.** The `$` symbol is always `--tokyo-red`.
3. **Cyan for structure.** Step numbers, borders, list markers.
4. **Orange for section markers.** The `01`, `02` eyebrows.
5. **Purple for metadata.** Categories, tags, dates.
6. **Green for success only.** Don't use decoratively.

---

## Typography

### Fonts

| Role                    | Font           | Class       |
| ----------------------- | -------------- | ----------- |
| Body text               | Inter          | `font-sans` |
| Code, terminal, prompts | JetBrains Mono | `font-mono` |

### Hierarchy

```text
Eyebrow:     font-mono text-sm text-[var(--tokyo-orange)]     -> "01"
Heading:     font-sans text-3xl font-medium text-foreground  -> "Start with the skill."
Body:        font-sans text-base text-foreground/80          -> Paragraph text
Terminal:    font-mono text-sm text-muted-foreground         -> $ clawhub install...
Caption:     font-mono text-xs text-muted-foreground         -> Timestamps, hints
```

### Rules

1. **Monospace is for machine text.** Commands, prompts, section numbers, code.
2. **Sans-serif is for human text.** Headlines, body copy, descriptions.
3. **Never mix them mid-sentence** unless showing inline code.
4. **Headings are medium weight**, not bold. Confidence, not shouting.

---

## Layout Principles

### Spacing

- Generous whitespace. Let content breathe.
- Use `py-24` or `py-32` between major sections.
- Consistent horizontal padding: `px-6 md:px-8 lg:px-12`.
- Max content width: `max-w-3xl` for prose, `max-w-5xl` for layouts.

### Structure

- **No cards.** Use horizontal rules (`border-t border-border`) and spacing instead.
- **No floating blobs.** No gradient decorations. No fake dashboards.
- **Borders are thin.** `border` not `border-2`.
- **Corners are sharp.** `--radius: 0.25rem`. Almost square.

### Hierarchy with Rules

```jsx
{
  /* Section divider */
}
<hr className="border-t border-border" />;

{
  /* Vision/quote callout */
}
<p className="border-l-2 border-[var(--tokyo-cyan)] pl-4">Quoted or emphasized text here.</p>;
```

---

## Components

### Terminal Block

The signature component. A code block that feels native.

```jsx
<div className="overflow-hidden rounded border border-border bg-card">
  {/* Header */}
  <div className="flex items-center justify-between border-b border-border px-4 py-2">
    <span className="font-mono text-xs text-muted-foreground">terminal</span>
    <button className="font-mono text-xs text-muted-foreground hover:text-foreground">Copy</button>
  </div>
  {/* Content */}
  <div className="p-4 font-mono text-sm">
    <p className="text-muted-foreground">
      <span className="text-[var(--tokyo-red)]">$</span> clawhub install AryanJ-NYC/cross-listing-ai
    </p>
  </div>
</div>
```

### Section Eyebrow

Numbered sections establish rhythm.

```jsx
<p className="mb-3 font-mono text-sm text-[var(--tokyo-orange)]">01</p>
<h2 className="text-3xl font-medium tracking-tight">Start with the skill.</h2>
```

### Step List

Instructions feel terminal-native.

```jsx
<div className="space-y-3 font-mono text-sm text-muted-foreground">
  <p>
    <span className="mr-3 text-[var(--tokyo-cyan)]">1.</span>Open OpenClaw
  </p>
  <p>
    <span className="mr-3 text-[var(--tokyo-cyan)]">2.</span>Install the skill
  </p>
  <p>
    <span className="mr-3 text-[var(--tokyo-cyan)]">3.</span>Upload a photo
  </p>
</div>
```

### Blockquote

For emphasis and callouts.

```jsx
<blockquote className="border-l-2 border-[var(--tokyo-cyan)] pl-6 text-foreground/90">
  <p>The point isn't the listing. It's who, or what, creates it.</p>
</blockquote>
```

### Inline Code

For technical terms in prose.

```jsx
<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm text-[var(--tokyo-cyan)]">
  cross-listing-ai
</code>
```

### Links

Subtle, with colored hover states.

```jsx
<a className="text-foreground underline underline-offset-4 hover:text-[var(--tokyo-cyan)]">
  Read more
</a>;

{
  /* Or with arrow */
}
<a className="inline-flex items-center gap-2 font-mono text-sm text-foreground hover:text-[var(--tokyo-red)]">
  Read the post <ArrowRight className="h-4 w-4" />
</a>;
```

---

## Don'ts

1. **No purple/violet as primary.** That's generic AI aesthetic.
2. **No gradient backgrounds.** Solid colors only.
3. **No floating shapes.** No circles, no blobs, no decorative SVGs.
4. **No rounded corners > 0.25rem.** Keep it sharp.
5. **No card shadows.** Elevation comes from background color.
6. **No emoji in UI.** Terminal aesthetic is text-only.
7. **No fake dashboards.** Don't show UI that doesn't exist.
8. **No walls of text.** Short paragraphs, clear hierarchy.

---

## Do's

1. **Use horizontal rules** to separate sections.
2. **Use numbered eyebrows** (`01`, `02`) to create rhythm.
3. **Use monospace for anything "typed"**: commands, prompts, code.
4. **Use left borders** for emphasis and quotes.
5. **Use whitespace generously.** When in doubt, add more.
6. **Use muted colors for secondary info.** Let primary content dominate.
7. **Use color sparingly.** One accent per element, max two per section.
8. **Keep copy tight.** Say it in fewer words.

---

## Example: Blog Post Structure

```jsx
<article className="mx-auto max-w-3xl px-6 py-24">
  {/* Back link */}
  <Link
    href="/"
    className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="h-4 w-4" /> Back
  </Link>

  {/* Header */}
  <header className="mt-12">
    <p className="font-mono text-sm text-[var(--tokyo-orange)]">01</p>
    <h1 className="mt-3 text-4xl font-medium tracking-tight">Title Here</h1>
    <p className="mt-4 text-lg text-muted-foreground">Subtitle or description.</p>
    <p className="mt-6 font-mono text-xs text-muted-foreground">2025-03-11</p>
  </header>

  {/* Content */}
  <div className="mt-16 space-y-8">
    <p className="text-foreground/90 leading-relaxed">Body text...</p>

    <blockquote className="border-l-2 border-[var(--tokyo-cyan)] pl-6">
      <p>Emphasized quote.</p>
    </blockquote>

    {/* Terminal block */}
    <div className="rounded border border-border bg-card">...</div>
  </div>
</article>
```

---

## Voice

The copy should feel:

- **Confident but not arrogant.** We know what we're building.
- **Technical but accessible.** Explain, don't gatekeep.
- **Dry wit, not jokes.** Understated humor. No exclamation points.
- **Direct.** Short sentences. No fluff.

### Examples

**Good:** "No dashboard. No subscription maze. Just a skill."

**Bad:** "We're excited to bring you an amazing new way to sell your stuff!"

**Good:** "List your inventory through OpenClaw. Let buyers find it on the web, or through their own agents."

**Bad:** "Our revolutionary AI-powered platform enables seamless multi-channel listing distribution."

---

## File Reference

- **Colors:** `apps/web/app/globals.css`
- **Fonts:** `apps/web/app/layout.tsx`
- **Example components:** `apps/web/app/_components/landing/hero-section.tsx`, `apps/web/app/_components/landing/skill-section.tsx`, `apps/web/app/_components/landing/blog-section.tsx`
- **Example page:** `apps/web/app/blog/sell-stuff-with-openclaw/page.tsx`
