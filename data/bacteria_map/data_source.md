# AMR world map — data sources and method

This folder holds the data for a Leaflet choropleth of the global antimicrobial
resistance (AMR, "superbug") death burden. Two data files plus this note.

- `world_countries.geojson` — country polygons (join layer)
- `amr_by_country.json` — AMR death rate per country (color values)
- `data_source.md` — this file

## Which approach was used

The **region fallback** was used, not per-country Our World in Data (OWID) values.

Reason: the AMR burden data on OWID is sourced from IHME / the GRAM study, and OWID
serves it as **non-redistributable**. The CSV download for those charts returns
HTTP 403 with the message: *"This chart contains non-redistributable data that we are
not allowed to re-share and it therefore cannot be downloaded as a CSV."* The granular
IHME GBD country estimates also carry a non-commercial license. So the per-country
OWID path is blocked for a commercial deck.

Instead we use the **published GBD super-region attributable death rates** that appear
in the abstract/summary of the primary open-access paper (see citation). Those seven
aggregate figures are published numbers in a Creative Commons paper, which is fine to
reuse commercially with attribution. Each country is assigned its GBD super-region's
all-age attributable rate (deaths per 100,000).

Note: because rates are per super-region, all countries in the same super-region share
one value. This is a regional burden map, not a per-country-resolved map. Say so on the
deck (for example: "regional attributable AMR death rate, GBD 2019").

## The seven super-region rates used (all-age, attributable, per 100,000, 2019)

| GBD super-region | Rate per 100,000 |
|---|---|
| Sub-Saharan Africa | 23.7 |
| South Asia | 21.5 |
| Central Europe, Eastern Europe & Central Asia | 17.6 |
| Latin America & Caribbean | 14.4 |
| High income | 13.0 |
| Southeast Asia, East Asia & Oceania | 11.7 |
| North Africa & Middle East | 11.2 |

All seven values were verified against the open-access paper this session
(uncertainty intervals in the source: SSA 18.2–30.7, South Asia 15.1–29.8,
CEEECA 11.7–25.3, LAC 10.3–20.0, High income 9.1–18.2, SE/E Asia & Oceania 7.8–17.1,
NA & ME 7.5–16.3).

Color scale range in the dataset: **min 11.2 → max 23.7**.

## Citation

Murray CJL, Ikuta KS, Sharara F, et al. "Global burden of bacterial antimicrobial
resistance in 2019: a systematic analysis." *The Lancet* 2022; 399(10325): 629–655.
DOI: 10.1016/S0140-6736(21)02724-0.

Global headline (2019): **1.27 million deaths attributable to** bacterial AMR
(95% UI 0.911–1.71 million) and **4.95 million deaths associated with** it
(95% UI 3.62–6.57 million).

## License

The Lancet paper is **Open Access under CC BY 4.0** (Creative Commons Attribution).
Verified this session from the open-access copy (PMC8841637): *"© 2022 The Author(s).
Published by Elsevier Ltd. This is an Open Access article under the CC BY 4.0 license."*
CC BY 4.0 permits commercial use with attribution. Suggested credit line for the deck:

> Source: Murray et al., The Lancet 2022 (GBD 2019 bacterial AMR), CC BY 4.0.
> Rates shown are GBD super-region all-age attributable AMR deaths per 100,000.

The country outlines are **Natural Earth 1:110m Admin 0 Countries**, which is in the
**public domain** (no attribution required). Fetched from the official Natural Earth
vector repository (nvkelso/natural-earth-vector). Geometry was stripped to the join
fields and coordinates rounded to 4 decimals to shrink the file.

## GeoJSON join keys

The map code should join on these property names:

- Country ISO code: **`properties.ISO_A3`** (ISO 3166-1 alpha-3)
- Country name: **`properties.ADMIN`** (also duplicated as `properties.name`)

`amr_by_country.json` is keyed by the same ISO_A3 string, e.g.:

```json
"USA": { "name": "United States of America", "region": "High income", "rate": 13.0 }
```

Every one of the 177 GeoJSON features has a non-empty `ISO_A3`. Natural Earth stores
`-99` for a few states; those were repaired using `ISO_A3_EH` (fixed Norway → NOR,
France → FRA) before writing, so no repair logic is needed in the map.

## Country / territory assignment notes (things to know before you cite the map)

Coverage: **176 of 177 GeoJSON features have a rate. 1 has no data (Antarctica).**

GBD super-region membership follows the IHME GBD region hierarchy, which has a few
well-known quirks that this dataset preserves:

- **Argentina, Chile, Uruguay** are in the **High income** super-region (13.0), not
  Latin America. (GBD "Southern Latin America" sits under High income.)
- **Turkey and Afghanistan** are in **North Africa & Middle East** (11.2), not Europe
  or South Asia.
- **Sri Lanka, Maldives, Mauritius, Seychelles** are in **Southeast Asia, East Asia &
  Oceania** (11.7).
- **Cyprus, Israel, Greenland** are in **High income** (13.0, GBD Western Europe).
- **Georgia, Armenia, Azerbaijan** are in **Central Europe, Eastern Europe & Central
  Asia** (17.6).

Editorial / non-standard assignments (flagged so you can verify or grey them out):

- **Bulgaria (BGR) → 17.6.** Bulgaria was missing from the region-list PDF we parsed,
  but it is unambiguously GBD Central Europe (same as Romania, Serbia, Macedonia).
  Assigned by that verified membership, not a guess.
- **Western Sahara (ESH) → 11.2.** Not a separate GBD location. Assigned to North
  Africa & Middle East by geographic nesting (de-facto Morocco-controlled). Editorial.
- **Kosovo → 17.6** (ISO code `XKX`), **Northern Cyprus → 13.0** (`XNC`),
  **Somaliland → 23.7** (`XSL`). These three de-facto states have no ISO alpha-3 in
  Natural Earth (both ISO fields were `-99`). We assigned user-range placeholder codes
  (X-prefixed) and the super-region of the country that surrounds/claims them. Editorial.
  If you prefer, drop these codes from `amr_by_country.json` and they will render grey.
- **Antarctica (ATA)** — no population, not a GBD location. Left with no data (grey).

Small island states that are not present as separate polygons in the 1:110m Natural
Earth file (for example Maldives, Mauritius, Malta at this resolution) simply do not
appear on the map; they are not "missing data," there is no polygon to color.

## Unverified / caveats

- The per-country resolution is regional, not national. Every country in a super-region
  shows the same rate. This is a limitation of using published aggregates instead of the
  (non-redistributable) country-level IHME estimates.
- The five editorial assignments above (Bulgaria, Western Sahara, Kosovo, Northern
  Cyprus, Somaliland) are geographic/membership judgments, not direct table lookups from
  the paper. All others are direct GBD super-region lookups.
