/* eslint-disable no-console */
require('dotenv').config();

const knex = require('knex')(require('../knexfile').development);
const manifest = require('../data/beta_arc1_manifest');

const { maps: mapDefs, mapSoundtracksByOrder } = manifest;

function resolveSoundtrack(value) {
  if (!value) return { soundtrack_url: null, soundtrack_path: null };
  const v = String(value).trim();
  if (!v) return { soundtrack_url: null, soundtrack_path: null };
  if (v.startsWith('http://') || v.startsWith('https://')) {
    return { soundtrack_url: v, soundtrack_path: null };
  }
  return { soundtrack_url: null, soundtrack_path: v.replace(/\\/g, '/') };
}

async function ensureSoundtrackColumns() {
  const hasUrl = await knex.schema.hasColumn('maps', 'soundtrack_url');
  if (!hasUrl) {
    await knex.schema.alterTable('maps', (table) => {
      table.string('soundtrack_url', 1024).nullable();
    });
  }

  const hasPath = await knex.schema.hasColumn('maps', 'soundtrack_path');
  if (!hasPath) {
    await knex.schema.alterTable('maps', (table) => {
      table.string('soundtrack_path', 255).nullable();
    });
  }
}

async function main() {
  try {
    await ensureSoundtrackColumns();
    let updated = 0;

    for (const mapDef of mapDefs) {
      const soundtrack = resolveSoundtrack(mapSoundtracksByOrder[mapDef.order]);
      const count = await knex('maps')
        .where('route_order', mapDef.order)
        .orWhere('name', mapDef.name)
        .update({
          soundtrack_url: soundtrack.soundtrack_url,
          soundtrack_path: soundtrack.soundtrack_path
        });
      updated += Number(count || 0);
    }

    console.log(`[refresh_map_soundtracks_arc1] done. rows updated: ${updated}`);
  } catch (error) {
    console.error('[refresh_map_soundtracks_arc1] failed:', error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
