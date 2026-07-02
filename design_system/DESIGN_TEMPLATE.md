# NanoFlashing — LOCKED Design Template & Tokens

**Locked 2026-07-02 at Yin's instruction.** This is the single source of truth for the
site's look. The **reference implementation** is `_deploy/wf_solution.html` (the wildfire
"answer" section) — Yin approved its layout, chart style, tokens, casing, and dust effect
as the standard. Tokens + base CSS live in `_deploy/design_system/design_tokens.css`.

> Do not re-skin, recolor, add fonts, or invent tokens without Yin's sign-off.
> When a new page conflicts with this template, change the new page — never this template.

---

## 1. Design tokens (LOCKED)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#edf0f2` | cool off-white background — whole site, light theme only |
| `--ink` | `#1f2327` | primary text |
| `--headline-ink` | `#1a1a1a` | headlines |
| `--muted` | `#8a9095` | captions, axis, secondary, dust particles |
| `--accent` | `#1b7bff` | THE one accent — blue. good / hero. **never cyan** |
| `--red` | `#e23b3b` | bad / failing element only, used sparingly |
| `--hair` | `rgba(20,24,28,0.08)` | hairlines, faint gridlines |
| `--stack` | `-apple-system, system-ui, 'Inter', 'Space Grotesk', sans-serif` | headings, body, labels |
| `--mono` | `'Space Mono', ui-monospace, monospace` | number / size / measurement tokens |

**Color rule:** GOOD = blue (`--accent`), BAD = red (`--red`, sparingly). One accent only.

## 2. Type scale (LOCKED)

| Element | Desktop size | Weight | Notes |
|---------|-------------|--------|-------|
| Headline | `clamp(24px, 2.7vw, 34px)` | 600 | `--stack`, letter-spacing −0.022em, accent word in `<em>` blue |
| Big stat number | `clamp(52px, 6vw, 92px)` | 700 | tabular-nums; `width:2.95em; text-align:right` so % signs align |
| Caption (beside stat) | `clamp(16px, 1.5vw, 19px)` | 400 | max-width 24ch |
| Body paragraph | `19px` / lh 1.55 | 400 | max-width 440px |
| Link | `19px` | 400 | blue, 1px underline border, hover → ink |
| Chart axis titles | `~15` (svg units) | 400 | Title Case |
| Chart specimen names | `~11` (svg units) | 400 | Title Case; sizes in `--mono` ~10 |
| Chart tick numbers | `~10–11` (svg units) | 400 | muted |

## 3. Casing rule (LOCKED — Yin is strict on this)

- **Headings / titles / labels / axis-titles / legends = Title Case** (e.g. "Wildfire Smoke",
  "Particle Size (nm)", "Hexavalent Chromium", "HEPA Rated Size · 0.3 µm").
- **Body / passages = sentence case.**
- **ALL-CAPS = never.**
- Acronyms / units always stay as-is: **MERV, HEPA, PM 2.5, PM10, nm, µm, EPA, NOAA, CADR, ASHRAE**.

## 4. Layout template

A section is one full screen (`min/max-height:100vh`, `overflow:hidden`), `display:flex`, two columns:
- **Left `.text-col`** (`z-index:3`, max-width `min(48%,620px)`): headline → stat block → body paragraph → link.
- **Right `.chart-col`** (`z-index:2`, `flex:1 1 0`): the chart / visual, vertically centered, `svg max-height:72vh`.
- `section` is `position:relative` so the full-section **dust canvas** (`#nf-dust-canvas`, `z-index:1`,
  `pointer-events:none`) sits behind the content.
- **Phone (`max-width:880px`)** stacks to one column; **short landscape** shrinks type. See the media
  queries in `design_tokens.css`.

## 5. Chart conventions (from wf_solution.html)

- Inline SVG, `viewBox="0 142 840 362"`, plot x 90..650 / y 150(100%)..430(0%).
- Blue `#nf-curve` = the hero (good, high); red dashed `#conv-curve` = bad (low), sparingly.
- Lines labelled directly at their right ends with a small terminal dot; the source line is the hyperlink.
- Gridlines minimal (one 100% hairline); no area fill; no big dot markers.
- Specimen size markers = thin muted vertical guide lines with the name on top; close ones tiered.
- Axis title gap = same on x and y (label sits ~62–64 svg-units from the axis line).
- Footnotes muted, flush-left.

## 6. The dust-capture effect (LOCKED signature interaction)

Full-section `<canvas id="nf-dust-canvas">` behind the content. On arrival: the section fills with a soft
grey **dust field** (bokeh depth, gentle drift), then the dust **streams toward the blue curve and dissolves
in a ~28px kill-zone just before the line** (fade-before-contact) — nothing piles up on the line (no
"fly-trap"). Air clears to a whisper of living dust. One faint blue absorption shimmer at the line.

- **Claim-safe:** dust is drawn to the filter and absorbed/held — never burned/exploded/destroyed.
- **Trigger (deck-aware):** `embedded = window.self!==window.top`. If embedded → start on the parent's
  `nf-active` postMessage (stop on `nf-inactive`); if standalone → own IntersectionObserver ≥0.4. No autoplay.
- **Perf:** pre-rendered sprites + `drawImage`, single self-terminating rAF, `dpr` capped ~1.25,
  IntersectionObserver + `visibilitychange` pause, ~800 particles desktop / ~200 mobile. Target 60fps.
- **Reduced motion:** calm static faint field, no motion.

## 7. Deck integration (`wildfire.html`)

Sections load as same-origin iframes. Media/effects must **play on arrival** — listen for `nf-active` /
`nf-inactive` postMessages from the parent (an iframe always sees itself as visible, so never autoplay).
Cache-bust iframe `src` with `?t=`. Verify live behaviour with Playwright real-timer (Chrome
`--virtual-time-budget` does NOT drive requestAnimationFrame).

---

**Ties:** the older design-system memory (`reference_locked_design_system`) and this file agree; this is the
concrete, locked, code-level version. Reference implementation to copy from: `_deploy/wf_solution.html`.
