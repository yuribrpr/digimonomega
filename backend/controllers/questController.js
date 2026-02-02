const knex = require('../config/knex');

// Get all campaigns with their quests
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await knex('campaigns')
      .where('is_active', true)
      .orderBy('order', 'asc');

    const quests = await knex('quests')
      .join('campaigns', 'quests.campaign_id', 'campaigns.id')
      .where('campaigns.is_active', true)
      .select('quests.*', 'campaigns.id as campaign_id')
      .orderBy('quests.order', 'asc');

    // Attach quests to campaigns
    const campaignsWithQuests = campaigns.map(campaign => ({
      ...campaign,
      quests: quests.filter(q => q.campaign_id === campaign.id)
    }));

    res.json(campaignsWithQuests);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
};

// Get specific quest details
exports.getQuestDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const quest = await knex('quests').where('id', id).first();
    if (!quest) return res.status(404).json({ message: 'Quest not found' });

    // Fetch Objectives with Names and Images
    const objectives = await knex('quest_objectives').where('quest_id', id);
    const enrichedObjectives = await Promise.all(objectives.map(async (obj) => {
      let targetName = null;
      let targetImage = null;
      if (obj.type === 'KILL_ENEMY' && obj.target_enemy_id) {
        const enemy = await knex('enemydex').where('id', obj.target_enemy_id).first();
        targetName = enemy ? enemy.name : 'Inimigo Desconhecido';
        targetImage = enemy ? enemy.sprite_path : null;
      } else if (obj.type === 'COLLECT_ITEM' && obj.target_item_id) {
        const item = await knex('items').where('id', obj.target_item_id).first();
        targetName = item ? item.name : 'Item Desconhecido';
        targetImage = item ? item.icon : null;
      }
      return { ...obj, target_name: targetName, target_image: targetImage };
    }));

    // Fetch Rewards with Names and Images
    const rewards = await knex('quest_rewards').where('quest_id', id);
    const enrichedRewards = await Promise.all(rewards.map(async (reward) => {
      let rewardName = null;
      let rewardImage = null;
      if (reward.type === 'ITEM' && reward.item_id) {
        const item = await knex('items').where('id', reward.item_id).first();
        rewardName = item ? item.name : 'Item';
        rewardImage = item ? item.icon : null;
      } else if (reward.type === 'DIGIMON' && reward.digimon_id) {
        const digimon = await knex('digidex').where('id', reward.digimon_id).first();
        rewardName = digimon ? digimon.name : 'Digimon';
        rewardImage = digimon ? digimon.sprite_path : null;
      }
      return { ...reward, name: rewardName, image: rewardImage };
    }));
    
    // Fetch NPC details
    const npc = quest.npc_digimon_id 
      ? await knex('digidex').where('id', quest.npc_digimon_id).first() 
      : null;

    const responseData = { ...quest, objectives: enrichedObjectives, rewards: enrichedRewards, npc };
    // console.log('Quest Details Response:', JSON.stringify(responseData, null, 2)); // Debug log
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching quest details:', error);
    res.status(500).json({ message: 'Error fetching quest details' });
  }
};

