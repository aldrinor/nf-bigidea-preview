# US airborne bacterial infections — historical per-state time series (animated choropleth)

This folder backs an **animated year-slider choropleth** of **airborne bacterial infection
burden by US state, 2014–2025**, shown as a **combined rate per 100,000 population**.
It also has a **live-update hook** for the current (in-progress) year.

## Files

- `us_states.geojson` — US state polygons (shared join layer; **not modified**). Join key `properties.name`.
- `us_airborne_timeseries.json` — the time series that drives the slider map (this deliverable).
- `us_timeseries_source.md` — this file.
- (`us_states_legionella.json` / `us_legionella_source.md` — the older single-year legionella-only map; unrelated, left untouched.)

## What is combined

Four **reportable airborne bacterial infections**, counted **by state, per year**, then **summed**:

| key | NNDSS condition label | notes |
|---|---|---|
| `legionellosis` | **Legionellosis** (Legionnaires' disease + Pontiac fever) | airborne via aerosolized water |
| `pertussis` | **Pertussis** (whooping cough) | airborne, respiratory droplet |
| `tuberculosis` | **Tuberculosis** | airborne, respiratory |
| `meningococcal` | **Meningococcal disease, All serogroups** | respiratory droplet; "All serogroups" total only |

`us_airborne_timeseries.json` shape:

```json
{ "years":[2014,…,2025],
  "meta":{ "rate_ramp":{"min":…, "max":…}, "national_combined_by_year":{…}, … },
  "states":{ "California":{ "2014":{"cases":N,"rate":R,"diseases":{"legionellosis":..,"pertussis":..,"tuberculosis":..,"meningococcal":..}}, … }, … } }
```

`cases` and `rate` are the **combined** value (they drive the map); the per-disease breakdown is nested under `diseases`.

## Data source (all public domain)

**CDC National Notifiable Diseases Surveillance System (NNDSS)**, served on **data.cdc.gov (Socrata API)**,
plus **US Census Bureau** population estimates. Both are US-government works — **public domain (17 U.S.C. § 105),
commercial use OK**, attribution expected as good practice.

- NNDSS portal: https://data.cdc.gov  ·  NNDSS/WONDER: https://wonder.cdc.gov/nndss.html

### Method (identical every year → comparable animation)

For each disease × year × reporting area we take the **year-end cumulative case count** = the
**maximum of the "Cumulative YTD, current MMWR year" value across all weeks of that year** (the
cumulative column is monotonic, so its max is the final week-52/53 value). We then map reporting
areas to the 50 states + DC (**New York City is merged into New York**; census-region roll-ups,
territories except PR, and national totals are dropped), and **sum the 4 diseases** to the combined value.

This "**provisional year-end cumulative, measured the same way every year**" is deliberately used so
that **every animation frame is comparable** and a **single fixed color ramp** is valid across all years.
(See the provisional-vs-finalized caveat below.)

### Where each year comes from

- **2022–2025** — the consolidated live table **"NNDSS Weekly Data" `x9gk-5huc`** (2022–present),
  filtered by `label` and `year`, using column **`m3`** (Cumulative YTD current MMWR year).
- **2014–2021** — the **per-year, per-alphabet-range "NNDSS – TABLE …" datasets** (wide format,
  one dataset per MMWR year), using the `{disease}_cum_{year}` column. Dataset ids per year:

| year | legionellosis | pertussis | tuberculosis | meningococcal (all serogroups) |
|---|---|---|---|---|
| 2014 | `23gt-ssfe` | `8rkx-vimh` | `pxa6-asqb` | `y6uv-t34t` |
| 2015 | `ydsy-yh5w` | `d69q-iyrb` | `ei7y-3g6s` | `7pb7-w9us` |
| 2016 | `yqwx-bvu7` | `bfe6-2gyq` | `pkas-xr96` | `93k9-hy54` |
| 2017 | `33kn-dpz2` | `hatw-7gqy` | `9g7x-sfq4` | `hatw-7gqy` |
| 2018 | `acdz-tk8j` | `9qys-crt2` | `u3yt-gdfa` | `9qys-crt2` |
| 2019 | `484g-ihkb` | `cqcc-kwwr` | `5avu-ff58` | `bkwy-pyv3` |
| 2020 | `5hvx-krph` | `247v-f7n9` | `efb8-zbb7` | `4jje-6vv6` |
| 2021 | `wff4-m3q3` | `kebt-3t25` | `rbrz-y4zd` | `hbbg-vj7f` |
| 2022 | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` |
| 2023 | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` |
| 2024 | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` |
| 2025 | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` | `x9gk-5huc` |

Notes on the 2014–2021 tables: the alphabet split shifts year to year (e.g. legionellosis sits in
"Invasive Pneumococcal→Legionellosis" for 2014–16, "Legionellosis→Malaria" for 2017–18,
"…→Legionellosis" (Table 1T) for 2020–21). **Tuberculosis 2014–2019 is reported *quarterly*** in
NNDSS "Table IV/III/II. Tuberculosis" (4 quarters/yr); the year-end cumulative is still used.
Each dataset was checked for completeness (max MMWR week ≥ 50, or all 4 quarters for the quarterly TB
tables); this caught a 21-week 2019 legionellosis snapshot `ehf4-c7tw`, so the full-year 2019 table
`484g-ihkb` (week 53) is used instead.

### Exact API call pattern

Wide per-year table (example — legionellosis 2018 from `acdz-tk8j`):
```
https://data.cdc.gov/resource/acdz-tk8j.json?$select=reporting_area,legionellosis_cum_2018&$limit=50000
```
Consolidated table (example — legionellosis 2023 from `x9gk-5huc`):
```
https://data.cdc.gov/resource/x9gk-5huc.json?$select=states,m3&$where=year='2023' AND label='Legionellosis'&$limit=50000
```
Column meaning in `x9gk-5huc` (from dataset metadata): `m1`=current week, `m2`=previous-52-week max,
**`m3`=Cumulative YTD current MMWR year**, `m4`=Cumulative YTD previous MMWR year.
(States are UPPERCASE for 2022–2024 rows, Title-case for 2025–2026 rows; both are handled.)

## Population denominator (rate per 100,000)

`rate = combined_cases / state_population(year) × 100,000`.

- **2012–2019:** US Census **Vintage 2020** state totals, `POPESTIMATE{year}`
  — `https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/state/totals/nst-est2020.csv`
- **2020–2025:** US Census **Vintage 2025** state totals, `POPESTIMATE{year}`
  — `https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv`

Each year's cases are divided by that same year's July-1 population estimate. (The two vintages meet at
2019→2020; the small vintage step there is expected and does not affect within-year rates.)

## Fixed color ramp (use these bounds for a comparable animation)

- Combined **rate per 100,000, whole series 2014–2025, across all 52 rendered polygons:**
  **min = 0.62 → max = 94.09**.
- Across the **50 states + DC only** (excluding Puerto Rico): **min = 0.62 → max = 94.09**.
- The max (94.09) is a **small-state outlier — Alaska 2024** (a big pertussis outbreak on top of
  Alaska's chronically high TB). It stretches the scale, so for a readable animation **cap the top of the ramp
  near a percentile and clamp anything higher to the top color**. Percentiles across the 50 states + DC:
  **p90 = 17.77, p95 = 23.72, p98 = 32.08**. A practical fixed ramp is
  **~0.6 → ~24 per 100,000** (clamp above), or the true 0.62 → 94.09 if no clamping.
- A **fixed** ramp (same domain every frame) is what makes the year-to-year colors comparable.

## National combined total per year (the trend)

Sum of the combined count over the 50 states + DC:

| year | combined cases (50 states + DC) |
|---|---|
| 2014 | 42,086 |
| 2015 | 32,362 |
| 2016 | 29,250 |
| 2017 | 30,515 |
| 2018 | 30,258 |
| 2019 | 28,659 |
| 2020 | 16,324 |
| 2021 | 15,139 |
| 2022 | 14,390 |
| 2023 | 20,867 |
| 2024 | 51,901 |
| 2025 | 47,606 |

- **First year 2014: 42,086 combined cases.**
- **Latest full year 2025: 47,606 combined cases.**
- Direction: **UP** over the series
  (driven mainly by the pertussis cycle — see caveats).

## Highest-rate states, latest full year (2025)

1. **Oregon — 40.88/100k** (1,747 combined cases)
2. **Idaho — 34.14/100k** (693 combined cases)
3. **Montana — 32.24/100k** (369 combined cases)
4. **Washington — 31.40/100k** (2,512 combined cases)
5. **Alaska — 29.57/100k** (218 combined cases)

## Coverage (filled vs missing)

- **52 geographies × 12 years = 624 combined state-year cells — 100% filled.**
  Every state + DC (and Puerto Rico) has a combined value for every year 2014–2025.
- **No value is interpolated, modeled, or fabricated.** Each is a direct NNDSS lookup.
- Per-disease "absent" cells (a state-year where that one disease had **no reported cases / a "-" dash**,
  counted as **0** in the sum): legionellosis 6, pertussis 22,
  tuberculosis 12, meningococcal 108 (out of 624 cells each).
  These are genuine zeros for small jurisdictions (all four diseases are notifiable in every state every year),
  not missing data. The combined cell is always filled.

## LIVE-UPDATE endpoint (current-year provisional, for a scheduled job)

The current (in-progress) year's provisional weekly cumulative by state, for all four diseases, comes
from the same consolidated table **`x9gk-5huc`**. A scheduled job should pull the **latest MMWR week's
`m3`** per state per label:

```
https://data.cdc.gov/resource/x9gk-5huc.json?$select=states,year,week,label,m3&$where=year='2026' AND label in('Legionellosis','Pertussis','Tuberculosis','Meningococcal disease, All serogroups')&$order=week DESC&$limit=5000
```

- Replace `'2026'` with the current MMWR year (or drop the year filter and take `max(year)`).
- For each `states`+`label`, the **maximum `m3`** = current year-to-date count; sum the 4 labels → live combined.
- This table is refreshed by CDC **weekly** (typically Thursday), so a weekly cron is sufficient.
- The current-year value is **partial and provisional** — show it as "{year} YTD (provisional)", not a full-year frame.
- Dataset landing page / API docs: https://data.cdc.gov/NNDSS/NNDSS-Weekly-Data/x9gk-5huc

## Caveats (flag these on the map / in captions)

1. **Provisional, not fully finalized.** NNDSS year-end cumulative counts are provisional and settle
   upward by roughly **~15–18%** over the following year as states reconcile late reports. Because
   **every year here is measured the same provisional way**, the **trend and the fixed ramp are valid**,
   but absolute counts run below CDC's later-finalized annual summaries. (Example: the sibling
   single-year legionella map uses the *finalized* 2023 figure 8,101; this comparable series shows the
   *provisional* 2023 legionellosis year-end 6,850. Both are correct for their stated method.)
   Finalized numbers, if needed, are available from the previous-year columns (`m4` / `{disease}_cum_{Y}`
   in the following year's table) for years ≤ 2024 — but the latest year can only ever be provisional.
2. **COVID dip 2020–2022.** Pertussis and legionellosis fell sharply (distancing, reduced testing/travel).
   This is a real epidemiological signal, not a data gap: the combined national count dropped from
   28,659 (2019) to a trough of 14,390 (2022) before rebounding.
3. **Pertussis dominates the swings.** Pertussis is cyclic and is by far the largest and most volatile
   component (national ~28.6k in 2014, down to ~1.7k in 2021, back up to ~35.5k in 2024). The combined
   trend largely tracks pertussis; captions should say so.
4. **Tuberculosis 2019 is unusually low** (5avu-ff58: ~5.4k vs ~8k neighbours). NNDSS
   TB notification lagged during the 2019 reporting transition; NNDSS TB generally under-counts the
   finalized DTBE tally. Treated as-is (no adjustment) for source consistency.
5. **New York** = New York (excl. NYC) **+ New York City** summed (NNDSS reports them separately).
6. **Meningococcal comparability.** The "All serogroups" total is used every year; the column's full
   name changes over time ("…invasive, all serogroups" pre-2015 → "…all serogroups" later), but it is
   always the all-serogroups aggregate. Counts are small (~200–500/yr nationally).
7. **Puerto Rico** is included (GeoJSON has its polygon; NNDSS + Census cover it) but is a **territory**,
   not one of the "50 states + DC". Its rate for these diseases is low.

## License

**Public domain.** CDC NNDSS and US Census Bureau outputs are US-federal works, not subject to domestic
copyright (17 U.S.C. § 105); free for public and **commercial** use. Attribution to CDC/NNDSS and the US
Census Bureau is good practice, not a legal requirement.

## GeoJSON join key

Join on **`properties.name`** (full state name: `"California"`, `"District of Columbia"`, `"New York"`,
`"Puerto Rico"`). `us_airborne_timeseries.json` `states` keys are those exact strings — direct lookup,
no FIPS/abbreviation mapping. All 52 GeoJSON features have a data entry (nothing renders grey).
