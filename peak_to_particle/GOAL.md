# Peak to particle — the C-POLAR front page

**STATUS: Yin signed it off on 2026-08-20 — "Now this is perfect."**
Packed and pushed to the private team repo. See "Where it lives" below.
This objective is complete unless Yin reopens it.

---

## The goal (met)

One scrolling front page. It opens on a real Mount Everest — measured elevation and
satellite imagery, rendered live in 3D — and travels down through grey polluted air to
the five pollutants and the mechanism that captures them.

## Where it lives

- **Working copy:** `_deploy/peak_to_particle/` on the `main` branch of
  `github.com/aldrinor/nf-bigidea-preview`
- **Live preview:** https://aldrinor.github.io/nf-bigidea-preview/peak_to_particle/everest.html
- **Handover package:** `peak_to_particle/` on the **`peak-to-particle`** branch of
  the private `github.com/aldrinor/nanoflashing-website`, commit `849adbc`.
  14.6 MB, only what the page loads plus the terrain build scripts. Verified to run
  standalone with zero failed requests. **`HANDOVER.md` there is the entry point.**

## The scroll, beat by beat

| scroll | what happens |
|---|---|
| 0.00 | The hero. Camera still. C-POLAR statement, paragraph, five applications. |
| 0.20–0.55 | The camera falls. It never cuts. Ends at 4,980 m, near the valley floor. |
| 0.30–0.58 | The air greys, by draining colour from the light, not by a curtain. |
| 0.36–0.45 | Dust starts drifting, arriving BEFORE the pollutants line. |
| 0.41 | "Down where we live, they are full of pollutants." |
| 0.55 | The camera holds. Everything after is weather and words. |
| 0.565 | "Most harmful pollutants carry an electric charge." |
| 0.66–0.755 | The lens and the five pollutants arrive. |
| 0.80–0.84 | The charge line leaves. |
| 0.84–0.878 | "What they carry, we capture." and the mechanism sentence arrive. |
| 0.80–1.00 | The dust is drawn into the words "Positive polarity". |
| 0.90–1.00 | The grey lifts. Blue sky, clean. |

Page is 1040vh so the clean-up has room to breathe.

## Final measured state

**Load, cold cache:** a complete readable page at 500 ms — sky, logo, nav, headline,
the five applications — from a blurred mountain plate embedded in the HTML. The 1.41 MB
stand-in mountain follows, then the 7.58 MB sharp one cross-fades in behind it.
Critical path 1,306 kB, down from 9,172 kB.

**Contrast, black type, 4.5:1 required.** Hero: statement 12.26, paragraph 16.92,
label 17.77, applications 7.47, scroll cue 11.77. Final screen: statement 12.59,
mechanism 4.70, pollutant cells 12.36–12.90. All pass.

**Alignment.** Lens centred in the right section: 1042 / 1222 / 987 against
right-section centres of 1042 / 1222 / 987 at 1440, 1680, 1366. Its name cell sits on
the pollutant row's exact line at all three. Disc hangs a fixed 46 px clear of it.

**Dust:** 3,500 motes on desktop, entirely behind the lens — 0.25% specks inside the
disc against 39.44% just outside, measured in a single frame.

**Frame rate:** relative only. This machine has no GPU. Rotation off was ~24% faster
than on; skipping the cloud where it is invisible was 0.89 → 9.89 fps. Never quoted as
Yin's numbers.

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

1. Run the contrast check on scroll beats B, C, D and E. Only the hero is verified.
   The camera MOVES during the descent, so those beats still have the moving-backdrop
   problem the hero no longer has. Use `still.mjs` with a scroll position set.
2. The remaining Codex defects are art direction: one type scale, the index
   treatment. These are design DECISIONS -- route them to GLM 5.2 + GLM 5V. And
   check anything Codex proposes against Yin's taste first; it asked for the
   right-lean he rejected.
3. Get a real frame-rate number from Yin's machine, or say clearly it is unmeasured.
