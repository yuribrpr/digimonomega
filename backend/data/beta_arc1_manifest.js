const campaign = {
  slug: 'beta_arc1_fratura_do_kernel',
  version: '1.0.0',
  title: 'Fratura do Kernel',
  description:
    'O Kernel central foi fragmentado e espalhou zonas instaveis pelo Digimundo. O treinador precisa recuperar os cinco Fragmentos do Kernel antes que a corrupcao consuma os biomas.'
};

const maps = [
  { order: 1, name: 'Digimon Farm Gate', minLevel: 1, chapter: 1, zone: 'farm' },
  { order: 2, name: 'Feed Barn Courtyard', minLevel: 4, chapter: 1, zone: 'farm' },
  { order: 3, name: 'Windmill Fields', minLevel: 8, chapter: 1, zone: 'farm' },
  { order: 4, name: 'Snowstorm Village Gate', minLevel: 12, chapter: 1, zone: 'farm' },
  { order: 5, name: 'Snowstorm Village Square', minLevel: 16, chapter: 2, zone: 'snow', gateItem: 'frost_transit_pass' },
  { order: 6, name: 'Frost Trail', minLevel: 21, chapter: 2, zone: 'snow' },
  { order: 7, name: 'Crystal Tunnel', minLevel: 26, chapter: 2, zone: 'snow' },
  { order: 8, name: 'Aurora Watchpost', minLevel: 31, chapter: 2, zone: 'snow' },
  { order: 9, name: 'Sandstorm Village Entrance', minLevel: 36, chapter: 3, zone: 'desert', gateItem: 'desert_caravan_seal' },
  { order: 10, name: 'Western Bazaar Plaza', minLevel: 41, chapter: 3, zone: 'desert' },
  { order: 11, name: 'Dune Freight Route', minLevel: 46, chapter: 3, zone: 'desert' },
  { order: 12, name: 'Rust Refinery Courtyard', minLevel: 51, chapter: 3, zone: 'refinery' },
  { order: 13, name: 'Neon Harbor Docks', minLevel: 56, chapter: 4, zone: 'neon', gateItem: 'neon_access_badge' },
  { order: 14, name: 'Circuit Backstreets', minLevel: 61, chapter: 4, zone: 'neon' },
  { order: 15, name: 'Data Sewer Basin', minLevel: 66, chapter: 4, zone: 'neon' },
  { order: 16, name: 'Abyssal Reef Shelf', minLevel: 71, chapter: 4, zone: 'abyss' },
  { order: 17, name: 'Eclipse Citadel Causeway', minLevel: 76, chapter: 5, zone: 'citadel', gateItem: 'citadel_cipher' },
  { order: 18, name: 'Void Chapel Nave', minLevel: 82, chapter: 5, zone: 'citadel' },
  { order: 19, name: 'Fractured Kernel Bridge', minLevel: 88, chapter: 5, zone: 'kernel' },
  { order: 20, name: 'Omega Core Chamber', minLevel: 94, chapter: 5, zone: 'kernel', gateItem: 'omega_sigil' }
];

const mapSoundtracksByOrder = {
  1: 'assets/maps/1770688014513-391809743.mp3',
  2: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/At%20Rest.mp3',
  3: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Village%20Consort.mp3',
  4: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Luminous%20Rain.mp3',
  5: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ice%20Flow.mp3',
  6: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ice%20Flow.mp3',
  7: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Moonlight%20Hall.mp3',
  8: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3',
  9: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lost%20Frontier.mp3',
  10: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Angevin.mp3',
  11: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Harlequin.mp3',
  12: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/The%20Complex.mp3',
  13: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Reformat.mp3',
  14: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Shiny%20Tech.mp3',
  15: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dream%20Culture.mp3',
  16: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Infinite%20Perspective.mp3',
  17: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lightless%20Dawn.mp3',
  18: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gathering%20Darkness.mp3',
  19: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Corruption.mp3',
  20: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3'
};

