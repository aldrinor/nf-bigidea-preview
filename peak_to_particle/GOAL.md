# Peak to particle — front page

## The goal

One scrolling front page. It starts on the summit of Mount Everest and travels down
to the material at nanoscale. Real elevation, real satellite imagery, real volumetric
cloud. The quality bar is mont-fort.com scored as a 10. Every screen must reach 9 or
better, judged by Codex, before it is called finished.

## Rules that do not bend

- Codex is the visual judge. Its number is the number. Never substitute my own opinion.
- An absolute /10 from Codex is noise. Use a forced A/B, run in BOTH column orders.
- Never present a screen as finished below 9. Always state the real score.
- Update this file's scoreboard and NEXT ACTION every pass, then commit and push.
  **This file IS the handover between sessions.**
- The live site and the five existing decks are not touched.

## Where it lives

- Page: `_deploy/peak_to_particle/everest.html`
- Cloud: `_deploy/peak_to_particle/cloud_volume.js`
- Terrain build scripts: `_deploy/peak_to_particle/terrain/`
- Live: https://aldrinor.github.io/nf-bigidea-preview/peak_to_particle/everest.html

## The six beats (Yin's script, locked)

1. Original hero content — the platform copy.
2. "This is where air and water are still clean."
3. Cloud turns grey, dust starts floating.
4. "Down where we live, they are full of pollutants."
5. Camera holds. Grey fills the screen. "Most harmful pollutants carry an electric charge."
6. "What they carry, we capture." Polarity line fades in, dust is sucked into the lens.

Act windows are in `ACT_WINDOWS`. Each act's fade-OUT range is exactly the next act's
fade-IN range, so the two always sum to 1 and the screen is never wordless.

## Type and chrome

Matched to cpolar.tech from measured computed styles. Anton for display, Montserrat
variable for everything else, both self-hosted and subset to Latin. Bar is fixed and
transparent: logo 34 px at x=72, links 14.4 px weight 650 in black 26 px apart, contact
pill 1 px solid black at 7 px radius.

## Scoreboard

| | Codex | measured |
|---|---|---|
| Load, first seconds | 5/10 | complete, sharp page at 500 ms |
| Hero, finished | 5.5/10 | all 7 text elements pass 4.5:1 at every orbit angle |

**Not 10/10. Do not present it as finished.**

### Read this before trusting another Codex number

Codex's absolute /10 on this hero has sat between 5 and 6 across SIX rounds while
the page changed enormously -- headline added, terrain relit, card added, card
removed, contrast fixed. It also **contradicted itself**: round 3 said "place the
five applications in a deliberate translucent panel", round 4 said the panel
"makes the hero feel like a generic SaaS card, remove it". And a forced A/B in
both column orders picked the FIRST image both times, then the SECOND image both
times -- position bias, i.e. void, twice.

So: use Codex to FIND defects, never to score progress. Fix the defects that
repeat across rounds, and verify them with a measurement.

### What was fixed this round, with numbers

- **Hierarchy.** The one defect Codex named in every single round: no headline,
  the wordmark doing the work of a proposition. Act A is now eyebrow / Anton
  statement / lede / applications index. The approved sentence is unchanged --
  broken typographically, not rewritten. The wordmark left the hero; the bar keeps it.
- **The terrain was over-lit, not under-lit.** Hemisphere 0.85 and fill 0.60 filled
  every shadow so a 3.10 key had nothing to cut against. Now key 3.62, hemisphere
  0.44, fill 0.26, haze 2.9e-5 -> 1.86e-5, exposure 1.05.
- **Camera reframed off the geometry**, not by eye: aim 1 550 m along the
  screen-right axis (0.66, 0, 0.75) and 360 m down, eye 12% closer. The peak
  anchors the right, the copy has a clear corridor.
- **Text contrast is now measured and adaptive.** Worst case around the orbit was
  2.05:1 on the applications index and 2.07:1 on the coordinates -- black type on
  dark rock as the massif swings behind them. A fixed wash cannot solve this: heavy
  enough for the rock was judged "extreme white haze, looks like a low-resolution
  background image". So two feathered fields now read the actual pixels behind the
  type every twelfth frame and raise only when needed.

Worst-case contrast, 10 points around the orbit, black type, 4.5:1 required:

| element | before | after |
|---|---|---|
| eyebrow | -- | 18.82 |
| statement | -- | 11.15 |
| lede | -- | 8.83 |
| apps-label | -- | 7.41 |
| **apps-row** | **2.05** | **4.94** |
| cue | 4.87 | 7.30 |
| **meta** | **2.07** | **4.66** |

