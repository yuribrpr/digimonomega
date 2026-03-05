/* eslint-disable no-console */
require('dotenv').config();

const knex = require('knex')(require('../knexfile').development);
const manifest = require('../data/beta_arc1_manifest');

const { campaign, maps: mapDefs, mapSoundtracksByOrder, mapVisuals, mapPromptDetailsByOrder, enemySets, chapters } = manifest;

const ICONS = {
  potionSmall: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
  potionMedium: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
  potionLarge: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hyper-potion.png',
  potionUltra: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png',
  atkChip: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-attack.png',
  defChip: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-defense.png',
  bronzeCore: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/bronze-trophy.png',
  silverCore: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/silver-powder.png',
  goldCore: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png',
  prismCore: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/star-piece.png',
  pass: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/town-map.png',
  seal: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-gateau.png',
  badge: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin-case.png',
  cipher: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/magnet.png',
  sigil: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/odd-keystone.png',
  frost: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/never-melt-ice.png',
  desert: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/soft-sand.png',
  refinery: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-sludge.png',
  abyss: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pearl.png',
  citadel: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/spell-tag.png',
  kernel: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/stardust.png',
  adaptiveCore: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
  evoluter: 'assets/items/evoluter.png'
};

const ITEM_DEFS = [
  { id: 1, key: 'atk_chip_basic', name: 'Chip de Ataque Basico', type: 'consumable', effect_target: 'attack', effect_value: 8, is_percent: 0, recovery_type: 'max', price: 150, icon: ICONS.atkChip, description: 'Aumenta o ataque do Digimon em valor fixo.' },
  { id: 2, key: 'potion_nano', name: 'Pocao Nano', type: 'consumable', effect_target: 'hp', effect_value: 80, is_percent: 0, recovery_type: 'current', price: 60, icon: ICONS.potionSmall, description: 'Restaura 80 de HP atual.' },
  { id: 3, key: 'potion_micro', name: 'Pocao Micro', type: 'consumable', effect_target: 'hp', effect_value: 220, is_percent: 0, recovery_type: 'current', price: 140, icon: ICONS.potionMedium, description: 'Restaura 220 de HP atual.' },
  { id: 4, key: 'def_chip_basic', name: 'Chip de Defesa Basico', type: 'consumable', effect_target: 'defense', effect_value: 8, is_percent: 0, recovery_type: 'max', price: 150, icon: ICONS.defChip, description: 'Aumenta a defesa do Digimon em valor fixo.' },
  { id: 5, key: 'potion_mega', name: 'Pocao Mega', type: 'consumable', effect_target: 'hp', effect_value: 550, is_percent: 0, recovery_type: 'current', price: 320, icon: ICONS.potionLarge, description: 'Restaura 550 de HP atual.' },
  { id: 6, key: 'potion_ultra', name: 'Pocao Ultra', type: 'consumable', effect_target: 'hp', effect_value: 1500, is_percent: 0, recovery_type: 'current', price: 900, icon: ICONS.potionUltra, description: 'Restaura 1500 de HP atual.' },
  { id: 7, key: 'atk_booster_x', name: 'Booster de Ataque X', type: 'consumable', effect_target: 'attack', effect_value: 12, is_percent: 1, recovery_type: 'max', price: 420, icon: ICONS.atkChip, description: 'Aumenta o ataque em 12%.' },
  { id: 8, key: 'def_booster_x', name: 'Booster de Defesa X', type: 'consumable', effect_target: 'defense', effect_value: 12, is_percent: 1, recovery_type: 'max', price: 420, icon: ICONS.defChip, description: 'Aumenta a defesa em 12%.' },
  { id: 9, key: 'bronze_core', name: 'Bronze Core', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.bronzeCore, description: 'Catalisador de evolucao Champion (Lv16).' },
  { id: 10, key: 'silver_core', name: 'Silver Core', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.silverCore, description: 'Catalisador de evolucao Ultimate (Lv36).' },
  { id: 11, key: 'gold_core', name: 'Gold Core', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.goldCore, description: 'Catalisador de evolucao Mega (Lv56).' },
  { id: 12, key: 'evoluter', name: 'Evoluter', type: 'consumable', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.evoluter, description: 'Item de compatibilidade para o sistema de evolucao.' },
  { id: 13, key: 'prismatic_core', name: 'Prismatic Core', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.prismCore, description: 'Catalisador de evolucao Burst (Lv76).' },
  { id: 14, key: 'frost_transit_pass', name: 'Frost Transit Pass', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.pass, description: 'Permite atravessar para Snowstorm Village Square.' },
  { id: 15, key: 'desert_caravan_seal', name: 'Desert Caravan Seal', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.seal, description: 'Selo de passagem para Sandstorm Village Entrance.' },
  { id: 16, key: 'neon_access_badge', name: 'Neon Access Badge', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.badge, description: 'Credencial de acesso para Neon Harbor Docks.' },
  { id: 17, key: 'citadel_cipher', name: 'Citadel Cipher', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.cipher, description: 'Cifra antiga para atravessar o portal da Cidadela.' },
  { id: 18, key: 'omega_sigil', name: 'Omega Sigil', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.sigil, description: 'Sigilo final para abrir a Omega Core Chamber.' },
  { id: 19, key: 'frost_shard', name: 'Frost Shard', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 45, icon: ICONS.frost, description: 'Fragmento congelado usado em missoes do setor frio.' },
  { id: 20, key: 'desert_relic', name: 'Desert Relic', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 55, icon: ICONS.desert, description: 'Reliquia de caravana coletada no deserto digital.' },
  { id: 21, key: 'refinery_sludge', name: 'Refinery Sludge', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 65, icon: ICONS.refinery, description: 'Residuos de dados pesados da refinaria.' },
  { id: 22, key: 'abyssal_pearl', name: 'Abyssal Pearl', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 75, icon: ICONS.abyss, description: 'Perola de baixa luz encontrada em recifes abissais.' },
  { id: 23, key: 'citadel_sigil_fragment', name: 'Citadel Sigil Fragment', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 85, icon: ICONS.citadel, description: 'Fragmento runico usado nas etapas finais.' },
  { id: 24, key: 'kernel_fragment_alpha', name: 'Kernel Fragment Alpha', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.kernel, description: 'Primeiro fragmento recuperado do Kernel.' },
  { id: 25, key: 'kernel_fragment_beta', name: 'Kernel Fragment Beta', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.kernel, description: 'Segundo fragmento recuperado do Kernel.' },
  { id: 26, key: 'kernel_fragment_gamma', name: 'Kernel Fragment Gamma', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.kernel, description: 'Terceiro fragmento recuperado do Kernel.' },
  { id: 27, key: 'kernel_fragment_delta', name: 'Kernel Fragment Delta', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.kernel, description: 'Quarto fragmento recuperado do Kernel.' },
  { id: 28, key: 'kernel_fragment_omega', name: 'Kernel Fragment Omega', type: 'quest', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 0, icon: ICONS.kernel, description: 'Fragmento final e instavel do Kernel.' },
  { id: 29, key: 'adaptive_core', name: 'Adaptive Core', type: 'material', effect_target: 'none', effect_value: 0, is_percent: 0, recovery_type: 'max', price: 80, icon: ICONS.adaptiveCore, description: 'Nucleo generico de digievolucao usado em todas as etapas (quantidade varia por estagio).' }
];

