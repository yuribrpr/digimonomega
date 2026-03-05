/* eslint-disable no-console */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const db = require('../config/db');

const DIGIPETS_BASE_URL = 'https://digipets.net/recursos/img/digimons/';
const LOCAL_SPRITE_REL_DIR = 'assets/sprites/digipets';
const LOCAL_SPRITE_ABS_DIR = path.join(__dirname, '..', 'public', LOCAL_SPRITE_REL_DIR);

const VARIANT_ALIASES = {
  SnowGoblimon: ['Goblimon'],
  Panjyamon: ['IceLeomon'],
  Yukidarumon: ['Frigimon'],
  Goburimon: ['Goblimon'],
  Arcadiamon: ['Diaboromon', 'Infermon'],
  ChaosDukemon: ['ChaosGallantmon', 'Gallantmon', 'Megidramon'],
  DarkTyrannomon: ['DarkTyrannomon', 'Tyrannomon'],
  HiAndromon: ['Andromon'],
  Gerbemon: ['Geremon'],
  Millenniummon: ['Millenniumon'],
};

const HARD_RENAME_FALLBACK = {
  MetalGreymon: ['SkullGreymon', 'Greymon'],
  Arcadiamon: ['Diaboromon'],
  ChaosDukemon: ['ChaosGallantmon'],
  Panjyamon: ['IceLeomon'],
  Yukidarumon: ['Frigimon'],
  Goburimon: ['Goblimon'],
};

const STAGE_DEFAULT_FALLBACK = {
  rookie: 'Agumon',
  champion: 'Greymon',
  ultimate: 'SkullGreymon',
  mega: 'WarGreymon',
  'burst mode': 'VictoryGreymon',
  boss: 'WarGreymon',
};

const headCache = new Map();
const downloadCache = new Map();

function stageKey(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function toCandidates(rawName) {
  const raw = String(rawName || '').trim();
  if (!raw) return [];

  const noAccent = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const tokens = noAccent.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const pascal = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('');
  const compact = noAccent.replace(/\s+/g, '');
  const alnum = noAccent.replace(/[^a-zA-Z0-9]/g, '');
  const burstCompact = noAccent.replace(/\bBurst Mode\b/gi, 'BurstMode').replace(/[^a-zA-Z0-9]/g, '');

  return unique([raw, noAccent, compact, alnum, pascal, burstCompact]);
}

async function existsRemoteGif(name) {
  if (!name) return false;
  if (headCache.has(name)) return headCache.get(name);

  const url = `${DIGIPETS_BASE_URL}${encodeURIComponent(name)}.gif`;
  try {
    const res = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': 'digimon-omega-sprite-sync/1.0' }
    });
    const contentType = String(res.headers['content-type'] || '').toLowerCase();
    const ok = res.status === 200 && contentType.includes('image/gif');
    headCache.set(name, ok);
    return ok;
  } catch (error) {
    headCache.set(name, false);
    return false;
  }
}

async function downloadGif(name) {
  if (downloadCache.has(name)) return downloadCache.get(name);

  const fileName = `${slugify(name)}.gif`;
  const absPath = path.join(LOCAL_SPRITE_ABS_DIR, fileName);
  const relPath = `${LOCAL_SPRITE_REL_DIR}/${fileName}`.replace(/\\/g, '/');

  if (!fs.existsSync(LOCAL_SPRITE_ABS_DIR)) {
    fs.mkdirSync(LOCAL_SPRITE_ABS_DIR, { recursive: true });
  }

  if (!fs.existsSync(absPath)) {
    const url = `${DIGIPETS_BASE_URL}${encodeURIComponent(name)}.gif`;
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': 'digimon-omega-sprite-sync/1.0' }
    });
    const contentType = String(res.headers['content-type'] || '').toLowerCase();
    if (res.status !== 200 || !contentType.includes('image/gif')) {
      throw new Error(`Falha ao baixar sprite ${name} (status=${res.status}, content-type=${contentType})`);
    }
    fs.writeFileSync(absPath, Buffer.from(res.data));
  }

  const payload = { name, relPath, absPath };
  downloadCache.set(name, payload);
  return payload;
}

