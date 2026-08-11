/* Particle size and health damage — the data behind the chart.
 *
 * NOTHING HERE IS NEW. Every size and every health finding was already
 * published on a NanoFlashing deck and is carried over unchanged, with the
 * deck it came from named. If a number is wrong here it is wrong there too.
 *
 * `nm` is the real diameter in nanometres. The chart draws the circles at TRUE
 * relative scale from these numbers - no log, no fudging. That is the point of
 * the chart, so the numbers have to be right.
 */

window.CHART_DATA = {

  hair: {name: 'A human hair', size: '70 µm', nm: 70000},

  /* Familiar objects, so a reader has something to hold on to. This is the
     move that makes the Visual Capitalist chart legible: you cannot picture
     100 nm, but you can picture a grain of salt. Sizes from Visual Capitalist,
     "Visualizing the Relative Size of Particles" - a secondary source, cited
     as such, and kept separate from our own measured figures above. */
  familiar: [
    {name: 'Fine beach sand',  size: '90 µm',  nm: 90000},
    {name: 'A human hair',     size: '70 µm',  nm: 70000, ours: true},
    {name: 'A grain of salt',  size: '60 µm',  nm: 60000},
    {name: 'A white blood cell', size: '25 µm', nm: 25000},
    {name: 'A pollen grain',   size: '15 µm',  nm: 15000},
    {name: 'A red blood cell', size: '7.5 µm', nm: 7500}
  ],


  items: [
    {
      key: 'wildfire', name: 'Wildfire smoke', size: '30 nm to 2.5 µm', nm: 40, lo: 30, hi: 2500,
      note: 'Mostly soot, most of it under 2.5 µm. The solid circle is the ultrafine fraction our decks measure at 30 to 50 nm; the ring is the upper end.',
      from: 'wf_ball.html',
      reach: 'Small enough to cross from the lung into the blood',
      impacts: [
        {text: "Wildfire smoke already kills about 41,000 Americans a year. Stanford researchers, writing in Nature, project that toll will reach 71,420 a year by 2050.", url: "https://pubmed.ncbi.nlm.nih.gov/40967551/"},
        {text: "During the 2020 California fires, a Stanford and Harvard study in JAMA Network Open found emergency visits for depression rose about 15%, and for other mood disorders about 29% — the biggest jumps in children.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11971671/"},
        {text: "A Stanford study of nearly 11,700 school districts found a smoky school year measurably lowers children's test scores, hitting younger and disadvantaged students hardest.", url: "https://web.stanford.edu/~mburke/papers/WenBurke2022_smokelearning.pdf"},
        {text: "UC San Diego researchers found wildfire smoke is up to 10 times more harmful to breathing than fine particles from other sources.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7935892/"},
        {text: "These fine particles are a recognized human carcinogen — the WHO's highest evidence tier — and a landmark American Cancer Society study of 500,000 adults tied long-term exposure to about 8% higher lung-cancer deaths.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4037163/"},
        {text: "A Yale and Emory study of 466,000 surgery patients found a wildfire within three months of lung-cancer surgery raised the risk of death 43%.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10375383/"},
        {text: "EPA researchers found that on dense-smoke days, heart emergencies in adults 65+ rose about 15%, and stroke-related visits about 22%.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6015400/"}
      ]
    },
    {
      key: 'ultrafine', name: 'Ultrafine particles', size: 'Under 100 nm', nm: 100, lo: 10, hi: 100,
      note: 'Defined by being under 100 nm. The circle is that ceiling.',
      from: 'ultrafine_ball.html',
      reach: 'Small enough to cross from the lung into the blood',
      impacts: [
        {text: "The World Health Organization ties outdoor fine-particle pollution to about 4.2 million early deaths a year.", url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"},
        {text: "The Health Effects Institute, Institute for Health Metrics and Evaluation and UNICEF counted 8.1 million air-pollution deaths in 2021, with fine particles driving about 90% of the burden.", url: "https://www.stateofglobalair.org/news-events/2024/new-state-global-air-report-finds-air-pollution-second-leading-risk-factor-death"},
        {text: "A George Washington University study tied fine particles to 5 to 10 million asthma emergency-room visits worldwide each year.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6371661/"},
        {text: "The WHO's International Agency for Research on Cancer classified outdoor air pollution and particulate matter as carcinogenic to humans, Group 1, with sufficient evidence that they cause lung cancer.", url: "https://www.iarc.who.int/news-events/iarc-outdoor-air-pollution-a-leading-environmental-cause-of-cancer-deaths/"},
        {text: "The Health Effects Institute and Institute for Health Metrics and Evaluation linked fine-particle pollution to 4.14 million deaths worldwide in 2019, with heart disease and stroke among the leading causes.", url: "https://www.stateofglobalair.org/health/pm"},
        {text: "A Max Planck Institute-led study found ultrafine particles are tied to about 1.99 million premature deaths each year, roughly half from cardiovascular disease.", url: "https://doi.org/10.1093/cvr/cvag136"},
        {text: "A Xi'an Jiaotong University-led analysis tied ambient PM2.5 to 977,140 ischemic heart-disease deaths in 2017.", url: "https://pubmed.ncbi.nlm.nih.gov/33297122/"}
      ]
    },
    {
      key: 'virus', name: 'Viruses', size: 'About 100 nm', nm: 100, lo: 20, hi: 300,
      note: 'The circle is the virus itself. Airborne it usually travels inside a larger droplet, so the particle actually inhaled is bigger.',
      from: 'virus.html',
      reach: 'Small enough to stay airborne for hours and reach the deep lung',
      impacts: [
        {text: 'Airborne viruses stay suspended long enough to be breathed deep into the lung, well past the nose and throat.', url: ''}
      ]
    },
    {
      key: 'bacteria', name: 'Bacteria', size: '0.5 to 2 µm', nm: 1000, lo: 500, hi: 2000,
      note: 'The circle is the cell itself. Airborne it often travels inside a larger droplet or on a fragment of dust.',
      from: 'bacteria.html',
      reach: 'Reaches the deep lung',
      impacts: [
        {text: 'Airborne hospital bacteria such as Staphylococcus and Pseudomonas help drive an estimated 687,000 infections a year, about one patient in 31 on any given day.', url: ''},
        {text: 'Bacterial pneumonia is roughly 15% of them, and a growing share resist the antibiotics we rely on.', url: ''}
      ]
    },
    {
      key: 'fungi', name: 'Fungal spores', size: '2 to 3 µm', nm: 2500, lo: 2000, hi: 3000,
      note: 'Spore size varies widely by species; 2 to 3 µm is the range our mould deck uses.',
      from: 'fungi.html',
      reach: 'Reaches the deep lung',
      impacts: [
        {text: 'Researchers estimate mould sets off 4.6 million asthma cases a year.', url: ''},
        {text: 'The US EPA warns that breathing it can trigger allergic reactions and asthma attacks.', url: ''}
      ]
    }
  ]
};
