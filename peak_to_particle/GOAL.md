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
| 1 | Mountain — C-POLAR + 5 applications | **7.0** | authored peak; closing the last 3 gaps |
| 2 | Down into cloud — charged particles | — | not built |
| 3 | NanoFlashing pulls them in — cloud clears | — | not built |
| 4 | Clean sky — Air | — | not built |
| 5 | The lake — Water | — | not built |
| 6 | Crop field — Food Packaging | — | not built |
| 7 | Cotton field — Textile | — | not built |
| 8 | Fibre → nanoscale — Medical Devices | — | not built |
| 9 | Earth from space | — | not built |
| 10 | Contact | — | not built |

Screen 1 history: 3.5 → 5.0 → 5.8 → **7.0**.

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

## Codex's three open gaps on screen 1 (from the 7.0 pass)
1. Peak too small / conventional → crop much closer, one glaciated mass dominating.
2. Weak atmospheric integration → dense foreground cloud wrapping and obscuring the base.
3. Tonality flat and grey → push luminous ice-blue separation, softer dreamlike depth.

## NEXT ACTION
Collect the two re-generated peaks (closer crop + wrapping cloud + ice-blue tonality),
pick the stronger, re-gate. Then put the live volumetric cloud pass over the chosen still,
add the C-POLAR logo and the 5 applications, and re-gate for >= 9.
Then build stop 2 (descent into cloud) and continue down the list.

## Where things are
- Work dir: `C:\EPA\US\website_project\peak_to_particle\`
- Branch: `peak-to-particle` on `aldrinor/nf-bigidea-preview`
- Live: https://aldrinor.github.io/nf-bigidea-preview/peak_to_particle/scene.html
- Reference shot: `<scratchpad>/montfort/shot_hero.png`
- Copy to use: the existing approved site copy. No new claims, ever.