function enemyBaseSpecies(enemyName) {
  return String(enemyName || '').trim().split(/\s+/)[0] || '';
}

function replaceEnemyBaseName(oldName, newBase) {
  const parts = String(oldName || '').trim().split(/\s+/);
  if (!parts.length) return newBase;
  parts[0] = newBase;
  return parts.join(' ');
}

async function resolveSpecies(baseName, stage) {
  const base = String(baseName || '').trim();
  const candidateList = [];

  candidateList.push(...toCandidates(base));
  (VARIANT_ALIASES[base] || []).forEach(alias => candidateList.push(...toCandidates(alias)));

  const checked = unique(candidateList);
  for (const candidate of checked) {
    if (await existsRemoteGif(candidate)) {
      return { spriteName: candidate, renamedTo: null };
    }
  }

  const fallbackNames = unique([
    ...(HARD_RENAME_FALLBACK[base] || []),
    STAGE_DEFAULT_FALLBACK[stageKey(stage)],
    'Agumon'
  ]);

  for (const fallback of fallbackNames) {
    const forms = toCandidates(fallback);
    for (const candidate of forms) {
      if (await existsRemoteGif(candidate)) {
        return { spriteName: candidate, renamedTo: fallback };
      }
    }
  }

  throw new Error(`Não foi possível resolver sprite para: ${baseName}`);
}

async function main() {
  const [digidexRows] = await db.execute('SELECT id, name, stage FROM digidex ORDER BY id');
  const [enemyRows] = await db.execute('SELECT id, name, stage FROM enemydex ORDER BY id');

  const plannedDigidex = [];
  const plannedEnemies = [];

  console.log(`[sync_digipets_sprites] Resolving ${digidexRows.length} jogáveis e ${enemyRows.length} inimigos...`);

  for (const row of digidexRows) {
    const resolved = await resolveSpecies(row.name, row.stage);
    plannedDigidex.push({
      id: row.id,
      oldName: row.name,
      newName: resolved.renamedTo || row.name,
      spriteName: resolved.spriteName
    });
  }

  for (const row of enemyRows) {
    const base = enemyBaseSpecies(row.name);
    const resolved = await resolveSpecies(base, row.stage);
    plannedEnemies.push({
      id: row.id,
      oldName: row.name,
      newName: resolved.renamedTo ? replaceEnemyBaseName(row.name, resolved.renamedTo) : row.name,
      spriteName: resolved.spriteName
    });
  }

  const spriteNames = unique([
    ...plannedDigidex.map(x => x.spriteName),
    ...plannedEnemies.map(x => x.spriteName)
  ]);

  console.log(`[sync_digipets_sprites] Downloading ${spriteNames.length} sprites únicos...`);
  for (const spriteName of spriteNames) {
    await downloadGif(spriteName);
  }

  await db.query('START TRANSACTION');
  try {
    for (const row of plannedDigidex) {
      const downloaded = await downloadGif(row.spriteName);
      await db.execute(
        'UPDATE digidex SET name = ?, sprite_path = ? WHERE id = ?',
        [row.newName, downloaded.relPath, row.id]
      );
    }

    for (const row of plannedEnemies) {
      const downloaded = await downloadGif(row.spriteName);
      await db.execute(
        'UPDATE enemydex SET name = ?, sprite_path = ? WHERE id = ?',
        [row.newName, downloaded.relPath, row.id]
      );
    }

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

  const renamedDigidex = plannedDigidex.filter(x => x.oldName !== x.newName);
  const renamedEnemies = plannedEnemies.filter(x => x.oldName !== x.newName);

  console.log('[sync_digipets_sprites] done', {
    playableUpdated: plannedDigidex.length,
    enemyUpdated: plannedEnemies.length,
    spritesDownloaded: spriteNames.length,
    playableRenamed: renamedDigidex.length,
    enemyRenamed: renamedEnemies.length
  });

  if (renamedDigidex.length) {
    console.log('[sync_digipets_sprites] playable renamed:', renamedDigidex);
  }
  if (renamedEnemies.length) {
    console.log('[sync_digipets_sprites] enemy renamed sample:', renamedEnemies.slice(0, 20));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[sync_digipets_sprites] failed:', error);
    process.exit(1);
  });
