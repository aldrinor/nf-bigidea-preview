# Airborne bacterial infections by state — time series (Screen 2 map)

Combined reportable **airborne bacterial infections** by US state, per year, as a rate per 100,000.

- **Diseases (summed):** Legionnaires' (legionellosis), pertussis (whooping cough), tuberculosis, meningococcal disease (all serogroups). All airborne / inhaled, all CDC-notifiable by state.
- **Source:** CDC NNDSS, dataset `x9gk-5huc` (data.cdc.gov). Finalized annual counts = "Cumulative YTD Previous MMWR Year" (m4) at week 52 of the following year; 2024 = provisional current-year (m3). Validated: Legionellosis finalized 2023 = 8,101, matches CDC roll-up.
- **Years:** 2021–2024. National combined totals: 2021 = 18,767 · 2022 = 19,066 · 2023 = 25,271 · 2024 = 51,891 (2024 provisional, whooping-cough–driven surge).
- **Rate:** cases / state population × 100,000. Population = US Census POPESTIMATE2023 (derived per state; small cross-year error, noted).
- **Color ramp:** FIXED 1 → 30 per 100k across all years (so the map reddens as the year advances). 2024 outliers (Alaska 94, Idaho 55, Wisconsin 48) clamp to deepest red.
- **Headline stat:** ~1.5 million US pneumonia hospitalizations/yr (Jain et al., NEJM 2015, EPIC) — national, not mappable per state (HCUP bans commercial use); used as the caption's big number.
- **License:** public domain (CDC NNDSS + US Census, 17 U.S.C. §105), commercial use OK.
- **LIVE / auto-update:** current-year provisional refreshes weekly at `https://data.cdc.gov/resource/x9gk-5huc.json?year=<Y>&week=<latest>&label=<disease>` — a scheduled job can re-pull to keep the latest year current (cron TODO, like the wildfire map).
