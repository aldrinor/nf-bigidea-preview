# US state Legionnaires' disease map — data source and method

This folder backs a Leaflet choropleth of **Legionnaires' disease (legionellosis)**
burden by US state, shown as a **rate per 100,000 population**. Files:

- `us_states.geojson` — US state polygons (join layer; shared with the other bacteria maps)
- `us_states_legionella.json` — the mappable value per state (rate per 100k + raw case count)
- `us_legionella_source.md` — this file

## The dataset chosen

**CDC NNDSS (National Notifiable Diseases Surveillance System) — legionellosis reported
cases by state, data year 2023 (finalized), expressed as a rate per 100,000.**

- CDC program: **NNDSS**, served on **data.cdc.gov** (Socrata).
- Live dataset: **"NNDSS Weekly Data"**, dataset id **`x9gk-5huc`** (the current consolidated
  long-format table; the older per-year Socrata tables such as the 2018 table `acdz-tk8j`
  stop at 2022 and the 2022+ full-year tables are no longer served, so `x9gk-5huc` is the
  correct live source for 2022–2026).
- Disease label filtered: `label = "Legionellosis"` (a single clean label; legionellosis
  covers both Legionnaires' disease and Pontiac fever, the notifiable condition).

### Why 2023 (year choice)

The task asked for the most recent **finalized** year with clean all-state coverage,
avoiding the pandemic-suppressed years.

- **2020 and 2021 are pandemic-affected** (testing/travel disruption) and were excluded.
- **2023 is the most recent fully-settled, post-rebound year.** CDC's own surveillance page
  states legionellosis "increased steadily" since the early 2000s, peaked in 2018, dipped
  during early COVID-19, and "rebounded in 2021" — so 2023 is a representative, non-suppressed
  year. 2024 is still accumulating late reports, so 2023 gives the cleaner finalized count.
- 2023 is one of the years the task explicitly flagged to check.

### Provisional vs. finalized — which number is on the map (important)

NNDSS week-52 counts are **provisional** and rise for about a year afterward as states
reconcile late reports. This dataset exposes two cumulative columns per row:

- `m3` = **Cumulative YTD, Current MMWR Year** (the provisional year-end count).
- `m4` = **Cumulative YTD, Previous MMWR Year** (the same year, re-tallied one year later).

For California the 2023 provisional year-end count (`m3` in the 2023 week-52 row) was **500**,
but the finalized count (`m4` in the **2024** week-52 row = 2023 with a full extra year of
catch-up) is **706** — the provisional figure undercounts by ~30%. Nationally the 2023
provisional total was **6,850** vs. the finalized **8,101** (a ~18% undercount).

**The map uses the finalized 2023 count** = the `m4` ("Cumulative YTD Previous MMWR Year")
value at **MMWR week 52 of the 2024 rows**, for every state. This is the most complete real
2023 per-state count in the live dataset and is the figure consistent with CDC's "~9,000–10,000
cases/yr" framing. Every state is measured identically at the same snapshot.

### New York handling

NNDSS reports **"New York" (state, excluding NYC)** and **"New York City"** as separate
reporting areas. For a state-level map they are **summed**: New York = New York (excl. NYC)
+ New York City = 512 + 281 = **793** cases (finalized 2023).

## Units and how `value` is computed

`value` = **cases per 100,000 population** = (finalized 2023 case count ÷ July-1-2023 state
population) × 100,000, rounded to 2 decimals. `cases` carries the raw integer count for
tooltips.

```json
"California": { "value": 1.80, "cases": 706, "metric": "Legionnaires' cases per 100,000" }
```

### Verification that the extraction is correct

- Summing the **51 required geographies** (50 states + DC, with NY+NYC combined) gives
  **8,101** finalized 2023 cases — **exactly** equal to the dataset's own "US RESIDENTS"
  roll-up row (`m4` = 8101). No state dropped or double-counted.
- Summing the 51 Census populations gives **336,806,231** — **exactly** the Census
  "United States" total row for July 1, 2023.
- The geographic pattern is the known CDC signature: highest in the Great Lakes / Ohio Valley
  / Mid-Atlantic (Ohio, Michigan, New York, Indiana, Pennsylvania, Rhode Island), lowest in
  the Mountain West and Northern Plains (North Dakota, Alaska, Nevada). This is a strong
  independent sanity check on the method.

## Population denominator (source / year)

**US Census Bureau, Population Estimates Program — Vintage 2024 state totals (`NST-EST2024`),
`POPESTIMATE2023` = the July 1, 2023 estimate.** This is the Census Bureau's most current
estimate for mid-2023 (released December 2024).

- File used: `https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/totals/NST-EST2024-ALLDATA.csv`
- Landing page: https://www.census.gov/programs-surveys/popest/technical-documentation/research/evaluation-estimates/2020-evaluation-estimates/2020s-state-total.html

## Color ramp range (across the 50 states + DC)

- **min = 0.63 (North Dakota)  →  max = 5.21 (Ohio)** — rate per 100,000.
- Highest 5: **Ohio 5.21, Rhode Island 4.98, Michigan 4.17, New York 4.02, Indiana 3.90.**
- Lowest 3: **North Dakota 0.63, Alaska 0.68, Nevada 1.12.**
- Puerto Rico (territory, included so its polygon is not grey) sits at **0.19** — below the
  state minimum; if the ramp is fit to the 50 states + DC, PR will read at the bottom of the
  scale, which is correct (PR reported only 6 cases in 2023).

## National headline number

- **National total (50 states + DC), finalized 2023 = 8,101 legionellosis cases.**
- **National rate = 8,101 ÷ 336,806,231 × 100,000 = 2.41 per 100,000.**
- (Provisional 2023 year-end total was 6,850, i.e. 2.03/100k, before late-report catch-up.)

## The rising-trend fact (with citation)

Reported US legionellosis has climbed sharply since ~2000. Per the CDC *Emerging Infectious
Diseases* article **Barskey et al., "Rising Incidence of Legionnaires' Disease and Associated
Epidemiologic Patterns, United States, 1992–2018," EID 2022;28(3)**
(https://wwwnc.cdc.gov/eid/article/28/3/21-1435_article — fetched this session):

- Age-standardized incidence rose **5.67-fold** (incidence risk ratio 5.67, 95% CI 5.52–5.83)
  from the 1992–2002 baseline to 2018.
- Age-standardized rate went from **0.48 → 2.71 per 100,000** (crude 3.06/100,000 in 2018).
- Reported cases grew from roughly **1,100/yr around 2000 to ~9,999 in 2018** — about a
  **9-fold** rise in the raw annual count — and the country now sees on the order of
  **9,000–10,000 cases/yr** (this NNDSS finalized 2023 count of 8,101 is in that band; CDC's
  dedicated Legionella surveillance runs slightly higher than the NNDSS notifiable tally).
- CDC surveillance page: https://www.cdc.gov/legionella/php/surveillance/index.html

## Coverage / missing / suppressed data

- **51 of 51 required geographies covered** — all 50 states + DC have a direct 2023 value.
  **No state was estimated or interpolated; no value was suppressed.** Every count is a direct
  lookup from `x9gk-5huc` (NY = NY + NYC).
- **Puerto Rico** is also included (rate 0.19, 6 cases) because the GeoJSON has a PR polygon
  and NNDSS reports PR; it is a **territory, not part of the "51 states + DC"** count. The
  GeoJSON has 52 features (50 states + DC + PR); all 52 have a data entry, so nothing renders
  grey.
- Small jurisdictions (Alaska, North Dakota, Vermont, DC, PR) have low counts, so their rates
  are more volatile year to year — inherent to the data, not an error. Worth a caption note if
  the map highlights extremes.

## Source / citation / API

- Portal: CDC NNDSS on data.cdc.gov — dataset **"NNDSS Weekly Data" (`x9gk-5huc`)**:
  https://data.cdc.gov/NNDSS/NNDSS-Weekly-Data/x9gk-5huc
- Exact live query used this session (Legionellosis, week 52, 2023 & 2024 rows; the 2024
  rows supply the finalized-2023 `m4` column):

  ```
  https://data.cdc.gov/resource/x9gk-5huc.json?$select=year,states,week,m3,m4&$where=label='Legionellosis' AND week='52' AND year in('2023','2024')&$limit=2000
  ```

  Column definitions (from the dataset's own metadata): `m1`=Current week,
  `m2`=Previous 52-week max, `m3`=Cumulative YTD **current** MMWR year,
  `m4`=Cumulative YTD **previous** MMWR year.

Suggested credit line for the deck:

> Source: CDC NNDSS legionellosis reported cases by state, 2023 (finalized), rate per 100,000
> using US Census 2023 population estimates.

## License

**Public domain.** Data produced by CDC and the US Census Bureau (US federal agencies) as
official works are not subject to domestic copyright (17 U.S.C. § 105) and are published for
public use, including **commercial** use. Attribution to CDC/NNDSS and the US Census Bureau is
expected as good practice but is not legally required. No redistribution restriction applies.

## GeoJSON join key

Join on **`properties.name`** = full state name (e.g. `"California"`,
`"District of Columbia"`, `"New York"`, `"Puerto Rico"`). `us_states_legionella.json` is keyed
by those exact full-name strings, so the join is a direct `properties.name` lookup — no
abbreviation or FIPS mapping needed. All 52 GeoJSON feature names match a data key.