const mapVisuals = {
  farm: {
    ground: 'flat packed farmland soil mixed with short dry grass seams and faint wooden plank traces',
    background: 'low farm barns and fence silhouettes far back, small windmills, distant hills, and a mild dawn sky',
    palette: 'warm soil browns, muted green grass, soft amber light'
  },
  snow: {
    ground: 'flat compacted snow with subtle icy patches and faint footprints dissolved by wind',
    background: 'wooden village cabins with dim blue lanterns, frozen pines in the distance, layered mountain walls, and pale winter sky',
    palette: 'cold whites, cyan shadows, desaturated blue grays'
  },
  desert: {
    ground: 'flat wind-smoothed desert sand with compacted travel tracks and faint stone tile remains near edges',
    background: 'western facades and market awnings far back, canyon walls, sparse cacti at corners, and a dry late-afternoon sky',
    palette: 'golden sand, faded wood, dusty orange and sepia tones'
  },
  refinery: {
    ground: 'flat oxidized metal floor with restrained rust gradients and subtle bolted panel seams',
    background: 'refinery pipes, distant storage tanks, smoke vents far back, and industrial towers against a hazy sky',
    palette: 'rust red, iron gray, oil black, dim orange highlights'
  },
  neon: {
    ground: 'flat synthetic pavement with clean panel lines and faint luminous circuitry veins',
    background: 'stacked cyber buildings, billboard silhouettes, data antennas, and rain clouds lit by neon haze',
    palette: 'teal glow, electric blue, asphalt gray, controlled magenta accents'
  },
  abyss: {
    ground: 'flat dark reef stone with subtle wet reflections and thin coral textures at extreme edges',
    background: 'submerged ruins, towering algae silhouettes, faint bioluminescent currents, and deep ocean gradient',
    palette: 'deep navy, sea green, cyan bioluminescence, slate'
  },
  citadel: {
    ground: 'flat obsidian tiles with restrained rune lines and cracked sacred seams',
    background: 'gothic citadel walls, broken arches, tall statues in silhouette, and a stormy eclipse sky',
    palette: 'charcoal black, moonlit gray, muted violet haze, silver rim light'
  },
  kernel: {
    ground: 'flat fragmented digital stone with geometric shards fused into stable combat lanes',
    background: 'floating monoliths, broken data rings, distant energy conduits, and a cosmic fracture sky',
    palette: 'graphite, electric cyan, crimson warning glows, pale white sparks'
  }
};

