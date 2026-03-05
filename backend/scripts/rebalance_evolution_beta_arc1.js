/* eslint-disable no-console */
require('dotenv').config();

const knex = require('knex')(require('../knexfile').development);

const ADAPTIVE_CORE = {
  id: 29,
  name: 'Adaptive Core',
  type: 'material',
  effect_target: 'none',
  effect_value: 0,
  price: 80,
  description: 'Nucleo generico de digievolucao usado em todas as etapas (quantidade varia por estagio).',
  icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
  is_percent: 0,
  recovery_type: 'max'
};

async function main() {
  const trx = await knex.transaction();
  try {
    await trx('items')
      .insert(ADAPTIVE_CORE)
      .onConflict('id')
      .merge({
        name: ADAPTIVE_CORE.name,
        type: ADAPTIVE_CORE.type,
        effect_target: ADAPTIVE_CORE.effect_target,
        effect_value: ADAPTIVE_CORE.effect_value,
        price: ADAPTIVE_CORE.price,
        description: ADAPTIVE_CORE.description,
        icon: ADAPTIVE_CORE.icon,
        is_percent: ADAPTIVE_CORE.is_percent,
        recovery_type: ADAPTIVE_CORE.recovery_type
      });

    await trx('digidex')
      .whereNotNull('next_evolution_id')
      .andWhere('stage', 'Rookie')
      .update({ required_item_id: ADAPTIVE_CORE.id, required_item_quantity: 1, required_evoluters: 1 });

    await trx('digidex')
      .whereNotNull('next_evolution_id')
      .andWhere('stage', 'Champion')
      .update({ required_item_id: ADAPTIVE_CORE.id, required_item_quantity: 2, required_evoluters: 2 });

    await trx('digidex')
      .whereNotNull('next_evolution_id')
      .andWhere('stage', 'Ultimate')
      .update({ required_item_id: ADAPTIVE_CORE.id, required_item_quantity: 3, required_evoluters: 3 });

    await trx('digidex')
      .whereNotNull('next_evolution_id')
      .andWhere('stage', 'Mega')
      .update({ required_item_id: ADAPTIVE_CORE.id, required_item_quantity: 4, required_evoluters: 4 });

    await trx('digidex')
      .whereNull('next_evolution_id')
      .update({ required_item_id: ADAPTIVE_CORE.id, required_item_quantity: 0, required_evoluters: 0 });

    await trx('quest_rewards')
      .whereIn('item_id', [9, 10, 11, 13])
      .update({
        item_id: ADAPTIVE_CORE.id,
        quantity: 1
      });

    const chapterCompletionRewards = await trx('quest_rewards as qr')
      .join('quests as q', 'q.id', 'qr.quest_id')
      .where('qr.item_id', ADAPTIVE_CORE.id)
      .andWhere('q.title', 'like', '[Principal]%Fragmento Confirmado%')
      .orderBy('q.order', 'asc')
      .select('qr.id');

    const chapterAdaptiveCoreQuantities = [1, 2, 2, 3, 3];
    for (let i = 0; i < chapterCompletionRewards.length; i += 1) {
      const reward = chapterCompletionRewards[i];
      await trx('quest_rewards')
        .where({ id: reward.id })
        .update({ quantity: chapterAdaptiveCoreQuantities[i] || 3 });
    }

    await trx('enemy_drops').where({ item_id: ADAPTIVE_CORE.id }).del();

    const enemies = await trx('enemydex').select('id', 'difficulty');
    const adaptiveDrops = enemies.map(enemy => ({
      enemy_id: enemy.id,
      item_id: ADAPTIVE_CORE.id,
      drop_rate: String(enemy.difficulty || '').toLowerCase() === 'boss' ? 35.0 : 15.0
    }));
    if (adaptiveDrops.length) {
      await trx.batchInsert('enemy_drops', adaptiveDrops, 500);
    }

    await trx.commit();

    const [requirements, rewards, drops] = await Promise.all([
      knex('digidex').where({ required_item_id: ADAPTIVE_CORE.id }).count({ c: '*' }).first(),
      knex('quest_rewards').where({ item_id: ADAPTIVE_CORE.id }).count({ c: '*' }).first(),
      knex('enemy_drops').where({ item_id: ADAPTIVE_CORE.id }).count({ c: '*' }).first()
    ]);

    console.log('[rebalance_evolution_beta_arc1] done');
    console.log({
      adaptive_core_item_id: ADAPTIVE_CORE.id,
      digidex_using_adaptive_core: Number(requirements?.c || 0),
      quest_rewards_using_adaptive_core: Number(rewards?.c || 0),
      enemy_drops_using_adaptive_core: Number(drops?.c || 0)
    });
  } catch (error) {
    await trx.rollback();
    console.error('[rebalance_evolution_beta_arc1] failed:', error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

main();