// Get User Quest Progress
exports.getUserQuestProgress = async (req, res) => {
  const userId = req.user.id;
  try {
    const progress = await knex('user_quests').where('user_id', userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user quest progress:', error);
    res.status(500).json({ message: 'Error fetching user quest progress' });
  }
};

// Get Active Quests (Enriched) for Tracker
exports.getActiveQuests = async (req, res) => {
    const userId = req.user.id;
    try {
        const userQuests = await knex('user_quests')
            .join('quests', 'user_quests.quest_id', 'quests.id')
            .where('user_quests.user_id', userId)
            .andWhere('user_quests.status', 'IN_PROGRESS')
            .select('quests.id', 'quests.title', 'quests.order', 'quests.description', 'user_quests.progress', 'user_quests.status');

        const enriched = await Promise.all(userQuests.map(async (uq) => {
            try {
                const objectives = await knex('quest_objectives').where('quest_id', uq.id);
                // Enrich objectives names
                const enrichedObjectives = await Promise.all(objectives.map(async (obj) => {
                    let targetName = null;
                    let targetImage = null;
                    if (obj.type === 'KILL_ENEMY' && obj.target_enemy_id) {
                        const enemy = await knex('enemydex').where('id', obj.target_enemy_id).first();
                        targetName = enemy ? enemy.name : 'Inimigo';
                        targetImage = enemy ? enemy.sprite_path : null;
                    } else if (obj.type === 'COLLECT_ITEM' && obj.target_item_id) {
                        const item = await knex('items').where('id', obj.target_item_id).first();
                        targetName = item ? item.name : 'Item';
                        targetImage = item ? item.icon : null;
                    }
                    return { ...obj, target_name: targetName, target_image: targetImage };
                }));

                let progressData = uq.progress;
                if (typeof progressData === 'string') {
                    try {
                        progressData = JSON.parse(progressData || '{}');
                    } catch (e) {
                        progressData = {};
                    }
                } else if (!progressData) {
                    progressData = {};
                }

                return {
                    ...uq,
                    progress: progressData,
                    objectives: enrichedObjectives
                };
            } catch (err) {
                throw err;
            }
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching active quests:', error);
        res.status(500).json({ message: 'Error fetching active quests' });
    }
};

// Start a Quest
exports.startQuest = async (req, res) => {
  const { questId } = req.body;
  const userId = req.user.id;

  try {
    // Check limit of active quests (Max 3)
    const activeQuestsCount = await knex('user_quests')
      .where({ user_id: userId, status: 'IN_PROGRESS' })
      .count('id as count')
      .first();

    if (activeQuestsCount.count >= 3) {
        return res.status(400).json({ message: 'Você já possui 3 missões em andamento. Termine ou cancele alguma para aceitar novas.' });
    }

    const existing = await knex('user_quests')
      .where({ user_id: userId, quest_id: questId })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Quest already started or completed' });
    }

    // Initialize progress based on objectives and current inventory
    const objectives = await knex('quest_objectives').where('quest_id', questId);
    const initialProgress = {};
    
    // Check inventory for COLLECT_ITEM objectives
    for (const obj of objectives) {
        if (obj.type === 'COLLECT_ITEM' && obj.target_item_id) {
            const inventoryItem = await knex('inventory')
                .where({ user_id: userId, item_id: obj.target_item_id })
                .first();
            
            // Initial progress is what they have, capped at required quantity (optional, but raw count is better for display)
            initialProgress[obj.id] = inventoryItem ? inventoryItem.quantity : 0;
        } else {
            initialProgress[obj.id] = 0;
        }
    }

    await knex('user_quests').insert({
      user_id: userId,
      quest_id: questId,
      status: 'IN_PROGRESS',
      progress: JSON.stringify(initialProgress),
      started_at: knex.fn.now()
    });

    res.json({ message: 'Quest started successfully' });
  } catch (error) {
    console.error('Error starting quest:', error);
    res.status(500).json({ message: 'Error starting quest' });
  }
};

// Cancel a Quest
exports.cancelQuest = async (req, res) => {
    const { questId } = req.body;
    const userId = req.user.id;
  
    try {
      const deleted = await knex('user_quests')
        .where({ user_id: userId, quest_id: questId, status: 'IN_PROGRESS' })
        .del();
  
      if (!deleted) {
        return res.status(404).json({ message: 'Missão não encontrada ou não pode ser cancelada.' });
      }
  
      res.json({ message: 'Missão cancelada com sucesso.' });
    } catch (error) {
      console.error('Error cancelling quest:', error);
      res.status(500).json({ message: 'Erro ao cancelar missão.' });
    }
};

// Delete Campaign (Admin)
exports.deleteCampaign = async (req, res) => {
    const { id } = req.params;
    try {
        // Delete associated quests first (or let cascade handle it if configured, but safe to be explicit)
        // Ideally DB has cascade delete, but let's try direct delete of campaign
        await knex('quest_campaigns').where('id', id).del();
        res.json({ message: 'Campanha excluída com sucesso' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ message: 'Erro ao excluir campanha' });
    }
};

// Delete Quest (Admin)
exports.deleteQuest = async (req, res) => {
    const { id } = req.params;
    try {
        await knex('quests').where('id', id).del();
        res.json({ message: 'Quest excluída com sucesso' });
    } catch (error) {
        console.error('Error deleting quest:', error);
        res.status(500).json({ message: 'Erro ao excluir quest' });
    }
};

// Check Quest Completion (Helper)
const checkQuestCompletion = async (userQuestId, userId, questId) => {
  const userQuest = await knex('user_quests').where('id', userQuestId).first();
  const objectives = await knex('quest_objectives').where('quest_id', questId);
  
  const progress = typeof userQuest.progress === 'string' 
    ? JSON.parse(userQuest.progress) 
    : userQuest.progress;

  let allCompleted = true;
  for (const obj of objectives) {
    if ((progress[obj.id] || 0) < obj.quantity_required) {
      allCompleted = false;
      break;
    }
  }

  if (allCompleted && userQuest.status === 'IN_PROGRESS') {
    await knex('user_quests')
      .where('id', userQuestId)
      .update({
        status: 'COMPLETED',
        completed_at: knex.fn.now()
      });
    return true;
  }
  return false;
};

// Claim Reward
exports.claimReward = async (req, res) => {
  const { questId } = req.body;
  const userId = req.user.id;

  const trx = await knex.transaction();

  try {
    const userQuest = await trx('user_quests')
      .where({ user_id: userId, quest_id: questId })
      .first();

    if (!userQuest || userQuest.status !== 'COMPLETED') {
      await trx.rollback();
      return res.status(400).json({ message: 'Quest not completed or already claimed' });
    }

    const rewards = await trx('quest_rewards').where('quest_id', questId);
    
    // Apply rewards
    for (const reward of rewards) {
      if (reward.type === 'BITS') {
        await trx('users').where('id', userId).increment('bits', reward.quantity);
      } else if (reward.type === 'XP') {
        await trx('users').where('id', userId).increment('exp', reward.quantity);
        // TODO: Handle Level Up logic if EXP exceeds threshold (optional for now)
      } else if (reward.type === 'ITEM') {
        const existingItem = await trx('inventory')
          .where({ user_id: userId, item_id: reward.item_id })
          .first();

        if (existingItem) {
          await trx('inventory')
            .where('id', existingItem.id)
            .increment('quantity', reward.quantity);
        } else {
          await trx('inventory').insert({
            user_id: userId,
            item_id: reward.item_id,
            quantity: reward.quantity
          });
        }
      } else if (reward.type === 'DIGIMON') {
        if (!reward.digimon_id) continue;

        const digimon = await trx('digidex').where('id', reward.digimon_id).first();
        if (!digimon) {
          console.error(`Digimon with id ${reward.digimon_id} not found for reward`);
          continue;
        }

        const hasUserDigimons = await trx.schema.hasTable('user_digimons');
        const table = hasUserDigimons
          ? 'user_digimons'
          : (await trx.schema.hasTable('users_digimons')) ? 'users_digimons' : 'user_digimons';

        const describe = await trx.raw(`DESCRIBE ${table}`);
        const descRows = Array.isArray(describe) ? (describe[0] || []) : (describe || []);
        const colNames = (descRows || []).map(r => r.Field).filter(Boolean);
        const pick = (candidates) => candidates.find(c => colNames.includes(c)) || null;

        const userIdCol = pick(['user_id', 'usuario_id', 'id_usuario', 'users_id', 'id_user']) || 'user_id';
        const digiIdCol = pick(['digidex_id', 'digimon_id', 'id_digidex', 'id_digimon', 'species_id']) || 'digidex_id';
        const mainCol = pick(['is_main', 'principal', 'is_principal']) || 'is_main';

        const [existing] = await trx(table).count('id as count').where(userIdCol, userId);
        const isFirst = Number(existing?.count || 0) === 0;

        const row = {
          [userIdCol]: userId,
          [digiIdCol]: reward.digimon_id
        };

        if (colNames.includes('nickname')) row.nickname = digimon.name;
        if (colNames.includes('level')) row.level = 1;
        if (colNames.includes('exp')) row.exp = 0;
        if (colNames.includes('current_exp')) row.current_exp = 0;
        if (colNames.includes('max_exp')) row.max_exp = 100;
        if (colNames.includes('current_hp')) row.current_hp = digimon.base_hp;
        if (colNames.includes('max_hp')) row.max_hp = digimon.base_hp;
        if (colNames.includes('attack')) row.attack = digimon.base_attack;
        if (colNames.includes('defense')) row.defense = digimon.base_defense;
        if (colNames.includes('attack_speed')) row.attack_speed = digimon.base_attack_speed || 2.0;
        if (colNames.includes(mainCol)) row[mainCol] = isFirst ? 1 : 0;

        await trx(table).insert(row);
      }
    }

    await trx('user_quests')
      .where('id', userQuest.id)
      .update({ status: 'CLAIMED' });

    await trx.commit();
    res.json({ message: 'Rewards claimed successfully' });
  } catch (error) {
    await trx.rollback();
    console.error('Error claiming rewards:', error);
    res.status(500).json({ message: 'Error claiming rewards' });
  }
};

// Admin: Create Campaign
exports.createCampaign = async (req, res) => {
  const { title, description, order } = req.body;
  try {
    const [id] = await knex('campaigns').insert({
      title,
      description,
      order,
      is_active: true
    });
    res.status(201).json({ message: 'Campaign created', id });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Error creating campaign' });
  }
};

// Admin: Update Campaign
exports.updateCampaign = async (req, res) => {
    const { id } = req.params;
    const { title, description, order, is_active } = req.body;
    try {
      await knex('campaigns').where('id', id).update({
        title, description, order, is_active: is_active !== undefined ? is_active : true
      });
      res.json({ message: 'Campaign updated' });
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Error updating campaign' });
    }
  };

// Admin: Create Quest
exports.createQuest = async (req, res) => {
  const { campaign_id, title, description, npc_digimon_id, order, objectives, rewards } = req.body;
  
  const trx = await knex.transaction();
  try {
    const [questId] = await trx('quests').insert({
      campaign_id,
      title,
      description,
      npc_digimon_id: npc_digimon_id || null,
      order
    });

    if (objectives && objectives.length > 0) {
      const objsToInsert = objectives.map(obj => ({
        quest_id: questId,
        type: obj.type,
        target_item_id: obj.target_item_id || null,
        target_enemy_id: obj.target_enemy_id || null,
        quantity_required: obj.quantity_required,
        description: obj.description
      }));
      await trx('quest_objectives').insert(objsToInsert);
    }

    if (rewards && rewards.length > 0) {
      const rewardsToInsert = rewards.map(rw => ({
        quest_id: questId,
        type: rw.type,
        item_id: rw.item_id || null,
        digimon_id: rw.digimon_id || null,
        quantity: rw.quantity
      }));
      await trx('quest_rewards').insert(rewardsToInsert);
    }

    await trx.commit();
    res.status(201).json({ message: 'Quest created', id: questId });
  } catch (error) {
    await trx.rollback();
    console.error('Error creating quest:', error);
    res.status(500).json({ message: 'Error creating quest' });
  }
};

// Admin: Update Quest
exports.updateQuest = async (req, res) => {
    const { id } = req.params;
    const { campaign_id, title, description, npc_digimon_id, order, objectives, rewards } = req.body;
    
    const trx = await knex.transaction();
    try {
      await trx('quests').where('id', id).update({
        campaign_id, title, description, npc_digimon_id: npc_digimon_id || null, order
      });
  
      // Replace objectives/rewards (simplest strategy: delete all and insert new)
      if (objectives) {
          await trx('quest_objectives').where('quest_id', id).del();
          if (objectives.length > 0) {
              const objsToInsert = objectives.map(obj => ({
                  quest_id: id,
                  type: obj.type,
                  target_item_id: obj.target_item_id || null,
                  target_enemy_id: obj.target_enemy_id || null,
                  quantity_required: obj.quantity_required,
                  description: obj.description
              }));
              await trx('quest_objectives').insert(objsToInsert);
          }
      }
  
      if (rewards) {
          await trx('quest_rewards').where('quest_id', id).del();
          if (rewards.length > 0) {
              const rewardsToInsert = rewards.map(rw => ({
                  quest_id: id,
                  type: rw.type,
                  item_id: rw.item_id || null,
                  digimon_id: rw.digimon_id || null,
                  quantity: rw.quantity
              }));
              await trx('quest_rewards').insert(rewardsToInsert);
          }
      }
  
      await trx.commit();
      res.json({ message: 'Quest updated' });
    } catch (error) {
      await trx.rollback();
      console.error('Error updating quest:', error);
      res.status(500).json({ message: 'Error updating quest' });
    }
  };
