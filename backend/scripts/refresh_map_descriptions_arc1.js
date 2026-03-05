/* eslint-disable no-console */
require('dotenv').config();

const knex = require('knex')(require('../knexfile').development);
const manifest = require('../data/beta_arc1_manifest');

const { maps: mapDefs, mapVisuals, mapPromptDetailsByOrder } = manifest;

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

async function main() {
  try {
    let updated = 0;

    for (const mapDef of mapDefs) {
      const description = buildMapPrompt(mapDef);

      const count = await knex('maps')
        .where('route_order', mapDef.order)
        .orWhere('name', mapDef.name)
        .update({ description });

      updated += Number(count || 0);
    }

    console.log(`[refresh_map_descriptions_arc1] done. rows updated: ${updated}`);
  } catch (error) {
    console.error('[refresh_map_descriptions_arc1] failed:', error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