const mapPromptDetailsByOrder = {
  1: {
    ground: 'flat packed farm dirt with subtle straw streaks and faint wheel traces near the edges',
    background: 'a broad wooden ranch gate with digi-rune posts, low barns, distant orchard lines, and soft morning mist over green hills',
    palette: 'honey brown, dry hay yellow, olive green, pale dawn blue',
    atmosphere: 'quiet sunrise lighting with long soft shadows and clean horizon depth'
  },
  2: {
    ground: 'flat compacted courtyard soil with muted grain dust tones and light plank imprints near side borders',
    background: 'feed silos, old barn facades, hanging pulley beams, distant fence rows, and a bright overcast rural sky',
    palette: 'wheat beige, weathered red wood, muted gray metal, cloud white',
    atmosphere: 'clear midday readability with crisp silhouettes and low haze'
  },
  3: {
    ground: 'flat wind-brushed grassland dirt with tiny yellow wildflower specks only at extreme corners',
    background: 'large windmills on rolling fields, irrigation channels far back, scattered farm rooftops, and high moving clouds',
    palette: 'fresh green, sunlit tan, off-white clouds, muted teal shadows',
    atmosphere: 'open breezy daylight with high visibility and light motion implied in the sky'
  },
  4: {
    ground: 'flat hard-packed road transitioning from farmland to frozen gravel with thin frost veins',
    background: 'a frontier checkpoint wall, wooden watch towers, first snow-covered pines, mountain foothills, and pale cold sky',
    palette: 'dusty brown, frosted gray, pine green, cold blue',
    atmosphere: 'late afternoon chill with mixed warm-cold color contrast'
  },
  5: {
    ground: 'flat compacted snow plaza with subtle icy glazing and clean stone tile contours under the frost',
    background: 'snow village facades, sloped chalet roofs, distant chimneys, frozen banners, and layered alpine ridges',
    palette: 'clean white, arctic cyan, desaturated wood brown, steel blue',
    atmosphere: 'clear winter noon with sharp highlights and soft blue ambient shadows'
  },
  6: {
    ground: 'flat frozen trail surface with compressed snow bands and faint crystalline shimmer at the margins',
    background: 'narrow canyon walls, dense pine lines, icy cliffs, far signal poles, and overcast storm clouds',
    palette: 'ice blue, slate gray, dark pine, pale silver',
    atmosphere: 'windy cold weather with low-contrast sky and strong ground readability'
  },
  7: {
    ground: 'flat translucent ice floor with subtle geometric cracks and smooth reflective patches',
    background: 'massive crystal formations, cavern arches, frozen stalactites far back, and refracted blue light shafts',
    palette: 'glacial cyan, electric teal, cool violet highlights, dark navy',
    atmosphere: 'interior cavern glow with high contrast reflections and mystical chill'
  },
  8: {
    ground: 'flat froststone platform with restrained rune seams and thin snow dust at side edges',
    background: 'elevated watchpost walls, beacon pylons, jagged mountain skyline, and bright aurora ribbons across the night sky',
    palette: 'moonlit gray, neon aqua, aurora green, deep midnight blue',
    atmosphere: 'clear polar night with dramatic sky glow and silhouette-heavy background'
  },
  9: {
    ground: 'flat desert hardpan with compacted caravan tracks and faint sandstone plate fragments',
    background: 'village gate arches, adobe guard towers, layered dunes, dry palms at corners, and dusty horizon wind',
    palette: 'burnt sand, clay orange, faded khaki, warm beige haze',
    atmosphere: 'hot dry afternoon with suspended dust and softened distant contours'
  },
  10: {
    ground: 'flat sandy town square with subtle compacted patches and clean tile remnants near borders',
    background: 'western bazaar facades, cloth canopies far back, lantern strings, canyon walls, and golden sunset sky',
    palette: 'warm sand, faded wood, dusty gray, amber sunset glow',
    atmosphere: 'sunset marketplace mood with warm highlights and long readable shadows'
  },
  11: {
    ground: 'flat dune route surface with parallel freight marks and sparse gravel texture at side limits',
    background: 'cargo outposts, rail-like transport lines, distant windbreak walls, telegraph silhouettes, and orange dusk clouds',
    palette: 'sandy ochre, rust brown, dry mauve sky, dim brass accents',
    atmosphere: 'late dusk transit corridor with cinematic horizon depth'
  },
  12: {
    ground: 'flat oxidized steel plating with subtle welded seams and restrained oil stains near corners',
    background: 'refinery stacks, pressure pipes, distant cooling towers, vent smoke plumes, and industrial smog sky',
    palette: 'rust red, gunmetal gray, soot black, furnace orange',
    atmosphere: 'heavy industrial heat with hazy backlight and strong metallic contrast'
  },
  13: {
    ground: 'flat dock-grade composite pavement with clean panel joints and faint wet reflections',
    background: 'neon harbor cranes, container silhouettes, holographic buoys, distant skyline blocks, and rainy cyber clouds',
    palette: 'electric cyan, deep teal, asphalt gray, neon pink accents',
    atmosphere: 'humid neon rain ambiance with luminous reflections and cool contrast'
  },
  14: {
    ground: 'flat dark alley pavement with subtle circuit engravings and linear light strips near borders',
    background: 'stacked service buildings, hanging cables, retro-futuristic signboards, rooftop antennas, and dense urban fog',
    palette: 'charcoal black, turquoise glow, muted red signage, cold violet haze',
    atmosphere: 'tight backstreet mood with compressed depth and hard-edged light pockets'
  },
  15: {
    ground: 'flat drainage basin concrete with shallow glossy film and geometric maintenance panels',
    background: 'huge sewer conduits, service catwalks, leaking data pipes, warning lamps, and toxic mist bands',
    palette: 'dirty cyan, toxic green, concrete gray, dim amber warning lights',
    atmosphere: 'claustrophobic industrial undercity with damp diffusion and moody contrast'
  },
  16: {
    ground: 'flat reef shelf stone with subtle wet sheen and tiny coral traces only on extreme edges',
    background: 'sunken ruins, giant kelp silhouettes, distant rock arches, floating plankton glow, and deep water gradient',
    palette: 'abyss navy, sea green, bioluminescent cyan, muted slate',
    atmosphere: 'calm underwater ambience with drifting particulate light and soft caustic cues'
  },
  17: {
    ground: 'flat obsidian causeway tiles with fine rune joints and slight fractured segments near sides',
    background: 'colossal citadel walls, guardian statues, bridge buttresses, lightning clouds, and eclipsed moon halo',
    palette: 'obsidian black, steel gray, storm blue, pale silver highlights',
    atmosphere: 'ominous storm lighting with dramatic rim light around monumental shapes'
  },
  18: {
    ground: 'flat sacred stone floor with faded sigils and clean central lane geometry',
    background: 'ruined chapel columns, broken stained arches, floating dust motes, distant choir alcoves, and violet void glow',
    palette: 'ashen gray, moon silver, desaturated violet, deep shadow blue',
    atmosphere: 'haunted interior calm with ethereal volumetric light and solemn depth'
  },
  19: {
    ground: 'flat fractured digital bridge plates with controlled glitch seams and luminous data cracks',
    background: 'floating ring debris, shattered monoliths, broken lattice conduits, far anomaly clouds, and unstable sky rifts',
    palette: 'graphite, electric cyan, warning crimson, pale static white',
    atmosphere: 'high-tension endgame energy with sharp contrast and active atmospheric distortion'
  },
  20: {
    ground: 'flat core platform alloy with precise concentric lane markings and restrained energy channels',
    background: 'towering omega reactor columns, orbiting data rings, suspended control pylons, and radiant cosmic fracture horizon',
    palette: 'void black, radiant cyan, molten gold, crimson hazard glow',
    atmosphere: 'final boss chamber lighting with monumental scale and intense focal illumination'
  }
};