Harness: `probe2.mjs` in the session scratchpad. It hides ONLY the text, with
`!important` so the render loop cannot override it, and leaves the fields live.

## Load, measured cold-cache

 on a throttled connection

Time until there is a mountain on screen:

| connection | stand-in | first paint of terrain |
|---|---|---|
| broadband 30 Mbps | 2.2 s | full hero 8.1 s |
| typical 4G 12 Mbps | 2.5 s | full hero arrives behind |
| slow 4G 4 Mbps | 3.6 s | full hero arrives behind |

Critical path is 1,306 kB, down from 9,172 kB. The stand-in hero is
`everest_hero_lo_opt.glb`, 1.41 MB, 242,592 triangles, built by
`python build_everest_hero.py lo`. The full hero swaps in behind it and the stand-in is
disposed. Verified on the live page: both meshes render, swap confirmed, no console errors.

## Already ruled out — do not repeat

- **2D / billboard cloud.** Yin rejected it twice. The cloud is raymarched volume.
- **`samples: 4` on the scene render target.** Silently ignored, because a depth texture
  cannot be multisampled. Measured 5.39% → 5.45% hard edge steps, i.e. no effect. The
  pipeline needs that depth texture, so antialiasing happens in the shader (FXAA) → 4.26%.
- **`OrbitControls.autoRotate`.** Frame-rate dependent; measured 14,796 s per orbit on the
  software renderer. The orbit is clock-driven now. Do not clamp the time step tight
  either — a 0.1 s clamp reintroduces the same bug at 10 fps.
- **Monochrome grade at 0.88.** Yin: "why now everything very grey scale". GRADE is 0.26.
  The grey is now a story beat, not the whole page.
- **Dust colours ported straight from act1.html.** They float over a dim room video there;
  on a near-white sky they read as dirt. Yin: "it look broken". Retuned lighter and fewer.
- **Reasoning about a white blob instead of isolating meshes.** Three separate times the
  cause was a cheap terrain sheet drawing in front. Isolate meshes first, always.
- **Chasing Codex's absolute score.** Six rounds, score never left 5-6, advice
  reversed itself. Find defects with it; measure the fix yourself.
- **Measuring contrast without hiding the type first.** Done twice now. The render
  loop rewrites act opacity every frame, so `element.style.visibility` is overwritten
  and the probe ends up measuring its own black letters -- luminance 0.000, which is
  not a mountain. Inject a stylesheet with `!important`.
- **A choreographed entrance animation.** Tried, measured, reverted. Fading and
  rising the bar, copy and plate over 0.5-0.6 s left the page an almost empty field
  with a ghost mountain at 500 ms and 750 ms, and it did not compose until 1250 ms.
  Without it the page is complete and sharp at 500 ms. Choreography only helps when
  the content is ready before the choreography; here it delayed the one fast thing.
- **A heavy-blur placeholder.** 56 px wide under 26 px of blur read as dirt, not as
  soft focus. Codex: "reads as broken rather than loading". The working version is
  640 px of WebP at 14 kB inline, under 2 px of blur.
- **Trusting a forced A/B without checking for position bias.** Codex picked
  "IMAGE 1" in BOTH column orders on the load sheets, which is a void result, not a
  verdict. Always check that the winner flips with the order.
- **17 m detail tile.** About 8 screen pixels at close range — a visible dot lattice on
  snow. It is 60 m.

## Open, honest

- **Real GPU frame rate has never been measured.** This machine only has the software
  renderer. The lag fixes — cloud re-march gated on view change or every third frame, six
  fewer texture reads per pixel from the triplanar collapse, 242 k triangles instead of
  1.25 M during the opening — are reasoned and byte-measured, not frame-timed on Yin's
  hardware. Say this plainly; do not imply it is fixed.
- Torn horizontal bands where the camera passes under the cloud deck. Reduced, not closed.
  Streaks remain lower right.
- A small hard-edged white polygon in clear sky. Half-resolution cloud buffer limit.

## NEXT ACTION

1. The remaining Codex defects are art direction, not code: one coherent type scale,
   the applications index treatment, and a single system for the corner telemetry.
   Per the standing rule these are design DECISIONS -- route them to GLM 5.2 + GLM 5V,
   do not decide them by taste.
2. Apply the same measured contrast check to scroll beats B, C, D and E. Only the
   hero has been checked so far.
3. Get a real frame-rate number from Yin's machine, or say clearly it is unmeasured.
