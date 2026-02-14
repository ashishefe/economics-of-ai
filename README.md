# Economics of AI — Interactive Learning Resource

**Private repository. Not for public distribution.**

This is the companion website for the *Economics of AI* lecture delivered by Ashish Kulkarni at the Takshashila Institution as part of the GCPP (Graduate Certificate in Public Policy) program. It is designed specifically for students who attended that presentation and is not a general-purpose tool.

---

## What This Is

A static website that turns the 20-slide lecture into a personalized, post-lecture learning experience. Rather than just sharing slides and hoping students review them, this site lets each student:

1. **Identify themselves** — name, profession, and what they're curious about regarding AI
2. **Walk through every slide** at their own pace, with interactive prompt hotspots overlaid on the slide images
3. **Collect prompts** tailored to their background by clicking on hotspots
4. **Download a `.md` file** containing all their collected prompts, wrapped in instructions that turn any LLM into a personalized tutor

The idea: a lecture is one hour, but the learning conversation it starts can go much deeper — if you give students the right starting points.

## How It Works

### The Flow

**Intro page** — The student enters their name (optional), profession, and what they're most curious about. This is stored in the browser's `localStorage` and never sent anywhere.

**Slide viewer** — Each slide is displayed as an image with small numbered circles at key points of interest. These circles are intentionally faint so they don't obscure the slide content, and become visible on hover. There are four types of prompts:

- **Master prompts** (star icon, top-right of each slide) — cover the entire slide's theme
- **Verify prompts** — help the student fact-check specific claims made on the slide
- **Apply prompts** — connect the concept to the student's own profession
- **Steelman prompts** — challenge the student to argue for or against a position

Hovering over a circle previews the prompt; clicking copies it to the clipboard and adds it to the student's collection.

**Help page** — Explains how to use the downloaded file. Includes both a download button and a preview button that shows the `.md` content in a modal before downloading.

**The `.md` file** — This is the real output. It contains:
- Instructions for the LLM to act as a personalized tutor
- A check for whether the student also uploaded the `.pptx` (the LLM will ask if they forgot)
- The student's profile (profession, curiosity)
- All collected prompts, grouped by slide, to be addressed one at a time
- A meta-prompt at the end for continuing the learning journey beyond the collected prompts

The student uploads this file (ideally alongside the original `.pptx`) into any LLM — Claude, ChatGPT, Gemini, or whatever they prefer — and gets a conversation partner that already knows who they are and what caught their attention.

### Prompt Coverage

The site contains **42 prompts** across **16 of the 20 slides** (the remaining 4 are title/section divider slides with no specific claims to explore). The prompts cover the full lecture arc:

- **Upstream** (slides 2-8): Cost structure of AI — training costs, silicon infrastructure, data constraints, training vs. inference economics, energy and talent
- **Midstream** (slides 10-13): Market structure — the two-tier oligopoly, why it persists, open source as competitive force, supply chains and geopolitics
- **Downstream** (slides 15-20): Markets and impacts — pricing and business models, the agentic economy, labor markets and productivity, who captures the gains, key takeaways

## Privacy

**No data leaves the browser.** This is a fully static site with no backend, no analytics, no tracking, and no server-side code of any kind. Specifically:

- Student intake data (name, profession, curiosity) is stored in `localStorage` — a browser-only store on the student's device
- Collected prompts are stored in `sessionStorage` — browser-only, cleared when the tab closes
- The `.md` file is generated entirely in client-side JavaScript and downloaded directly
- The only network request the site makes is loading `prompts.json`, which is a local file that ships with the site

## Project Structure

```
index.html          — Intro page with intake form
slides.html         — Slide viewer with hotspot overlays
help.html           — Instructions + download/preview
css/style.css       — All styles (responsive: mobile, tablet, desktop)
js/app.js           — Slide navigation, hotspots, clipboard, .md generation
js/prompts.json     — All 42 prompts with slide mapping and hotspot coordinates
images/slide-*.png  — The 20 slide images exported from the .pptx
```

## Running Locally

No build step. Open `index.html` in a browser, or serve the directory with any static server:

```
npx serve .
```

or

```
python3 -m http.server 8000
```

The `fetch('js/prompts.json')` call requires serving over HTTP (not `file://`), so a local server is needed.

## Deployment

The site is deployed on Vercel. Since it's entirely static (no framework, no build), Vercel serves the files as-is. Any static hosting platform would work identically.

---

*Presentation by Ashish Kulkarni — Takshashila Institution, GCPP Program*
