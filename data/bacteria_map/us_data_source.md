# US state bacteria map — data source and method

This folder's US-state files back a Leaflet choropleth of drug-resistant / hospital
bacterial infection risk by state. Three files:

- `us_states.geojson` — US state polygons (join layer)
- `us_states_infection.json` — the mappable value per state (color values)
- `us_data_source.md` — this file

## The dataset chosen

**CDC National Healthcare Safety Network (NHSN) — hospital-onset MRSA bacteremia,
Standardized Infection Ratio (SIR) by state, data year 2024.**

Served by the CDC **Antimicrobial Resistance & Patient Safety Portal (AR & PSP)**, the
official public front end for the National and State HAI Progress Report. The portal's
own data API was queried live this session (see endpoint below), which returns the same
numbers the portal charts and the printed Progress Report tables show.

- CDC program: **NHSN** (National Healthcare Safety Network), surfaced through the
  **AR & Patient Safety Portal** (arpsp.cdc.gov).
- Measure on the map: **hospital-onset MRSA bacteremia SIR**.
- Data year: **2024** (latest year with complete data for all 50 states + DC).

## What the metric means (one sentence)

The SIR compares the number of hospital-onset MRSA (methicillin-resistant
*Staphylococcus aureus*) bloodstream infections a state's hospitals actually reported in
2024 against the number predicted from the 2015 national baseline and risk adjustment —
so **1.0 = as expected, below 1.0 = fewer infections than expected (better), above 1.0 =
more than expected (worse).**

Why this metric: MRSA bacteremia is simultaneously a **drug-resistant** infection
(methicillin-resistant), a **healthcare-associated** infection (hospital-onset
bloodstream infection), and **bacterial** — the exact intersection the map is about. It
is the cleanest metric in NHSN with complete per-state coverage.

## Units and how `value` is computed

`value` is the **SIR (a unitless ratio)**, computed the correct CDC way as
**sum(Observed infections) / sum(Predicted infections)** across all reporting hospitals
in the state for 2024, rounded to 3 decimals. (The API also exposes an "average SIR"
field; that is a mean of sub-ratios and is NOT the published SIR — it was not used.)

Each entry also carries `observed` and `predicted` raw counts for tooltips/transparency:

```json
"California": { "value": 0.682, "metric": "Hospital-onset MRSA bacteremia SIR",
                "observed": 717, "predicted": 1051.3 }
```

### Verification that the method is correct

Computed national MRSA SIR 2022 = 0.895, 2023 = 0.752 → a **-16.0% change**, which
matches CDC's published statement that hospital-onset MRSA bacteremia decreased **16%**
between 2022 and 2023 in the 2023 National and State HAI Progress Report. This confirms
both the Observed/Predicted method and the year-ID mapping used against the API.

Integrity check: summing the 51 states' 2024 observed MRSA infections gives 7,879 vs the
national total of 7,910 (the 31-infection gap is Puerto Rico + territories, which roll up
into the national number). No hospital-category double-counting.

## Color ramp range (across the 50 states + DC)

- **min = 0.316 (Vermont)**  →  **max = 1.106 (Arkansas)**
- Lowest (best) states: Vermont 0.316, New Hampshire 0.321, Minnesota 0.434
- Highest (worst) states: Arkansas 1.106, Louisiana 1.086, Alaska 1.010

A choropleth breakpoint at **1.0** is meaningful: states above 1.0 had more
hospital-onset MRSA bloodstream infections than the national baseline predicts. In 2024
only 3 states/DC sit at or above 1.0 (Alaska, Louisiana, Arkansas).

## National headline number

National hospital-onset MRSA bacteremia SIR, 2024 = **0.702** (7,910 observed vs 11,262.2
predicted, across 4,712 reporting acute-care hospitals). The country as a whole is ~30%
below the 2015 baseline; the map shows how unevenly that is distributed.

## Coverage / missing data

- **51 of 51 required geographies covered** — all 50 states + District of Columbia have a
  2024 value. **No state was estimated; every value is a direct API lookup.**
- **Puerto Rico** is also included (value 0.318) because the GeoJSON contains a PR polygon
  and NHSN reports PR; without it PR would render grey. PR is a territory, not counted in
  the "51 states + DC".
- Small states (Vermont, New Hampshire, Alaska, DC, PR) have low predicted counts
  (< ~40 predicted infections), so their SIRs are more volatile year to year. This is
  inherent to the data, not an error. Worth a caption note if the map highlights extremes.
- The GeoJSON has 52 features (50 states + DC + PR). All 52 have a data entry, so nothing
  renders grey for no-data.

## Source / citation / API

- Portal: CDC Antimicrobial Resistance & Patient Safety Portal —
  https://arpsp.cdc.gov/ (HAI Progress Report section).
- Progress Report landing:
  https://www.cdc.gov/healthcare-associated-infections/php/data/progress-report.html
- Live API endpoint queried this session (returns JSON records of Observed Infections,
  Predicted Infections, Number of Facilities Reporting, and SIR by Event Year × HAI ×
  geographyID):

  `https://arpsp.cdc.gov/api/HAI?drilldowns=Event Year,HAI,geographyID&sum=Observed Infections,Predicted Infections,Number of Facilities Reporting`

  Filter used: `HAI = MRSA`, `Event Year = 2024` (internal Event-Year id `309`), the 51
  state/DC `geographyID`s (internal ids, e.g. California = 42, United States = 69).

Suggested credit line for the deck:

> Source: CDC NHSN, hospital-onset MRSA bacteremia SIR by state, 2024
> (Antimicrobial Resistance & Patient Safety Portal, arpsp.cdc.gov).

## License

**Public domain.** Data produced by CDC (a U.S. federal agency) as an official work is
not subject to domestic copyright (17 U.S.C. § 105) and CDC publishes it for public use;
attribution to CDC/NHSN is expected as good practice but not legally required. No
redistribution restriction applies (unlike the world/OWID AMR file in this same folder).

The state outlines in `us_states.geojson` come from the public **PublicaMundi/MappingAPI**
`us-states.json` (the same file the fungi map uses), fetched and saved locally this
session so the map does not depend on an external URL at runtime.

## GeoJSON join key

Join on **`properties.name`** = full state name (e.g. `"California"`,
`"District of Columbia"`, `"Puerto Rico"`). `us_states_infection.json` is keyed by the
exact same full-name strings, so the join is a direct `properties.name` lookup — no
abbreviation or FIPS mapping needed. All 52 GeoJSON feature names match a data key.