const enemySets = [
  { commons: ['Tanemon Scout', 'Tokomon Rustler', 'Kapurimon Prowler'], elite: 'Goblimon Foreman', boss: 'Monochromon Bruiser' },
  { commons: ['Patamon Stray', 'Tsunomon Thief', 'Terriermon Drifter'], elite: 'Gotsumon Warden', boss: 'Tyrannomon Raider' },
  { commons: ['Biyomon Nomad', 'Pomumon Sower', 'Renamon Tracker'], elite: 'Leomon Outrider', boss: 'Mammothmon Gale' },
  { commons: ['SnowAgumon Scout', 'Penguinmon Patrol', 'Frigimon Cub'], elite: 'Hyogamon Sentinel', boss: 'Ikkakumon Breaker' },
  { commons: ['SnowGoblimon Bandit', 'Mojyamon Rogue', 'IceDevimon Acolyte'], elite: 'Panjyamon Fang', boss: 'Zudomon Herald' },
  { commons: ['Blucomon Trailblazer', 'Yukidarumon Guard', 'Sorcermon Shade'], elite: 'Gururumon Hunter', boss: 'WereGarurumon Alpha' },
  { commons: ['Sangomon Miner', 'Seahomon Probe', 'Frigimon Driller'], elite: 'MarineDevimon Tide', boss: 'MegaSeadramon Core' },
  { commons: ['Witchmon Beacon', 'IceLeomon Guard', 'Gerbemon Scavenger'], elite: 'SkullSatamon Frost', boss: 'Vikemon Watcher' },
  { commons: ['Goburimon Dune', 'Psychemon Marauder', 'Reptiledramon Scout'], elite: 'Cyclonemon Vanguard', boss: 'Ogremon Khan' },
  { commons: ['Starmon Hustler', 'Deputymon Patrol', 'Revolmon Trigger'], elite: 'Centarumon Duelist', boss: 'SuperStarmon Marshal' },
  { commons: ['Drimogemon Burrower', 'Tyrannomon Dust', 'Snimon Ravager'], elite: 'Triceramon Charger', boss: 'Etemon Riot' },
  { commons: ['Guardromon Loader', 'Tankmon Turret', 'Mekanorimon Shell'], elite: 'Andromon Judge', boss: 'HiAndromon Prime' },
  { commons: ['Clockmon Dockhand', 'Wizardmon Smuggler', 'Soulmon Signal'], elite: 'Cyberdramon Spear', boss: 'Datamon Broker' },
  { commons: ['Hagurumon Circuit', 'Commandramon Blade', 'Sealsdramon Ghost'], elite: 'DarkTyrannomon Spike', boss: 'MetalMamemon Regulator' },
  { commons: ['Raremon Spill', 'Numemon Sludge', 'Sukamon Waste'], elite: 'Dokugumon Toxic', boss: 'MetalEtemon Broadcast' },
  { commons: ['Gesomon Current', 'Whamon Devourer', 'Divermon Spear'], elite: 'MarineDevimon Abyss', boss: 'Plesiomon Sovereign' },
  { commons: ['BlackAgumon Dread', 'SkullGreymon Hound', 'Devimon Zealot'], elite: 'LadyDevimon Scythe', boss: 'Beelzemon Wraith' },
  { commons: ['Phantomon Echo', 'Myotismon Apostle', 'Bakemon Choir'], elite: 'Piedmon Mask', boss: 'VenomMyotismon Throne' },
  { commons: ['Infermon Frame', 'Arcadiamon Edge', 'Diaboromon Seed'], elite: 'ChaosDukemon Rift', boss: 'Alphamon Ouryuken' },
  { commons: ['Keramon Coreling', 'Kimeramon Alpha', 'Machinedramon Null'], elite: 'Millenniummon Rift', boss: 'Ogudomon Absolute' }
];