const DIGIMON_ROWS = [
  { id: 1, key: 'agumon', line: 'fire_line', name: 'Agumon', type: 'Vacina', stage: 'Rookie', base_level: 1, base_hp: 420, base_attack: 64, base_defense: 44, base_attack_speed: 2.05, is_starter: 1, next_evolution_id: 2, evolution_level: 16, required_item_id: 29, required_item_quantity: 1, description: 'Iniciante ofensivo com bom dano direto.' },
  { id: 2, key: 'greymon', line: 'fire_line', name: 'Greymon', type: 'Vacina', stage: 'Champion', base_level: 2, base_hp: 1020, base_attack: 156, base_defense: 92, base_attack_speed: 2.1, is_starter: 0, next_evolution_id: 3, evolution_level: 36, required_item_id: 29, required_item_quantity: 2, description: 'Forma Champion focada em pressao frontal.' },
  { id: 3, key: 'metalgreymon', line: 'fire_line', name: 'MetalGreymon', type: 'Vacina', stage: 'Ultimate', base_level: 3, base_hp: 2040, base_attack: 292, base_defense: 186, base_attack_speed: 2.15, is_starter: 0, next_evolution_id: 4, evolution_level: 56, required_item_id: 29, required_item_quantity: 3, description: 'Forma Ultimate de alto burst e controle de campo.' },
  { id: 4, key: 'wargreymon', line: 'fire_line', name: 'WarGreymon', type: 'Vacina', stage: 'Mega', base_level: 4, base_hp: 3560, base_attack: 468, base_defense: 322, base_attack_speed: 2.2, is_starter: 0, next_evolution_id: 5, evolution_level: 76, required_item_id: 29, required_item_quantity: 4, description: 'Forma Mega especialista em bosses.' },
  { id: 5, key: 'victorygreymon', line: 'fire_line', name: 'VictoryGreymon', type: 'Vacina', stage: 'Burst Mode', base_level: 5, base_hp: 5200, base_attack: 628, base_defense: 420, base_attack_speed: 2.3, is_starter: 0, next_evolution_id: null, evolution_level: null, required_item_id: 29, required_item_quantity: 0, description: 'Forma Burst de final de campanha.' },
  { id: 6, key: 'gaomon', line: 'beast_line', name: 'Gaomon', type: 'Data', stage: 'Rookie', base_level: 1, base_hp: 390, base_attack: 62, base_defense: 48, base_attack_speed: 1.95, is_starter: 1, next_evolution_id: 7, evolution_level: 16, required_item_id: 29, required_item_quantity: 1, description: 'Iniciante veloz com ataques em cadeia.' },
  { id: 7, key: 'gaogamon', line: 'beast_line', name: 'Gaogamon', type: 'Data', stage: 'Champion', base_level: 2, base_hp: 980, base_attack: 148, base_defense: 98, base_attack_speed: 2.0, is_starter: 0, next_evolution_id: 8, evolution_level: 36, required_item_id: 29, required_item_quantity: 2, description: 'Champion agressivo para limpar ondas.' },
  { id: 8, key: 'machgaogamon', line: 'beast_line', name: 'MachGaogamon', type: 'Data', stage: 'Ultimate', base_level: 3, base_hp: 1860, base_attack: 282, base_defense: 196, base_attack_speed: 2.05, is_starter: 0, next_evolution_id: 9, evolution_level: 56, required_item_id: 29, required_item_quantity: 3, description: 'Ultimate de DPS sustentado.' },
  { id: 9, key: 'miragegaogamon', line: 'beast_line', name: 'MirageGaogamon', type: 'Data', stage: 'Mega', base_level: 4, base_hp: 3200, base_attack: 452, base_defense: 336, base_attack_speed: 2.15, is_starter: 0, next_evolution_id: 10, evolution_level: 76, required_item_id: 29, required_item_quantity: 4, description: 'Mega de mobilidade e critico alto.' },
  { id: 10, key: 'bancholeomon', line: 'beast_line', name: 'BanchoLeomon', type: 'Data', stage: 'Burst Mode', base_level: 5, base_hp: 4950, base_attack: 610, base_defense: 430, base_attack_speed: 2.2, is_starter: 0, next_evolution_id: null, evolution_level: null, required_item_id: 29, required_item_quantity: 0, description: 'Burst equilibrado para PVE longo.' },
  { id: 11, key: 'lalamon', line: 'nature_line', name: 'Lalamon', type: 'Data', stage: 'Rookie', base_level: 1, base_hp: 450, base_attack: 52, base_defense: 60, base_attack_speed: 2.0, is_starter: 1, next_evolution_id: 12, evolution_level: 16, required_item_id: 29, required_item_quantity: 1, description: 'Iniciante resistente com suporte defensivo.' },
  { id: 12, key: 'sunflowmon', line: 'nature_line', name: 'Sunflowmon', type: 'Data', stage: 'Champion', base_level: 2, base_hp: 1120, base_attack: 130, base_defense: 126, base_attack_speed: 2.05, is_starter: 0, next_evolution_id: 13, evolution_level: 36, required_item_id: 29, required_item_quantity: 2, description: 'Champion de sustain e controle.' },
  { id: 13, key: 'lilamon', line: 'nature_line', name: 'Lilamon', type: 'Data', stage: 'Ultimate', base_level: 3, base_hp: 2280, base_attack: 248, base_defense: 232, base_attack_speed: 2.1, is_starter: 0, next_evolution_id: 14, evolution_level: 56, required_item_id: 29, required_item_quantity: 3, description: 'Ultimate que combina dano e mitigacao.' },
  { id: 14, key: 'rosemon', line: 'nature_line', name: 'Rosemon', type: 'Data', stage: 'Mega', base_level: 4, base_hp: 3740, base_attack: 398, base_defense: 372, base_attack_speed: 2.2, is_starter: 0, next_evolution_id: 15, evolution_level: 76, required_item_id: 29, required_item_quantity: 4, description: 'Mega de controle de ritmo e defesa.' },
  { id: 15, key: 'rosemon_burst_mode', line: 'nature_line', name: 'Rosemon Burst Mode', type: 'Data', stage: 'Burst Mode', base_level: 5, base_hp: 5400, base_attack: 552, base_defense: 506, base_attack_speed: 2.25, is_starter: 0, next_evolution_id: null, evolution_level: null, required_item_id: 29, required_item_quantity: 0, description: 'Burst focado em consistencia e sobrevivencia.' },
  { id: 16, key: 'betamon', line: 'aqua_line', name: 'Betamon', type: 'Vacina', stage: 'Rookie', base_level: 1, base_hp: 430, base_attack: 58, base_defense: 52, base_attack_speed: 2.0, is_starter: 1, next_evolution_id: 17, evolution_level: 16, required_item_id: 29, required_item_quantity: 1, description: 'Iniciante versatil para progressao geral.' },
  { id: 17, key: 'seadramon', line: 'aqua_line', name: 'Seadramon', type: 'Vacina', stage: 'Champion', base_level: 2, base_hp: 1080, base_attack: 142, base_defense: 112, base_attack_speed: 2.05, is_starter: 0, next_evolution_id: 18, evolution_level: 36, required_item_id: 29, required_item_quantity: 2, description: 'Champion com dano constante e boa resistencia.' },
  { id: 18, key: 'megaseadramon', line: 'aqua_line', name: 'MegaSeadramon', type: 'Vacina', stage: 'Ultimate', base_level: 3, base_hp: 2180, base_attack: 274, base_defense: 206, base_attack_speed: 2.1, is_starter: 0, next_evolution_id: 19, evolution_level: 56, required_item_id: 29, required_item_quantity: 3, description: 'Ultimate de alcance e pressao em elites.' },
  { id: 19, key: 'metalseadramon', line: 'aqua_line', name: 'MetalSeadramon', type: 'Vacina', stage: 'Mega', base_level: 4, base_hp: 3620, base_attack: 436, base_defense: 348, base_attack_speed: 2.18, is_starter: 0, next_evolution_id: 20, evolution_level: 76, required_item_id: 29, required_item_quantity: 4, description: 'Mega ofensivo com alto dano por turno.' },
  { id: 20, key: 'aegisdramon', line: 'aqua_line', name: 'Aegisdramon', type: 'Vacina', stage: 'Burst Mode', base_level: 5, base_hp: 5320, base_attack: 588, base_defense: 470, base_attack_speed: 2.24, is_starter: 0, next_evolution_id: null, evolution_level: null, required_item_id: 29, required_item_quantity: 0, description: 'Forma Burst de encerramento de campanha.' }
];

