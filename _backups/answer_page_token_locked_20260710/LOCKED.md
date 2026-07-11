# Answer-page design token — LOCKED 2026-07-10

Yin approved the fungi answer page and told me to lock its design as the token, and to
make the bacteria answer page follow the same token. This folder holds the frozen copies.

## The two standard pages (there are ONLY these — no `_solution_new`, no `_durability`)
- **fungi.html** deck → its answer screen is **fungi_solution.html** (single mold test).
- **bacteria.html** deck → its answer screen is **bacteria_solution.html** (4-in-1 durability
  montage made 2026-07-10 morning: dust / heat+humidity / aging / water).
- Both decks load each screen as its own file via iframe (fungi_ball, fungi_map … fungi_solution).
  The answer file per deck is required by that architecture — it is NOT a stray. Do not spawn
  variant files; edit these two in place.

## Token (identical in both files)
- **Colors:** --bg #edf0f2 · --ink #1f2327 · --headline-ink #1a1a1a · --muted #8a9095 ·
  --accent #1b7bff (the ONE blue) · --red #e23b3b · --hair rgba(20,24,28,0.08).
- **Type:** --stack sans (-apple-system, system-ui, Inter, Space Grotesk); --mono Space Mono.
- **Layout:** text column left (max 48% / 620px, padding-top 140px); video panel right (58%,
  blue-fade mask to the left at 78–100%). object-fit: cover.
- **Headline:** sans 600, clamp(24–34px), line 1.32, letter -0.022em; `em` = accent blue.
- **Big number:** sans 600, clamp(56–96px), accent blue, tabular-nums; counts up on entry.
- **Caption:** clamp(17–20px), ink, max 26ch. **Body:** 19px / 1.48, #1a1a1a, max 460px.
- **Advocacy link:** 19px accent, blue underline, "See the evidence →".

## On-video overlay (the part I kept getting wrong — these are the rules)
- **Top info block `.anno-top`:** ONE font (sans). Title line in ink 22px/600; each fact line
  the SAME 22px, grey, with only its number bold in ink. NO mono, NO blue, NO mixed sizes.
  Centred over the WHOLE slab and positioned by JS cover-mapping (anchor = whole-slab centre
  0.520). Sits above the slab with a clear gap (top ~7%).
  - Fungi: fixed (Airborne mold spores / 136 million / 40,000× / 1.6 m/s).
  - Bacteria: changes per test (Dust-loaded filter / Heat and humidity / Accelerated aging /
    Water submersion + its dose), fades on change, timed to the montage (4.4 / 8.8 / 13.2s).
- **Material legend `.anno-lbl`:** sans 22px/500. "NanoFlashing Material" blue under the blue
  half; "Conventional Material" ink under the fouled half. Each is centred under its OWN half.
- **Label tracking (critical):** the video is object-fit:cover, so the slab slides as the window
  width changes. Position every label by cover-mapping from a fixed VIDEO-frame fraction:
  `s = max(W/1280, H/720); offX = (W-1280*s)/2; leftPct = (offX + frac*1280*s)/W*100`.
  Anchors = the VISUAL CENTRE OF MASS of each slab half (pixel centroid, NOT the bounding-box
  midpoint — the slab is tilted so they differ ~4%): blue-half **0.433**, fouled-half **0.597**,
  whole-slab **0.524**. Both pages share the SAME locked slab and the SAME anchors. Material
  labels sit at **top 77.5%** (mobile 77%), identical in every stage (no per-stage shift).
  Re-run on load + resize + play. UAT at 1280 / 1440 / 1600 / 1863 — never one width.
- **Video plays ONCE (no `loop`)** and rests on the final frame.
- Bacteria water stage: the slab drops and grows past the panel crop, so the two material
  labels FADE OUT during water; the "Water submersion" caption + the blue/fouled split carry it.

## Falling-particle effect (fungi only — a single growth test)
Grey-green spores fall heavily straight down onto the slab surface and vanish there — blue
capture-flash on the NanoFlashing half, quiet settle on the fouled half. Even 50/50 across the
two halves, ~5× density (up to ~150 at once), stops once biofouling completes (~5s), lands
evenly across the whole top face. NOT applied to the bacteria montage (4 separate tests).

Restore either page: `cp _backups/answer_page_token_locked_20260710/<file> .`
