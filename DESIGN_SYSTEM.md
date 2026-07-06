# NanoFlashing Design System — Single Source of Truth (SSOT)

**Authoritative. Locked.** Every page, deck, and asset must follow this. Values here are
extracted from the Yin-approved locked decks (`fungi.html`, `wildfire.html` + their sections),
not invented. Before any design or copy work: **read this, pull the value from here, do not
guess.** To change anything in this file, **un-lock first** (see Change Control) — a change here
is a change to the whole system.

Repo: `aldrinor/nf-bigidea-preview` → `C:\EPA\US\website_project\_deploy`.

---

## 1. Voice & writing tone

- **Plain, simple English.** Short declarative sentences. Subject, verb, fact. (Yin reads by ear.)
- **Lean and crisp.** No padding, no repetition, no decoration, no "flower English".
- **Capitalization (strict):**
  - Body copy = sentence case.
  - Headings, titles, labels, legends = **Title Case**, and *strict* — capitalize every word,
    including short ones like "Per" (e.g. "136 Million Airborne Fungal Spores Per Sample").
  - **No ALL-CAPS.** The only caps tokens allowed are measurements/acronyms: PM 2.5, nm, µm,
    EPA, CADR, MERV, MERV-13, RoHS, GLP, UL, ISO, OEKO-TEX.
  - Never a mixed heading like "Wildfire smoke" — it's "Wildfire Smoke".
- **Message priority:** lead with charge / material / platform. "Proven in air" = proof once,
  never a headline; do not over-emphasize air.
- **Claim language (public copy):**
  - Allowed: material / filter / physical action. "Captures and destroys" IS the goal claim
    (FIFRA 2(h)) — do NOT flag "destroys" / "pathogens" as kill-words.
  - Banned: ingredient / substance / polymer / active / "protected by C-POLAR" (pesticide trap).
  - Device credentials are fine (OEKO-TEX, RoHS, GLP, UL, ISO, FDA food-contact).

## 2. Typography

**Fonts** (CSS custom properties, defined in every page's `:root`):
- Sans (default, everything): `--stack: -apple-system, system-ui, 'Inter', 'Space Grotesk', sans-serif`
- Mono (measurements / unit tokens ONLY): `--mono: 'Space Mono', ui-monospace, monospace`
- Instrument Serif is **dropped** — do not use serif headlines.

**Type scale (role → size / weight / color), from the locked files:**

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Headline | `clamp(24px, 2.7vw, 34px)` / line-height 1.32 | 600 | `--headline-ink` #1a1a1a |
| Lead / kicker (stat sub-line) | `clamp(17px, 1.5vw, 20px)` | 440 | `--ink` #1f2327 |
| Big stat number | `clamp(56px, 6vw, 96px)` | 700 | `--accent` #1b7bff |
| Body | 19px (mobile `clamp(16px,1.5vw,19px)`) / line-height ~1.5 | 440 | `--ink` #1f2327 |
| Caption / on-graphic label (primary) | 22px, letter-spacing 0.01em | 500 | ink #1f2327 or accent #1b7bff | 
| Secondary caption / link | 16px | 400 | `--ink` / `--accent` |
| Unit / measurement token | 10–12px, `--mono` | 400 | `--muted` #8a9095 |

The primary caption/label standard is the ball page's "2 to 3 µm" caption (`.scale .label`):
sans, 22px, weight 500, letter-spacing 0.01em. On-graphic labels follow it.

## 3. Color palette (the whole palette — nothing else)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#edf0f2` | Page background. LIGHT theme always. |
| `--ink` | `#1f2327` | Body text. |
| `--headline-ink` | `#1a1a1a` | Headlines only. |
| `--accent` | `#1b7bff` | The ONE accent — blue, **not cyan**. NanoFlashing side, stats, links. |
| `--red` | `#e23b3b` | Alert / "conventional/bad" side. Sparing. |
| `--muted` | `#8a9095` | Secondary/annotation grey. |
| `--hair` | `rgba(20,24,28,0.08)` | Hairlines / dividers. |

One accent only. Restraint over density.

## 4. Layout, position, alignment

- **Split hero:** text column LEFT, visual/graphic RIGHT. Text left-aligned.
- **On-graphic labels** sit off the busy texture, on clean/light areas, centered under (or above)
  their target. When two labels caption two halves, use ONE **level baseline** (don't stagger to
  follow a tilt) — each centered on its half's visual middle. Legend goes one line above the sample.
- **No leader lines** on labels.
- **Alignment must be measured, not eyeballed.** For labels over a rendered clip, align to the
  video's **last (resting) frame**, not the poster.
- Consistency rule (when matching pages): touch ONLY font, size, position, alignment, structure —
  never content (copy/numbers) or graphics.

## 5. Design style (principles)

- **Frontier = restraint, not density.** North stars: interceptfund.com (extreme whitespace,
  minimal type, one accent) and the Dyson render benchmark for premium specimen shots.
- Light, calm, lots of whitespace. One idea per screen.
- Never present a cheap look-alike as finished (e.g. a flat PNG posing as 3D). Build the real thing.

## 6. Graphic & motion style

- **Premium realistic renders**, real data. Specimens from real sources (PubChem SDF, RCSB PDB),
  not flat art. Macro depth-of-field. Dyson benchmark = the quality bar.
- **Tool roles are fixed** (do not mix): Codex Gen 2 = generates/edits IMAGES · GLM 5.2 = writes
  UI/CSS/canvas CODE · GLM 5V = visual GATE · Seedance = VIDEO · Claude = orchestrate + harvest.
  Claude must not hand-draw graphics or hand-code UI.

## 7. URL & deploy policy — stable URLs, no churn

**One site, one domain, forever:** `https://aldrinor.github.io/nf-bigidea-preview/`
(GitHub Pages tied to the repo — the domain never changes; we never spin up a new site).

Rules that keep URLs stable:
1. **Fixed page paths.** Each page keeps its URL: `/fungi.html`, `/wildfire.html`, etc.
   New work **edits the existing page in place**. Never create `_v2` / `_test` / `_shock` / `_new`
   scratch pages — edit the real one.
2. **One canonical filename per asset.** Overwrite the asset in place. To beat browser cache, bump a
   query string `?v=N` (e.g. `mold_answer.mp4?v=5`) — **never** mint a new filename per revision.
3. Deploy = commit to `main`; GitHub Pages publishes to the same URLs. Builds can be flaky/uneven —
   verify a change is actually served (with an **unambiguous** marker) before telling Yin.

## Change control

This system is **locked** alongside the decks (git tag `fungi-wildfire-locked-2026-07-06` and
successors). Do not edit design values, this file, or the locked deck files without Yin explicitly
un-locking. Back up before any change.