const WORLD_PATH = [
  [6, 78], [14, 74], [22, 70], [30, 66], [38, 62],
  [46, 58], [54, 54], [62, 50], [70, 46], [78, 42],
  [84, 38], [76, 32], [68, 28], [60, 24], [52, 20],
  [44, 16], [56, 12], [68, 10], [80, 8], [92, 6]
];

const GATE_ITEM_BY_MAP_ORDER = {
  4: 'frost_transit_pass',
  8: 'desert_caravan_seal',
  12: 'neon_access_badge',
  16: 'citadel_cipher',
  19: 'omega_sigil'
};

const KERNEL_ITEM_BY_MAP_ORDER = {
  4: 'kernel_fragment_alpha',
  8: 'kernel_fragment_beta',
  12: 'kernel_fragment_gamma',
  16: 'kernel_fragment_delta',
  20: 'kernel_fragment_omega'
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stageByLevel(level) {
  if (level <= 15) return 'Rookie';
  if (level <= 35) return 'Champion';
  if (level <= 55) return 'Ultimate';
  if (level <= 75) return 'Mega';
  return 'Burst Mode';
}

function typeByIndex(index) {
  const types = ['Vacina', 'Data', 'Vírus'];
  return types[index % types.length];
}

function computeCommonStats(level) {
  return {
    hp: Math.round(180 * Math.pow(1.075, level - 1)),
    atk: Math.round(22 * Math.pow(1.062, level - 1)),
    def: Math.round(16 * Math.pow(1.06, level - 1)),
    exp: Math.round(30 * Math.pow(1.065, level - 1))
  };
}

function scaleStats(base, multiplier) {
  return {
    hp: Math.round(base.hp * multiplier.hp),
    atk: Math.round(base.atk * multiplier.atk),
    def: Math.round(base.def * multiplier.def),
    exp: Math.round(base.exp * multiplier.exp)
  };
}

function mapDifficulty(order) {
  const min = 0.85;
  const max = 6.2;
  const t = (order - 1) / 19;
  return Number((min + (max - min) * t).toFixed(2));
}

function resolveSoundtrack(value) {
  if (!value) return { soundtrack_url: null, soundtrack_path: null };
  const v = String(value).trim();
  if (!v) return { soundtrack_url: null, soundtrack_path: null };
  if (v.startsWith('http://') || v.startsWith('https://')) {
    return { soundtrack_url: v, soundtrack_path: null };
  }
  return { soundtrack_url: null, soundtrack_path: v.replace(/\\/g, '/') };
}

function buildMapPrompt(mapDef) {
  const visual = mapVisuals[mapDef.zone] || mapVisuals.farm;
  const details = mapPromptDetailsByOrder?.[mapDef.order] || {};
  const ground = details.ground || visual.ground;
  const background = details.background || visual.background;
  const palette = details.palette || visual.palette;
  const atmosphere = details.atmosphere || 'clean readable lighting with strong silhouette separation';
  return (
    'Create a WIDE HORIZONTAL high-resolution pixel art background for a browser game. ' +
    'IMPORTANT: Image must be LANDSCAPE ORIENTATION, widescreen format 16:9 aspect ratio (1920x1080 or similar wide rectangular shape). ' +
    'NOT square, NOT vertical - must be a wide horizontal rectangle. ' +
    `The scene shows a wide exploration lane inspired by ${mapDef.name} in the Digital World. ` +
    `The lower 60-70% of the image is ${ground} completely empty and clean for placing game characters - ` +
    'no objects, people, animals, props, carts, barrels, crates, posts, or debris on the ground. ' +
    `The upper 30-40% shows background scenery: ${background}. ` +
    `Palette: ${palette}. ` +
    `Lighting and atmosphere: ${atmosphere}. ` +
    'High-resolution pixel art style. Wide landscape format, horizontal composition, flat 2D perspective.'
  );
}

async function ensureColumn(knexOrTrx, table, column, alterTableCb) {
  const exists = await knexOrTrx.schema.hasColumn(table, column);
  if (!exists) {
    await knexOrTrx.schema.alterTable(table, alterTableCb);
  }
}

async function resolveUserDigimonTable(trx) {
  const raw = await trx.raw("SHOW TABLES LIKE '%user%digimon%'");
  const rows = Array.isArray(raw) ? (raw[0] || []) : [];
  if (!rows.length) return 'user_digimons';
  return Object.values(rows[0])[0] || 'user_digimons';
}

async function safeDelete(trx, tableName) {
  const exists = await trx.schema.hasTable(tableName);
  if (exists) {
    await trx(tableName).del();
  }
}

async function resetAutoIncrement(trx, tableName) {
  const exists = await trx.schema.hasTable(tableName);
  if (exists) {
    await trx.raw(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
  }
}

async function main() {
  console.log(`[seed:${campaign.slug}] iniciando...`);

  const trx = await knex.transaction();
  try {
    await ensureColumn(trx, 'digidex', 'is_starter', t => t.boolean('is_starter').notNullable().defaultTo(false));
    await ensureColumn(trx, 'maps', 'route_order', t => t.integer('route_order').notNullable().defaultTo(0));
    await ensureColumn(trx, 'maps', 'world_x', t => t.decimal('world_x', 6, 2).nullable());
    await ensureColumn(trx, 'maps', 'world_y', t => t.decimal('world_y', 6, 2).nullable());
    await ensureColumn(trx, 'maps', 'soundtrack_url', t => t.string('soundtrack_url', 1024).nullable());
    await ensureColumn(trx, 'maps', 'soundtrack_path', t => t.string('soundtrack_path', 255).nullable());
    await ensureColumn(trx, 'battles', 'map_id', t => t.integer('map_id').unsigned().nullable());

    const hasUserMapProgress = await trx.schema.hasTable('user_map_progress');
    if (!hasUserMapProgress) {
      await trx.schema.createTable('user_map_progress', table => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('map_id').unsigned().notNullable();
        table.timestamp('completed_at').defaultTo(trx.fn.now());
        table.unique(['user_id', 'map_id']);
      });
    }

    const userDigimonTable = await resolveUserDigimonTable(trx);

    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');
    await safeDelete(trx, 'user_map_progress');
    await safeDelete(trx, 'user_quests');
    await safeDelete(trx, 'quest_dependencies');
    await safeDelete(trx, 'quest_rewards');
    await safeDelete(trx, 'quest_objectives');
    await safeDelete(trx, 'quests');
    await safeDelete(trx, 'campaigns');
    await safeDelete(trx, 'battles');
    await safeDelete(trx, 'map_enemies');
    await safeDelete(trx, 'enemy_drops');
    await safeDelete(trx, 'inventory');
    await safeDelete(trx, userDigimonTable);
    await safeDelete(trx, 'maps');
    await safeDelete(trx, 'enemydex');
    await safeDelete(trx, 'digidex');
    await safeDelete(trx, 'items');
    await trx.raw('SET FOREIGN_KEY_CHECKS = 1');

    await trx('users').update({
      level: 1,
      exp: 0,
      exp_m: 1000,
      bits: 500
    });

    const hasGameSettings = await trx.schema.hasTable('game_settings');
    if (hasGameSettings) {
      await trx('game_settings')
        .insert({
          setting_key: 'global_xp_multiplier',
          setting_value: '1',
          description: 'Multiplicador global de XP'
        })
        .onConflict('setting_key')
        .merge({ setting_value: '1' });

      await trx('game_settings')
        .insert({
          setting_key: 'global_bits_multiplier',
          setting_value: '1',
          description: 'Multiplicador global de Bits'
        })
        .onConflict('setting_key')
        .merge({ setting_value: '1' });
    }

    const tablesToReset = [
      'items',
      'digidex',
      'enemydex',
      'maps',
      'campaigns',
      'quests',
      'quest_objectives',
      'quest_rewards',
      'quest_dependencies',
      'map_enemies',
      'enemy_drops',
      'battles',
      'inventory',
      userDigimonTable,
      'user_quests',
      'user_map_progress'
    ];
    for (const table of tablesToReset) {
      await resetAutoIncrement(trx, table);
    }

    await trx('items').insert(
      ITEM_DEFS.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        effect_value: item.effect_value,
        price: item.price,
        description: item.description,
        icon: item.icon,
        effect_target: item.effect_target,
        is_percent: item.is_percent,
        recovery_type: item.recovery_type
      }))
    );
    const itemIdByKey = Object.fromEntries(ITEM_DEFS.map(item => [item.key, item.id]));

    await trx('digidex').insert(
      DIGIMON_ROWS.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        base_hp: d.base_hp,
        base_attack: d.base_attack,
        base_defense: d.base_defense,
        description: d.description,
        evolution_level: d.evolution_level,
        evolution_id: d.next_evolution_id,
        required_item_id: d.required_item_id,
        required_item_quantity: d.required_item_quantity,
        evolution_line_id: d.line,
        next_evolution_id: d.next_evolution_id,
        base_level: d.base_level,
        sprite_path: `assets/sprites/starters/${d.key}.gif`,
        required_evoluters: d.required_item_quantity,
        base_attack_speed: d.base_attack_speed,
        stage: d.stage,
        is_starter: d.is_starter
      }))
    );

    const [campaignId] = await trx('campaigns').insert({
      title: campaign.title,
      description: campaign.description,
      order: 1,
      is_active: true
    });

    const mapRowByOrder = {};
    for (let i = 0; i < mapDefs.length; i += 1) {
      const def = mapDefs[i];
      const [wx, wy] = WORLD_PATH[i];
      const requiresItem = !!def.gateItem;
      const soundtrack = resolveSoundtrack(mapSoundtracksByOrder[def.order]);
      const [mapId] = await trx('maps').insert({
        name: def.name,
        min_level: def.minLevel,
        image_path: `assets/maps/beta_arc1/${String(def.order).padStart(2, '0')}_${slugify(def.name)}.png`,
        description: buildMapPrompt(def),
        soundtrack_url: soundtrack.soundtrack_url,
        soundtrack_path: soundtrack.soundtrack_path,
        require_item: requiresItem ? 1 : 0,
        required_item_id: requiresItem ? itemIdByKey[def.gateItem] : null,
        consume_on_enter: 0,
        type: 'Campanha',
        is_active: 1,
        difficulty: mapDifficulty(def.order),
        campaign_id: campaignId,
        route_order: def.order,
        world_x: wx,
        world_y: wy
      });
      mapRowByOrder[def.order] = { id: mapId, ...def };
    }

    const enemyRegistry = {};
    for (let i = 0; i < mapDefs.length; i += 1) {
      const mapDef = mapDefs[i];
      const mapOrder = mapDef.order;
      const mapId = mapRowByOrder[mapOrder].id;
      const set = enemySets[i];

      const mkEnemy = async (name, level, tier, typeIndex) => {
        const commonBase = computeCommonStats(level);
        let stats = commonBase;
        let difficulty = 'Normal';
        if (tier === 'elite') {
          stats = scaleStats(commonBase, { hp: 1.45, atk: 1.35, def: 1.35, exp: 2.1 });
        } else if (tier === 'boss') {
          stats = scaleStats(commonBase, { hp: 2.9, atk: 1.9, def: 1.85, exp: 4.8 });
          difficulty = 'Boss';
        }

        const speedBase = Math.max(1.2, 2.6 - (level * 0.01));
        const speed = Number((tier === 'boss' ? speedBase * 0.92 : tier === 'elite' ? speedBase * 0.96 : speedBase).toFixed(2));
        const bits = Math.max(5, Math.round(stats.exp * (tier === 'boss' ? 1.2 : tier === 'elite' ? 0.85 : 0.7)));

        const [enemyId] = await trx('enemydex').insert({
          name,
          type: typeByIndex(typeIndex),
          stage: stageByLevel(level),
          base_hp: stats.hp,
          base_attack: stats.atk,
          base_defense: stats.def,
          base_level: level,
          attack_speed: speed,
          exp_reward: stats.exp,
          bits_reward: bits,
          sprite_path: `assets/sprites/enemies/${slugify(name)}.gif`,
          difficulty
        });
        await trx('map_enemies').insert({ map_id: mapId, enemy_id: enemyId });
        return enemyId;
      };

      const commonLevels = [
        Math.min(100, mapDef.minLevel),
        Math.min(100, mapDef.minLevel + 2),
        Math.min(100, mapDef.minLevel + 4)
      ];
      const eliteLevel = Math.min(100, mapDef.minLevel + 5);
      const bossLevel = Math.min(100, mapDef.minLevel + 7);

      const c1 = await mkEnemy(set.commons[0], commonLevels[0], 'common', i);
      const c2 = await mkEnemy(set.commons[1], commonLevels[1], 'common', i + 1);
      const c3 = await mkEnemy(set.commons[2], commonLevels[2], 'common', i + 2);
      const elite = await mkEnemy(set.elite, eliteLevel, 'elite', i + 1);
      const boss = await mkEnemy(set.boss, bossLevel, 'boss', i + 2);

      enemyRegistry[mapOrder] = { common: [c1, c2, c3], elite, boss };
    }

    const dropRows = [];
    const potionByChapter = {
      1: itemIdByKey.potion_nano,
      2: itemIdByKey.potion_micro,
      3: itemIdByKey.potion_mega,
      4: itemIdByKey.potion_mega,
      5: itemIdByKey.potion_ultra
    };

    const chapterMaterialById = {
      1: itemIdByKey.frost_shard,
      2: itemIdByKey.desert_relic,
      3: itemIdByKey.refinery_sludge,
      4: itemIdByKey.abyssal_pearl,
      5: itemIdByKey.citadel_sigil_fragment
    };
    const adaptiveCoreId = itemIdByKey.adaptive_core;

    for (const mapDef of mapDefs) {
      const reg = enemyRegistry[mapDef.order];
      const chapter = mapDef.chapter;
      const potionId = potionByChapter[chapter];
      const materialId = chapterMaterialById[chapter];

      dropRows.push({ enemy_id: reg.common[0], item_id: potionId, drop_rate: 24.0 });
      dropRows.push({ enemy_id: reg.common[0], item_id: materialId, drop_rate: 20.0 });
      dropRows.push({ enemy_id: reg.common[1], item_id: materialId, drop_rate: 35.0 });
      dropRows.push({ enemy_id: reg.common[1], item_id: itemIdByKey.atk_chip_basic, drop_rate: 14.0 });
      dropRows.push({ enemy_id: reg.common[2], item_id: materialId, drop_rate: 30.0 });
      dropRows.push({ enemy_id: reg.common[2], item_id: itemIdByKey.def_chip_basic, drop_rate: 14.0 });
      dropRows.push({ enemy_id: reg.elite, item_id: materialId, drop_rate: 55.0 });
      dropRows.push({ enemy_id: reg.elite, item_id: chapter % 2 ? itemIdByKey.atk_booster_x : itemIdByKey.def_booster_x, drop_rate: 18.0 });
      dropRows.push({ enemy_id: reg.boss, item_id: materialId, drop_rate: 100.0 });
      dropRows.push({ enemy_id: reg.boss, item_id: potionId, drop_rate: 60.0 });
      dropRows.push({ enemy_id: reg.common[0], item_id: adaptiveCoreId, drop_rate: 15.0 });
      dropRows.push({ enemy_id: reg.common[1], item_id: adaptiveCoreId, drop_rate: 15.0 });
      dropRows.push({ enemy_id: reg.common[2], item_id: adaptiveCoreId, drop_rate: 15.0 });
      dropRows.push({ enemy_id: reg.elite, item_id: adaptiveCoreId, drop_rate: 22.0 });
      dropRows.push({ enemy_id: reg.boss, item_id: adaptiveCoreId, drop_rate: 35.0 });

      const gateKey = GATE_ITEM_BY_MAP_ORDER[mapDef.order];
      if (gateKey) {
        dropRows.push({ enemy_id: reg.boss, item_id: itemIdByKey[gateKey], drop_rate: 100.0 });
      }
      const kernelKey = KERNEL_ITEM_BY_MAP_ORDER[mapDef.order];
      if (kernelKey) {
        dropRows.push({ enemy_id: reg.boss, item_id: itemIdByKey[kernelKey], drop_rate: 100.0 });
      }
    }
    await trx('enemy_drops').insert(dropRows);

    let questOrder = 1;
    let previousMainQuestId = null;

    const insertQuest = async ({ title, description, minLevel, restartable = false, isRepeatable = false, npcId = null, objectives = [], rewards = [], dependencies = [] }) => {
      const [questId] = await trx('quests').insert({
        campaign_id: campaignId,
        title,
        description,
        order: questOrder,
        min_level: minLevel,
        is_repeatable: isRepeatable ? 1 : 0,
        restartable: restartable ? 1 : 0,
        npc_digimon_id: npcId
      });
      questOrder += 1;

      if (objectives.length) {
        await trx('quest_objectives').insert(
          objectives.map(obj => ({
            quest_id: questId,
            type: obj.type,
            target_enemy_id: obj.target_enemy_id || null,
            target_item_id: obj.target_item_id || null,
            quantity_required: obj.quantity_required,
            description: obj.description
          }))
        );
      }
      if (rewards.length) {
        await trx('quest_rewards').insert(
          rewards.map(reward => ({
            quest_id: questId,
            type: reward.type,
            quantity: reward.quantity,
            item_id: reward.item_id || null,
            digimon_id: reward.digimon_id || null
          }))
        );
      }
      if (dependencies.length) {
        await trx('quest_dependencies').insert(
          dependencies.map(depId => ({
            quest_id: questId,
            depends_on_quest_id: depId
          }))
        );
      }

      return questId;
    };

    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx += 1) {
      const chapter = chapters[chapterIdx];
      const baseMapOrder = chapterIdx * 4 + 1;
      const m1 = enemyRegistry[baseMapOrder];
      const m2 = enemyRegistry[baseMapOrder + 1];
      const m3 = enemyRegistry[baseMapOrder + 2];
      const m4 = enemyRegistry[baseMapOrder + 3];
      const minLevel = mapRowByOrder[baseMapOrder].minLevel;
      const chapterMaterialItemId = itemIdByKey[chapter.materialKey];
      const chapterKernelItemId = itemIdByKey[chapter.kernelKey];
      const chapterGateItemId = itemIdByKey[chapter.gateKey];
      const chapterPotion = potionByChapter[chapter.id];
      const chapterAdaptiveCoreReward = chapter.id >= 4 ? 3 : chapter.id === 1 ? 1 : 2;

      const q1 = await insertQuest({
        title: `[Principal] ${chapter.title} - Patrulha Inicial`,
        description: `${chapter.lore} Elimine o primeiro bando hostil e estabilize a rota principal.`,
        minLevel,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m1.common[0], quantity_required: 6, description: 'Derrote 6 inimigos comuns na rota inicial.' }
        ],
        rewards: [
          { type: 'XP', quantity: 280 * chapter.id },
          { type: 'BITS', quantity: 220 * chapter.id },
          { type: 'ITEM', item_id: chapterPotion, quantity: 2 }
        ],
        dependencies: previousMainQuestId ? [previousMainQuestId] : []
      });

      const q2 = await insertQuest({
        title: `[Principal] ${chapter.title} - Coleta Estrategica`,
        description: 'Recolha material bruto para reforcar os terminais de defesa locais.',
        minLevel: minLevel + 1,
        objectives: [
          { type: 'COLLECT_ITEM', target_item_id: chapterMaterialItemId, quantity_required: 6, description: 'Colete material da zona.' }
        ],
        rewards: [
          { type: 'BITS', quantity: 260 * chapter.id },
          { type: 'ITEM', item_id: chapter.id % 2 ? itemIdByKey.atk_booster_x : itemIdByKey.def_booster_x, quantity: 1 }
        ],
        dependencies: [q1]
      });

      const q3 = await insertQuest({
        title: `[Principal] ${chapter.title} - Queda da Vanguarda`,
        description: 'Derrote a unidade elite que lidera os ataques no setor intermediario.',
        minLevel: minLevel + 3,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m2.elite, quantity_required: 1, description: 'Derrote o inimigo elite da area.' }
        ],
        rewards: [
          { type: 'XP', quantity: 420 * chapter.id },
          { type: 'BITS', quantity: 300 * chapter.id }
        ],
        dependencies: [q2]
      });

      const q4 = await insertQuest({
        title: `[Principal] ${chapter.title} - Pressao no Nucleo`,
        description: 'O chefe avancado bloqueia os transmissores de mapa. Derrube-o para seguir.',
        minLevel: minLevel + 5,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m3.boss, quantity_required: 1, description: 'Derrote o boss da terceira area do capitulo.' }
        ],
        rewards: [
          { type: 'XP', quantity: 560 * chapter.id },
          { type: 'BITS', quantity: 420 * chapter.id },
          { type: 'ITEM', item_id: chapterPotion, quantity: 3 }
        ],
        dependencies: [q3]
      });

      const q5 = await insertQuest({
        title: `[Principal] ${chapter.title} - Chave de Travessia`,
        description: 'Recupere a chave de rota no chefe do setor final para abrir a proxima fronteira.',
        minLevel: minLevel + 7,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m4.boss, quantity_required: 1, description: 'Derrote o boss final do capitulo.' }
        ],
        rewards: [
          { type: 'XP', quantity: 760 * chapter.id },
          { type: 'BITS', quantity: 620 * chapter.id },
          { type: 'ITEM', item_id: chapterGateItemId, quantity: 1 }
        ],
        dependencies: [q4]
      });

      const q6Objectives = chapter.id < 5
        ? [{ type: 'COLLECT_ITEM', target_item_id: chapterKernelItemId, quantity_required: 1, description: 'Colete o Fragmento do Kernel deste capitulo.' }]
        : [
            { type: 'KILL_ENEMY', target_enemy_id: m4.boss, quantity_required: 1, description: 'Derrote novamente o chefe final para estabilizar o nucleo.' },
            { type: 'COLLECT_ITEM', target_item_id: chapterKernelItemId, quantity_required: 1, description: 'Recupere o fragmento final do Kernel.' }
          ];

      const q6Rewards = [
        { type: 'XP', quantity: chapter.id < 5 ? 980 * chapter.id : 6500 },
        { type: 'BITS', quantity: chapter.id < 5 ? 840 * chapter.id : 18000 },
        { type: 'ITEM', item_id: itemIdByKey.adaptive_core, quantity: chapterAdaptiveCoreReward }
      ];

      const q6 = await insertQuest({
        title: `[Principal] ${chapter.title} - Fragmento Confirmado`,
        description: chapter.id < 5
          ? 'Confirme a recuperacao do Fragmento do Kernel e receba o catalisador de evolucao.'
          : 'Com todos os fragmentos unidos, conclua o ritual e estabilize o Kernel central.',
        minLevel: minLevel + 8,
        objectives: q6Objectives,
        rewards: q6Rewards,
        dependencies: [q5]
      });

      previousMainQuestId = q6;

      await insertQuest({
        title: `[Secundaria] ${chapter.title} - Relatorio do Guia`,
        description: 'Reforce a linha de frente eliminando patrulheiros e batedores remanescentes.',
        minLevel,
        restartable: true,
        isRepeatable: true,
        objectives: [
          { type: 'COLLECT_ITEM', target_item_id: chapterMaterialItemId, quantity_required: 4, description: 'Colete 4 materiais de apoio na zona.' },
          { type: 'KILL_ENEMY', target_enemy_id: m1.common[1], quantity_required: 4, description: 'Derrote 4 patrulheiros.' },
        ],
        rewards: [
          { type: 'XP', quantity: 180 * chapter.id },
          { type: 'BITS', quantity: 160 * chapter.id }
        ]
      });

      await insertQuest({
        title: `[Secundaria] ${chapter.title} - Estoque de Campo`,
        description: 'Reponha materiais para a base avancada.',
        minLevel: minLevel + 1,
        restartable: true,
        isRepeatable: true,
        objectives: [
          { type: 'COLLECT_ITEM', target_item_id: chapterMaterialItemId, quantity_required: 10, description: 'Entregue 10 materiais de campo.' }
        ],
        rewards: [
          { type: 'BITS', quantity: 280 * chapter.id },
          { type: 'ITEM', item_id: chapterPotion, quantity: 2 }
        ]
      });

      await insertQuest({
        title: `[Secundaria] ${chapter.title} - Caca a Elite`,
        description: 'Uma unidade elite voltou a circular. Cace duas ocorrencias.',
        minLevel: minLevel + 4,
        restartable: true,
        isRepeatable: true,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m2.elite, quantity_required: 2, description: 'Derrote a unidade elite 2 vezes.' }
        ],
        rewards: [
          { type: 'XP', quantity: 260 * chapter.id },
          { type: 'ITEM', item_id: chapter.id % 2 ? itemIdByKey.def_booster_x : itemIdByKey.atk_booster_x, quantity: 1 }
        ]
      });

      await insertQuest({
        title: `[Secundaria] ${chapter.title} - Conselho Tatico`,
        description: 'Neutralize a ameaca de alto risco e recupere materiais para o comando local.',
        minLevel: minLevel + 6,
        restartable: true,
        isRepeatable: true,
        objectives: [
          { type: 'KILL_ENEMY', target_enemy_id: m4.boss, quantity_required: 1, description: 'Derrote o boss final do setor.' },
          { type: 'COLLECT_ITEM', target_item_id: chapterMaterialItemId, quantity_required: 4, description: 'Colete 4 materiais da zona para o comando.' }
        ],
        rewards: [
          { type: 'XP', quantity: 320 * chapter.id },
          { type: 'BITS', quantity: 300 * chapter.id },
          { type: 'ITEM', item_id: chapterPotion, quantity: 1 }
        ]
      });
    }

    await trx.commit();

    const summary = await Promise.all([
      knex('maps').count({ c: '*' }).first(),
      knex('campaigns').count({ c: '*' }).first(),
      knex('quests').count({ c: '*' }).first(),
      knex('digidex').count({ c: '*' }).first(),
      knex('enemydex').count({ c: '*' }).first(),
      knex('items').count({ c: '*' }).first(),
      knex('map_enemies').count({ c: '*' }).first(),
      knex('enemy_drops').count({ c: '*' }).first()
    ]);

    console.log(`[seed:${campaign.slug}] concluido com sucesso.`);
    console.log({
      maps: Number(summary[0].c),
      campaigns: Number(summary[1].c),
      quests: Number(summary[2].c),
      digidex: Number(summary[3].c),
      enemydex: Number(summary[4].c),
      items: Number(summary[5].c),
      map_enemies: Number(summary[6].c),
      enemy_drops: Number(summary[7].c)
    });
  } catch (error) {
    await trx.rollback();
    console.error(`[seed:${campaign.slug}] falhou:`, error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
