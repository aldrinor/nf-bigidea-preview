# GOAL — standing objective. Read this first, every session.

Set by Yin 2026-07-25. Survives context compression and session restarts.
**If you are a fresh session: this file is the brief. Do not ask what to do. Continue.**

## The goal
Build the **whole** front page in `PLAN.md` — all ten stops — and get **every screen to
9/10 or better**, judged visually by **Codex** against mont-fort.com scored as the 10.

## The rules
1. **Do not stop until every screen is >= 9/10.** Keep iterating, session after session.
2. **Codex is the judge.** Its number is the number. Never my own opinion.
3. **Do not stall and do not drift.** Next action is always in "NEXT ACTION" below.
4. **Never call something done below 9.** Always state the real score.
5. On a genuine measured ceiling, say so with evidence, then take the route through it.
6. **Update this file every pass** — scoreboard and NEXT ACTION. It is the handover.

## How to judge a screen (the loop)
```
# 1. render ours
cd C:/EPA/US/website_project/peak_to_particle && DPR=1.5 node shot.mjs scene.html hero
# 2. stack ours under the reference   (reference: scratchpad/montfort/shot_hero.png)
# 3. ask the judge
codex exec -s read-only --skip-git-repo-check -i compare.png -
```
Prompt Codex as an adversarial gate, tell it the previous score, ask for: new score /10,
whether the named gaps closed, remaining gaps worst-first with concrete fixes.

## Scoreboard
| # | Screen | Codex | State |
|---|--------|-------|-------|
| 1 | Mountain — C-POLAR + 5 applications | **9.1** | ✅ PASSED the gate |
| 2 | Down into cloud — charged particles | **9.1** | ✅ PASSED the gate |
| 3 | NanoFlashing pulls them in — cloud clears | — | not built |
| 4 | Clean sky — Air | — | not built |
| 5 | The lake — Water | — | not built |
| 6 | Crop field — Food Packaging | — | not built |
| 7 | Cotton field — Textile | — | not built |
| 8 | Fibre → nanoscale — Medical Devices | — | not built |
| 9 | Earth from space | — | not built |
| 10 | Contact | — | not built |

Screen 1 history: 3.5 → 5.0 → 5.8 → 7.0 → 7.8 → 7.9 → 8.5 → 8.7 → 8.8 → **9.1 PASSED**.

## What was learned (do not redo these)
- **Public tile elevation dies at ~30 m.** Measured: detail per ground-metre FALLS with
  zoom (0.110 → 0.066 → 0.048); zoom 16 absent. Shading cannot fix a smooth silhouette.
- **Canada's 1 m HRDEM lidar does NOT cover the alpine summits** — only valleys and lower
  slopes. Probed: Mt Temple, Victoria, Lake Louise, Edith Cavell all return no data.
  Jasper town and Whistlers are covered. Do not go looking again.
- **Ridged-fractal displacement** (2.1 M tris) got 5.0 → 5.8 and no further. Codex: needs
  an *authored* form, not more displacement.
- **Therefore the hero backdrop is an AUTHORED photoreal peak** (Codex Gen 2 / gpt_image_2,
  quality high, 2k) with our live volumetric cloud pass over it. This jumped 5.8 → 7.0.
- Yin: *"use any mountain, or just use reference mountain, make our life simple"* — the peak
  does not have to be a real named Banff summit.

## Screen 1 — PASSED at 9.1. What finally worked
The score only moved when the BACKDROP changed, not when CSS changed:
- Terrain grown from elevation data plateaued at 5.8. Dead end.
- An authored photoreal peak jumped it to 7.0 immediately.
- Composing the real page (nav, lockup, headline) took it to 7.9 → 8.5.
- The last 0.6 came from a NEW backdrop built to Codex's exact diagnosis: a narrow focal
  peak, a ridge descending to exit LOW on the right, and three separated depth planes
  fading into white — instead of one continuous wall of snow.

Techniques that carried:
- Recolour a logo at the PIXEL level, not with a CSS filter. The filter route failed twice.
- MEASURE against the reference where it is unambiguous. The left rail was set by measuring
  the reference's nav at 13.7% of viewport width; ours landed at 13.8% and the gate passed it.
- Where my own measurement contradicted the judge (apex height), I said so rather than
  silently following — and the judge's re-read found the real problem (continuous massif).


## NEXT ACTION
Screens 1 and 2 both PASSED. Build **stop 3 — NanoFlashing pulls the particles in and the
cloud clears.** This is the signature moment of the whole page: the charged particles from
stop 2 are drawn to the NanoFlashing mark and captured, and the vapour thins to clean air.

Reuse from stop 2 (`stop2.html`): the baked-lobe cloud bodies, the sprite particles, the
occlusion pass. Stop 3 is the same world with the particles now converging on a centre and
the cloud density falling away.

Language rule: this is CAPTURE, not destroy — particles are attracted and held. Approved
copy only.

Then gate it the same way: render → stack under `scratchpad/montfort/shot_s1.png` →
Codex → iterate to >= 9.

## Screen 2 — how it got from 4.6 to 9.1 (banked technique)
Eleven passes. What actually moved the number:
- Per-frame fBm across the viewport = ~1M noise calls, 10 fps. **Bake fields once, then draw.**
- `canvas filter:blur()` per particle = 187 offscreen passes/frame. **Use pre-baked sprites.**
- A domain-warped noise field reads as **satin or water**, not cloud. Build masses from many
  overlapping ROUND lobes instead.
- Baked tiles clip at their border and cut straight lines. **Fade density to zero at the edge.**
- Depth needs THREE explicit lobe scales, not just blur and opacity.
- The lavender cast came from blue staying high while red/green fell. Pull all three down
  together; let blue lead only in deep shadow.
- The last 0.8 came entirely from a **high-frequency curdle in the density transition band** —
  sharp cauliflower detail at the boundary, smooth interior. It has to be strong (~1.5
  amplitude) and the alpha curve steep, or it is suppressed before it reaches the screen.


## Where things are
- Work dir: `C:\EPA\US\website_project\peak_to_particle\`
- Branch: `peak-to-particle` on `aldrinor/nf-bigidea-preview`
- Live: https://aldrinor.github.io/nf-bigidea-preview/peak_to_particle/scene.html
- Reference shot: `<scratchpad>/montfort/shot_hero.png`
- Copy to use: the existing approved site copy. No new claims, ever.
