// Verified pollutant detail data (editorial register). Every URL fetched & confirmed this session.
// figure types: isotype (X of 100) | trajectory (one rising line, observed solid + projected dashed) |
// curve (single distance-decay) | magnitude (one big typographic figure). All static, grey + one red mark.
window.DETAIL_DATA_V2 = {
  Virus: {
    eyebrow: "LIVING · CAPTURED & DESTROYED · BY PHYSICAL ACTION",
    title: "Virus", sub: "Airborne viral nanoparticle",
    stats: [
      { fig: "20–300 nm", qual: "self-assembling protein + genetic material" },
      { fig: "~1 billion", qual: "seasonal flu cases a year", red: true },
      { fig: "290k–650k", qual: "flu respiratory deaths a year" },
      { fig: "~100k", qual: "RSV deaths a year, children under 5" }
    ],
    sections: [
      { label: "What it is", body: "A virus is a self-assembling biological nanoparticle — 20 to 300 nanometres of protein wrapped around genetic material. It can't copy itself; it has to hijack a living cell.[1]" },
      { label: "Its charge", body: "At the pH of the air and the airway, most viruses run net negative — their isoelectric point sits below neutral, so the surface carries negative charge.[1] A living target: captured and destroyed on contact, by physical action." },
      { label: "How widespread", body: "Airborne and relentless. Seasonal influenza alone runs to about a billion cases a year.[2]" },
      { label: "Health impact", body: "Influenza causes 290,000 to 650,000 respiratory deaths a year;[2] RSV kills roughly 100,000 children under five.[3] Both move through the air." }
    ],
    figure: { type: "magnitude", value: "290k–650k", caption: "estimated influenza respiratory deaths a year, worldwide", sourceText: "WHO, Influenza (seasonal), 2025", sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)" },
    references: [
      { n: 1, cite: "Michen & Graule, “Isoelectric points of viruses,” J. Applied Microbiology, 2010", url: "https://pubmed.ncbi.nlm.nih.gov/20102425/" },
      { n: 2, cite: "WHO, Influenza (seasonal) fact sheet, 2025", url: "https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)" },
      { n: 3, cite: "WHO, Respiratory syncytial virus (RSV) fact sheet, 2025", url: "https://www.who.int/news-room/fact-sheets/detail/respiratory-syncytial-virus-(rsv)" }
    ]
  },
  Bacteria: {
    eyebrow: "LIVING · CAPTURED & DESTROYED · BY PHYSICAL ACTION",
    title: "Bacteria", sub: "Airborne single-celled microbe",
    stats: [
      { fig: "0.25–20 µm", qual: "ride on droplets and dust" },
      { fig: "7 in 100", qual: "hospital patients pick up an infection" },
      { fig: "1.14M", qual: "drug-resistant deaths in 2021", red: true },
      { fig: "39.1M", qual: "AMR deaths projected 2025–2050" }
    ],
    sections: [
      { label: "What it is", body: "Bacteria are single-celled microbes. Airborne, they ride on droplets and dust — from a quarter of a micron up to about 20 microns across.[1]" },
      { label: "Its charge", body: "A bacterium's outer surface runs net negative — its lipopolysaccharide and teichoic acids carry ionized phosphate and carboxyl groups.[2] A living target: captured and destroyed on contact, by physical action." },
      { label: "How widespread", body: "In hospitals alone, about 7 of every 100 patients in wealthy countries pick up an infection during their stay.[3]" },
      { label: "Health impact", body: "Drug-resistant bacteria were directly behind roughly 1.14 million deaths in 2021 and a factor in 4.7 million — with more than 39 million projected between 2025 and 2050.[4]" }
    ],
    figure: { type: "trajectory", points: [{ year: "2021", val: 1.14, label: "1.14M observed" }, { year: "2050", val: 1.91, label: "1.91M projected", projected: true }], value: "1.91M", valueLabel: "projected by 2050", caption: "Deaths a year directly attributable to bacterial AMR — 1.14M (2021) rising to a projected 1.91M (2050)", sourceText: "Global Burden of Bacterial AMR, The Lancet, 2024", sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11718157/" },
    references: [
      { n: 1, cite: "Ghosh et al., Environment International, 2015", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7132379/" },
      { n: 2, cite: "Wilson et al., J. Microbiological Methods, 2001", url: "https://pubmed.ncbi.nlm.nih.gov/11118650/" },
      { n: 3, cite: "WHO, Global report on infection prevention and control, 2024", url: "https://www.who.int/publications/i/item/9789240103986" },
      { n: 4, cite: "Global Burden of Bacterial AMR 1990–2021, The Lancet, 2024", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11718157/" }
    ]
  },
  Fungal_Spore: {
    eyebrow: "LIVING · CAPTURED & DESTROYED · BY PHYSICAL ACTION",
    title: "Fungal Spore", sub: "Airborne mold spore",
    stats: [
      { fig: "3–8 µm", qual: "microscopic reproductive grains" },
      { fig: "−40 mV", qual: "melanin surface charge (net negative)" },
      { fig: "10–50%", qual: "of buildings carry damp & mold", red: true },
      { fig: "2.5M", qual: "fungal-disease deaths a year" }
    ],
    sections: [
      { label: "What it is", body: "Fungal spores are how mold spreads — microscopic reproductive grains, mostly 3 to 8 microns, drifting constantly through indoor and outdoor air.[1][2]" },
      { label: "Its charge", body: "A spore's wall runs net negative — its melanin coat holds a strong negative surface charge, around −40 millivolts on common mold.[3] A living target: captured and destroyed on contact, by physical action." },
      { label: "How widespread", body: "Mold grows anywhere damp. Roughly 10 to 50% of buildings carry it, and spores ride the air in every room.[4]" },
      { label: "Health impact", body: "It triggers allergies and asthma attacks — and serious fungal infections now kill about 2.5 million people a year.[5]" }
    ],
    figure: { type: "trajectory", points: [{ year: "1998", val: 2271, label: "2,271" }, { year: "2023", val: 21037, label: "21,037" }], value: "~9×", valueLabel: "more cases since 1998", caption: "Reported U.S. Valley Fever cases (an airborne fungal-spore disease) — 2,271 (1998) to 21,037 (2023); true burden is 10–18× higher", sourceText: "CDC, Valley Fever statistics, 2024", sourceUrl: "https://www.cdc.gov/valley-fever/php/statistics/index.html" },
    references: [
      { n: 1, cite: "US EPA, Mold and health", url: "https://www.epa.gov/mold/mold-and-health" },
      { n: 2, cite: "Fungal spore size review, PMC9025873, 2022", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9025873/" },
      { n: 3, cite: "Pihet et al., BMC Microbiology, 2009", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2740851/" },
      { n: 4, cite: "WHO Guidelines for Indoor Air Quality: Dampness and Mould, 2009", url: "https://www.ncbi.nlm.nih.gov/books/NBK143943/" },
      { n: 5, cite: "Denning, Lancet Infectious Diseases, 2024", url: "https://pubmed.ncbi.nlm.nih.gov/38224705/" }
    ]
  },
  Wildfire_Smoke_Particle: {
    eyebrow: "INERT · CAPTURED & HELD · NOTHING RELEASED",
    title: "Wildfire Smoke", sub: "Ultrafine biomass soot",
    stats: [
      { fig: "<100 nm", qual: "ultrafine soot, by number" },
      { fig: "95–100%", qual: "of the U.S. exposed each year", red: true },
      { fig: "~40,000", qual: "U.S. deaths a year, now" },
      { fig: "~70,000", qual: "projected a year by 2050" }
    ],
    sections: [
      { label: "What it is", body: "Wildfire Smoke is mostly ultrafine soot: particles under 100 nanometres. By number they make up the bulk of the smoke — far smaller than what ordinary filters are built to catch.[1]" },
      { label: "Its charge", body: "Combustion leaves this soot electrically charged: a known property of flame-born particles, and strong enough that wood-smoke collectors pull it onto a surface by that charge.[2] It's an inert particle — captured and held, nothing released back." },
      { label: "How widespread", body: "Exposure is effectively universal. In recent years, between 95% and nearly 100% of the continental U.S. population was exposed to Wildfire Smoke each year.[3]" },
      { label: "Health impact", body: "Now tied to about 40,000 U.S. deaths a year — and on a high-warming path, about 70,000 a year by 2050.[4]" }
    ],
    figure: { type: "isotype", filled: 97, total: 100, value: "~100%", caption: "of the continental U.S. population was exposed to Wildfire Smoke in a recent year", sourceText: "Zhang et al., Environ. Sci. Technol.", sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10543292/" },
    references: [
      { n: 1, cite: "Ultrafine particles from residential biomass combustion, review, PMC6834185", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6834185/" },
      { n: 2, cite: "Suhonen et al., naturally-charged soot collection, J. Cleaner Production, 2021", url: "https://researchportal.tuni.fi/en/publications/novel-fine-particle-reduction-method-for-wood-stoves-based-on-hig/" },
      { n: 3, cite: "Zhang et al., wildfire & U.S. PM2.5 exposure, Environ. Sci. Technol. (PMC10543292)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10543292/" },
      { n: 4, cite: "Qiu et al., Wildfire Smoke mortality under climate change, Nature, 2025", url: "https://pubmed.ncbi.nlm.nih.gov/40967551/" }
    ]
  },
  Ultrafine_Particle: {
    eyebrow: "INERT · CAPTURED & HELD · NOTHING RELEASED",
    title: "Ultrafine Particle", sub: "Traffic-born nanoparticle",
    stats: [
      { fig: "<100 nm", qual: "smaller than most smoke" },
      { fig: "2–3×", qual: "higher next to busy roads", red: true },
      { fig: "bloodstream", qual: "crosses from lung into blood & brain" },
      { fig: "21M", qual: "people in the 2025 dementia study" }
    ],
    sections: [
      { label: "What it is", body: "Ultrafine particles are under 100 nanometres — smaller even than most smoke. They add almost nothing to the weight of air pollution but dominate it by sheer number, and in cities they come mostly from traffic.[1]" },
      { label: "Its charge", body: "These combustion particles carry an electric charge — but a mix of both signs, positive and negative, not reliably one or the other.[1] An inert particle: captured and held, nothing released back." },
      { label: "How widespread", body: "Concentrated wherever there's traffic. Next to busy roads, particle counts run two to three times the city background — where a large share of people live.[2]" },
      { label: "Health impact", body: "They slip from the lungs into the bloodstream and up the nerves to the brain, raising blood pressure and — in a 2025 study of 21 million people — the risk of dementia.[3]" }
    ],
    figure: { type: "curve", value: "2–3×", caption: "Ultrafine counts are highest at the roadside and fall back toward background within a few hundred metres", sourceText: "EPA / Zhu et al., near-road ultrafine particles", sourceUrl: "https://cfpub.epa.gov/ncer_abstracts/index.cfm/fuseaction/display.abstractDetail/abstract_id/6984/report/F" },
    references: [
      { n: 1, cite: "Schraufnagel, The health effects of ultrafine particles, Exp. & Mol. Medicine, 2020", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7156741/" },
      { n: 2, cite: "Near-traffic ultrafine exposure, Atmos. Chem. & Phys., 2025", url: "https://acp.copernicus.org/articles/25/4907/2025/" },
      { n: 3, cite: "Incident dementia & ultrafine particles, Environ. Sci. & Technol., 2025", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11948469/" }
    ]
  },
  PFAS: {
    eyebrow: "INERT · CAPTURED & HELD · WATER-SIDE R&D",
    title: "PFAS", sub: "Fluorinated “forever chemical”",
    stats: [
      { fig: "since 1940s", qual: "in industry & consumer products" },
      { fig: "95%", qual: "of Americans carry it in their blood", red: true },
      { fig: "4 ppt", qual: "EPA's first national drinking-water limit" },
      { fig: "~100M", qual: "people that limit will protect" }
    ],
    sections: [
      { label: "What it is", body: "PFAS are manufactured chemicals, in use since the 1940s, built to shrug off water, grease and heat. The same toughness means they barely break down — which is why they're called forever chemicals.[1]" },
      { label: "Its charge", body: "In water at normal pH, the common PFAS carry a net negative charge — the head group ionizes and stays charged down to about pH 3.8.[2] That negative sign is exactly what a positive surface is built to attract; the water-side work is in active research and development." },
      { label: "How widespread", body: "Effectively everywhere. PFAS show up in the blood of more than 95% of Americans,[3] and the EPA's first national limit — 4 parts per trillion — is set to protect about 100 million people's drinking water.[4]" },
      { label: "Health impact", body: "Linked to kidney and testicular cancer, a weaker response to vaccines, and raised cholesterol.[5][6]" }
    ],
    figure: { type: "isotype", filled: 95, total: 100, value: "95%", caption: "of the U.S. population has PFAS in their blood", sourceText: "NHANES 1999–2020, Environmental Research 2025", sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12082571/" },
    references: [
      { n: 1, cite: "US EPA, Human health & environmental risks of PFAS, 2024", url: "https://www.epa.gov/pfas/our-current-understanding-human-health-and-environmental-risks-pfas" },
      { n: 2, cite: "Surface pKa of PFOA, J. Phys. Chem. C, 2024", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10860129/" },
      { n: 3, cite: "PFAS exposure in the U.S. population: NHANES 1999–2020, Environmental Research, 2025", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12082571/" },
      { n: 4, cite: "US EPA, PFAS National Primary Drinking Water Regulation, 2024", url: "https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas" },
      { n: 5, cite: "US EPA (see 1)", url: "https://www.epa.gov/pfas/our-current-understanding-human-health-and-environmental-risks-pfas" },
      { n: 6, cite: "ATSDR, How PFAS Impacts Your Health, 2024", url: "https://www.atsdr.cdc.gov/pfas/health-effects/index.html" }
    ]
  },
  Pollen: {
    eyebrow: "INERT · CAPTURED & HELD · NOTHING RELEASED",
    title: "Pollen", sub: "Wind-borne plant grain",
    stats: [
      { fig: "10–100 µm", qual: "grains; fragments far smaller" },
      { fig: "1 in 4", qual: "U.S. adults has a seasonal allergy", red: true },
      { fig: "+3 weeks", qual: "longer pollen seasons with warming" },
      { fig: "+200%", qual: "allergic reactions in Europe by 2050" }
    ],
    sections: [
      { label: "What it is", body: "Pollen is the fine grain plants release to reproduce — 10 to 100 microns across. In humid air the grains burst into far smaller fragments, a quarter to a few microns, that reach deeper into the lungs.[1]" },
      { label: "Its charge", body: "Pollen carries an electric charge — in nature usually negative, which is why it leaps to a bee's positive body.[2] Airborne, the charge is more of a mix. An inert particle: captured and held, nothing released back." },
      { label: "How widespread", body: "A quarter of U.S. adults — 25% — had a seasonal allergy in 2024, and warming is stretching pollen seasons up to three weeks longer.[3]" },
      { label: "Health impact", body: "Pollen drives hay fever and sets off asthma attacks and hospital visits. In Europe, allergic reactions are projected to climb up to 200% by 2050.[4]" }
    ],
    figure: { type: "isotype", filled: 25, total: 100, value: "1 in 4", caption: "U.S. adults had a seasonal allergy in 2024", sourceText: "CDC/NCHS Data Brief 545, 2024", sourceUrl: "https://www.cdc.gov/nchs/products/databriefs/db545.htm" },
    references: [
      { n: 1, cite: "Sub-pollen particles, Atmospheric Environment: X, 2022 (PMC9521721)", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9521721/" },
      { n: 2, cite: "Electrostatic pollination, J. Royal Society Interface, 2024", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11267234/" },
      { n: 3, cite: "CDC/NCHS Data Brief No. 545, Diagnosed allergic conditions, 2024", url: "https://www.cdc.gov/nchs/products/databriefs/db545.htm" },
      { n: 4, cite: "Climate change & pollen allergy in Europe, eClinicalMedicine (Lancet), 2025", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12434989/" }
    ]
  }
};
window.DETAIL_ORDER_V2 = ["Wildfire_Smoke_Particle","Fungal_Spore","Virus","Bacteria","Ultrafine_Particle","PFAS","Pollen"];
