# Self-hosted web fonts — source note

**Added:** 24 August 2026
**Why:** these three families were being loaded from `fonts.googleapis.com` on 30 served
pages. A remote Google Fonts call sends every visitor's IP address to Google. Self-hosting
removes that third-party call completely. It also removes the only privacy question the
site had, since C-POLAR runs no analytics and no tracking of any kind.

The German precedent that makes this worth doing rather than merely disclosing:
*LG München I, 20 January 2022, 3 O 17493/20* — the court enjoined a site operator for
disclosing a visitor's dynamic IP to Google via remote fonts, and rejected a legitimate
interests defence specifically because the operator could have self-hosted instead.

**Source:** the official Google Fonts CSS API (`fonts.googleapis.com/css2`), requested with a
current Chrome user agent so it returns `woff2`. The font binaries are the official builds
served from `fonts.gstatic.com`. Nothing was re-built, subsetted by hand, or converted.

**Families and weights**

| Family | Weights / styles | Used by |
|---|---|---|
| Space Mono | 400, 700 | all 30 pollutant pages |
| Space Grotesk | 400, 500, 600, 700 | the 5 deck index pages and the two maps |
| Instrument Serif | 400 normal, 400 italic | the same 5 + 2 |

**Subsets kept:** `latin` and `latin-ext`. The Vietnamese, Greek and Cyrillic subsets were
dropped — no page on this site sets text in those scripts.

**Licence:** all three are under the SIL Open Font License 1.1. The full licence for each is
stored beside the fonts as `OFL-spacemono.txt`, `OFL-spacegrotesk.txt` and
`OFL-instrumentserif.txt`, taken from the `google/fonts` repository.

**How it is wired:** `fonts.css` in this folder declares every `@font-face` with a local
`/assets/fonts/vendor/...` path. Pages link that one file instead of the Google URL. The
family names are unchanged, so no page's `font-family` rules needed editing.
