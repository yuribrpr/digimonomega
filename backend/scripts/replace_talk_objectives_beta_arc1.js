/* eslint-disable no-console */
require('dotenv').config();

const knex = require('knex')(require('../knexfile').development);

function materialItemByMinLevel(minLevel) {
  const lvl = Number(minLevel || 1);
  if (lvl <= 15) return 19; // frost_shard
  if (lvl <= 35) return 20; // desert_relic
  if (lvl <= 55) return 21; // refinery_sludge
  if (lvl <= 75) return 22; // abyssal_pearl
  return 23; // citadel_sigil_fragment
}

async function main() {
  const trx = await knex.transaction();
  try {
    const talkRows = await trx('quest_objectives as qo')
      .join('quests as q', 'q.id', 'qo.quest_id')
      .select(
        'qo.id',
        'qo.quest_id',
        'qo.quantity_required',
        'q.min_level',
        'q.title'
      )
      .where('qo.type', 'TALK_NPC');

    let convertedToKill = 0;
    let convertedToCollect = 0;

    for (const row of talkRows) {
      const siblingKill = await trx('quest_objectives')
        .where('quest_id', row.quest_id)
        .where('type', 'KILL_ENEMY')
        .whereNotNull('target_enemy_id')
        .orderBy('id', 'asc')
        .first();

      if (siblingKill) {
        await trx('quest_objectives')
          .where('id', row.id)
          .update({
            type: 'KILL_ENEMY',
            target_enemy_id: siblingKill.target_enemy_id,
            target_item_id: null,
            quantity_required: Math.max(1, Math.ceil(Number(siblingKill.quantity_required || 1) / 2)),
            description: 'Derrote reforcos hostis na area.'
          });
        convertedToKill += 1;
      } else {
        const itemId = materialItemByMinLevel(row.min_level);
        await trx('quest_objectives')
          .where('id', row.id)
          .update({
            type: 'COLLECT_ITEM',
            target_enemy_id: null,
            target_item_id: itemId,
            quantity_required: Math.max(3, Number(row.quantity_required || 1) * 2),
            description: 'Colete materiais para a operacao local.'
          });
        convertedToCollect += 1;
      }
    }

    // Normaliza objetivos convertidos anteriormente para evitar KILL duplicado na mesma quest.
    const helperObjectives = await trx('quest_objectives as qo')
      .join('quests as q', 'q.id', 'qo.quest_id')
      .select('qo.id', 'q.min_level')
      .where('qo.description', 'Derrote reforcos hostis na area.');

    for (const row of helperObjectives) {
      await trx('quest_objectives')
        .where('id', row.id)
        .update({
          type: 'COLLECT_ITEM',
          target_enemy_id: null,
          target_item_id: materialItemByMinLevel(row.min_level),
          quantity_required: 4,
          description: 'Colete 4 materiais de apoio na zona.'
        });
    }

    // Ajusta descricoes antigas das side quests para nao sugerir conversa com NPC.
    await trx('quests')
      .where('title', 'like', '%Relatorio do Guia%')
      .update({
        description: 'Reforce a linha de frente eliminando patrulheiros e batedores remanescentes.',
        npc_digimon_id: null
      });

    await trx('quests')
      .where('title', 'like', '%Conselho Tatico%')
      .update({
        description: 'Neutralize a ameaca de alto risco e recupere materiais para o comando local.',
        npc_digimon_id: null
      });

    await trx.commit();

    console.log('[replace_talk_objectives_beta_arc1] concluido.', {
      foundTalkObjectives: talkRows.length,
      convertedToKill,
      convertedToCollect,
      normalizedHelperObjectives: helperObjectives.length
    });
  } catch (error) {
    await trx.rollback();
    console.error('[replace_talk_objectives_beta_arc1] falhou:', error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