const chapters = [
  {
    id: 1,
    title: 'Capitulo 1 - Sementes da Fratura',
    lore: 'O portal da Digimon Farm perdeu estabilidade e pequenos bandos comecaram a saquear recursos. O primeiro Fragmento do Kernel foi detectado na fronteira gelada.',
    materialKey: 'frost_shard',
    kernelKey: 'kernel_fragment_alpha',
    gateKey: 'frost_transit_pass',
    evolutionCoreKey: 'bronze_core'
  },
  {
    id: 2,
    title: 'Capitulo 2 - Fronteira Congelada',
    lore: 'Snowstorm Village esta isolada. Um eco do Kernel congela rotas inteiras e transforma sentinelas em predadores.',
    materialKey: 'desert_relic',
    kernelKey: 'kernel_fragment_beta',
    gateKey: 'desert_caravan_seal',
    evolutionCoreKey: 'silver_core'
  },
  {
    id: 3,
    title: 'Capitulo 3 - Poeira e Ferrugem',
    lore: 'As trilhas do deserto escondem uma refinaria ativa. Mercenarios digitais vendem energia corrompida para alimentar o caos.',
    materialKey: 'refinery_sludge',
    kernelKey: 'kernel_fragment_gamma',
    gateKey: 'neon_access_badge',
    evolutionCoreKey: 'gold_core'
  },
  {
    id: 4,
    title: 'Capitulo 4 - Mar de Neon',
    lore: 'A costa neon revela canais de dados infectados. O quarto fragmento afundou em ruinas abissais protegidas por guardioes antigos.',
    materialKey: 'abyssal_pearl',
    kernelKey: 'kernel_fragment_delta',
    gateKey: 'citadel_cipher',
    evolutionCoreKey: 'prismatic_core'
  },
  {
    id: 5,
    title: 'Capitulo 5 - Eclipse do Kernel',
    lore: 'A Cidadela do Eclipse abriu o acesso ao nucleo quebrado. O antagonista quer unificar os fragmentos para reescrever o Digimundo.',
    materialKey: 'citadel_sigil_fragment',
    kernelKey: 'kernel_fragment_omega',
    gateKey: 'omega_sigil',
    evolutionCoreKey: null
  }
];

module.exports = {
  campaign,
  maps,
  mapSoundtracksByOrder,
  mapVisuals,
  mapPromptDetailsByOrder,
  enemySets,
  chapters
};
