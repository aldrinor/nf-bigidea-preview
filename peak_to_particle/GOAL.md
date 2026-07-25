# GOAL — standing objective for this build

Set by Yin, 2026-07-25. This overrides any impulse to stop early.

## The goal
Complete the **whole** front page described in `PLAN.md` — all ten stops — and get
**every single screen to 10/10** judged visually by **Codex** against the reference
(mont-fort.com scored as the 10).

## The rules
1. **Do not stop before every screen is 10/10.** Keep iterating.
2. **Codex is the visual judge.** Its score is the score. Not my own opinion.
3. **Do not stall.** If a verdict is needed, go and get it rather than waiting.
4. **Never present work as finished below the bar.** State the real score every time.
5. If a genuine hard blocker appears (a measured ceiling, not a difficulty), say so
   plainly with the evidence, and propose the route through it — then take that route.

## Scoreboard — update every pass
| # | Screen | Codex score | State |
|---|--------|-------------|-------|
| 1 | Mountain peak — C-POLAR + 5 applications | **5/10** | terrain ceiling hit; rebuilding on 1 m LiDAR |
| 2 | Down into cloud — charged particles | — | not built |
| 3 | NanoFlashing pulls them in — cloud clears | — | not built |
| 4 | Clean sky — Air | — | not built |
| 5 | The lake — Water | — | not built |
| 6 | Crop field — Food Packaging | — | not built |
| 7 | Cotton field — Textile | — | not built |
| 8 | Fibre → nanoscale — Medical Devices | — | not built |
| 9 | Earth from space | — | not built |
| 10 | Contact | — | not built |

## Known ceiling and the route through it
Screen 1 stalled at 5/10 because the public tile elevation source stops carrying real
detail at ~30 m. Measured: high-frequency energy per ground-metre FALLS with zoom
(0.110 → 0.066 → 0.048); zoom 16 does not exist. Codex: shading cannot fix silhouette.

**Route:** Canada's HRDEM — airborne LiDAR at **1 m**, open data, no key, Alberta well
covered. 30x finer. Rebuild the Mount Temple mesh from it.
