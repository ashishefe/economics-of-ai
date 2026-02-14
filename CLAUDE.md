# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Companion website for the *Economics of AI* lecture by Ashish Kulkarni at Takshashila Institution (GCPP program). A fully static, zero-dependency site that turns a 20-slide presentation into a personalized post-lecture learning tool. Students identify themselves, browse slides with interactive prompt hotspots, collect prompts, and download a `.md` file that turns any LLM into a personalized tutor.

## Running Locally

No build step. Serve the root directory with any static server (fetch requires HTTP, not `file://`):

```
npx serve .
# or
python3 -m http.server 8000
```

There is no package.json, no linter, no test suite, no build pipeline.

## Architecture

**Three-page flow:** `index.html` (intake form) → `slides.html` (viewer) → `help.html` (download/preview)

**Single JS module:** `js/app.js` is an IIFE that owns all slide viewer logic — navigation, hotspot rendering, clipboard, prompt collection, and `.md` generation.

**Data file:** `js/prompts.json` contains 42 prompts (master, verify, apply, steelman types) with slide mappings and hotspot coordinates as percentage-based rectangles (`{x, y, w, h}`).

**Help page has its own inline script** that duplicates the `.md` generation logic (reads from storage, builds the same markdown). Changes to the `.md` format must be updated in **both** `app.js` `downloadMd()` and `help.html` `generateMd()`.

## Key Data Flow

- **Intake data** → `localStorage` key `econ-ai-intake` (persists across sessions)
- **Current slide** → `sessionStorage` key `econ-ai-current-slide`
- **Collected prompts** → `sessionStorage` key `econ-ai-collected` (array of `{slide, title, label, prompt}`)
- **Template filling** → `fillTemplate()` replaces `{{profession}}`/`{{curiosity}}`/`{{name}}` patterns. Multi-placeholder patterns like "As a {{profession}} who is curious about {{curiosity}}" are collapsed to "Given what you know about me" since the `.md` preamble already contains the full learner context.

## CSS Design System

All styles live in `css/style.css` (~1090 lines). Key tokens in `:root`:
- Colors: `--navy` (#1e3a5f), `--teal` (#3d7a9c), `--bg` (#f5f7fa)
- Header background is `#2d5a7a` (between navy and teal)
- Fonts: Spectral (serif, headings), Inter (sans, body) via Google Fonts
- Three responsive breakpoints: mobile (≤640px), tablet (641–960px), desktop (961px+)
- Desktop intro page uses side-by-side flexbox layout; mobile stacks vertically

## Hotspot System

Circles are positioned using percentage-based coordinates relative to the slide image wrapper. Specialized prompts sit at the **top-right corner** of their hotspot rectangle (`x + w`, `y`). Master prompts (star icon) are fixed at 93%/8%. Circles are faint by default and reveal on hover. An invisible `::after` pseudo-element on each circle bridges the 12px gap to the tooltip so the tooltip stays visible when the cursor moves to it.

## Privacy Constraint

**No data leaves the browser.** No analytics, no server calls, no external APIs (except Google Fonts CDN). All storage is localStorage/sessionStorage. The `.md` file is generated client-side via Blob URL. This is a hard requirement — do not introduce any data exfiltration.

## Navigation Boundaries

Prev on slide 1 navigates to `index.html`; Next on slide 20 navigates to `help.html`. Button labels update to reflect this ("← Intro" / "Help →"). Keyboard arrows follow the same logic.
