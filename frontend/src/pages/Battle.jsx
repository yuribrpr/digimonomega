import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  Zap,
  Skull,
  Swords,
  Map,
  Sparkles,
  Shield,
  Heart,
  Trophy,
  Play,
  Pause,
  Loader2,
  XCircle,
  AlertCircle,
  Backpack,
  ScrollText,
  CheckCircle2,
  Circle
} from 'lucide-react';
import GlobalTooltip from '@/components/GlobalTooltip';
import api from '../services/api';
import { QuestDetailDialog } from './Quests';




function QuestTracker({ quests, onSelectQuest, className = "", contentClassName = "" }) {
    const API_URL = api.defaults.baseURL;

    return (
        <Card className={`bg-slate-950/55 border-white/10 backdrop-blur-md shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] ${className}`}>
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-yellow-500">
                    <ScrollText className="w-4 h-4" /> Missões
                </CardTitle>
            </CardHeader>
            <CardContent className={`px-3 pb-3 ${contentClassName}`}>
                {(!quests || quests.length === 0) ? (
                    <div className="text-xs text-slate-500 text-center py-4 italic">
                        Nenhuma missão em andamento.
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                      {quests.map((q) => {
                        const objectives = q.objectives || [];
                        const completed = objectives.filter(obj => (q.progress?.[obj.id] || 0) >= obj.quantity_required).length;
                        const total = objectives.length;
                        const primaryObjective = objectives[0] || null;
                        const primaryCurrent = primaryObjective ? (q.progress?.[primaryObjective.id] || 0) : 0;
                        const primaryRequired = primaryObjective ? primaryObjective.quantity_required : 0;
                        const primarySuffix = primaryObjective
                          ? (primaryObjective.target_name || (primaryObjective.type === 'COLLECT_ITEM' ? 'Item' : 'Inimigo'))
                          : '';
                        const progressLabel = total === 1 && primaryObjective
                          ? `(${primaryCurrent}/${primaryRequired}) ${primarySuffix}`
                          : `(${completed}/${total}) objetivos`;
                        const totalRequired = objectives.reduce((sum, obj) => sum + Number(obj.quantity_required || 0), 0);
                        const totalCurrent = objectives.reduce((sum, obj) => {
                          const current = Number(q.progress?.[obj.id] || 0);
                          const required = Number(obj.quantity_required || 0);
                          return sum + Math.min(current, required);
                        }, 0);
                        const completionPercent = totalRequired > 0 ? Math.round((totalCurrent / totalRequired) * 100) : (total > 0 ? Math.round((completed / total) * 100) : 0);

                        return (
                          <div
                            key={q.id}
                            className="flex items-start gap-2 px-2 py-2 -mx-2 cursor-pointer transition-colors hover:bg-white/5 group"
                            onClick={() => (onSelectQuest ? onSelectQuest(q) : window.open('/quests', '_blank'))}
                          >
                            <div className={`mt-1 h-1.5 w-1.5 rounded-full ${completed === total && total > 0 ? 'bg-green-400' : 'bg-yellow-400/80'}`} />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[12px] font-semibold text-slate-100 truncate group-hover:text-yellow-300 transition-colors">
                                  {q.title}
                                </div>
                                <span className="shrink-0 text-[10px] font-semibold text-slate-200/80 tabular-nums">
                                  {completionPercent}%
                                </span>
                              </div>
                              {q.description ? (
                                <div className="max-h-10 overflow-y-auto pr-1 text-[10px] text-slate-400/90 scrollbar-thin">
                                  {q.description}
                                </div>
                              ) : null}
                              <div className="space-y-0.5 text-[11px] text-slate-200/80">
                                {objectives.length === 0 ? (
                                  <div className="text-slate-400/80">- Sem objetivos</div>
                                ) : (
                                  objectives.map((obj) => {
                                    const current = q.progress?.[obj.id] || 0;
                                    const label = obj.description || obj.target_name || (obj.type === 'COLLECT_ITEM' ? 'Item' : 'Inimigo');
                                    return (
                                      <div key={obj.id} className="flex items-center gap-1 min-w-0">
                                        <span className="text-slate-500">-</span>
                                        <span className="tabular-nums">({current}/{obj.quantity_required})</span>
                                        <span className="truncate">{label}</span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                            <span className="sr-only">{progressLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function Battle() {
  const navigate = useNavigate();
  const [battle, setBattle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingBattleData, setIsFetchingBattleData] = useState(false);
  const [isFetchingEnemyData, setIsFetchingEnemyData] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winInteractionReady, setWinInteractionReady] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  
  const [activeQuests, setActiveQuests] = useState([]);
  const [selectedQuestForDetails, setSelectedQuestForDetails] = useState(null);
  const [questCompletionQueue, setQuestCompletionQueue] = useState([]);
  const [activeQuestCompletion, setActiveQuestCompletion] = useState(null);
  const [showQuestCompletionDialog, setShowQuestCompletionDialog] = useState(false);
  const prevActiveQuestsRef = useRef([]);

  const fetchActiveQuests = async ({ detectCompletion = false } = {}) => {
    try {
        const prev = prevActiveQuestsRef.current || [];
        const res = await api.get('/api/quests/active');
        const next = res.data || [];
        const nextIds = new Set(next.map(x => x.id));
        const newlyCompleted = detectCompletion && prev.length > 0
          ? prev.filter(q => !nextIds.has(q.id))
          : [];
        prevActiveQuestsRef.current = next;
        setActiveQuests(next);
        return newlyCompleted;
    } catch (error) {
        console.error('Error fetching active quests:', error);
        return [];
    }
  };

  useEffect(() => {
    fetchActiveQuests({ detectCompletion: false });
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [healCooldownUntil, setHealCooldownUntil] = useState(0);
  const [healCooldownMs, setHealCooldownMs] = useState(0);
  const [fleeCooldownUntil, setFleeCooldownUntil] = useState(0);
  const [fleeCooldownMs, setFleeCooldownMs] = useState(0);
  const [showNoItemsModal, setShowNoItemsModal] = useState(false);
  // Animation states: 'idle', 'player-attack', 'enemy-hit', 'enemy-attack', 'player-hit'
  const [animState, setAnimState] = useState('idle');
  const [showImpact, setShowImpact] = useState(null); // 'player' or 'enemy'
  
  // New States for Cooldown System
  const [playerCooldown, setPlayerCooldown] = useState(0); // Current cooldown in ms
  const [playerMaxCooldown, setPlayerMaxCooldown] = useState(2000); // Max cooldown based on speed
  const [canAttack, setCanAttack] = useState(false); // If player can click attack
  const [enemyCooldown, setEnemyCooldown] = useState(0);
  const [enemyMaxCooldown, setEnemyMaxCooldown] = useState(2000);
  const [hasPlayerAttacked, setHasPlayerAttacked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [usingItemId, setUsingItemId] = useState(null);
  const [usedItemIds, setUsedItemIds] = useState(new Set());
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [showMobileLog, setShowMobileLog] = useState(false);
  const [showMobileQuests, setShowMobileQuests] = useState(false);

  const [damageIndicators, setDamageIndicators] = useState([]);
  const [mapDetails, setMapDetails] = useState(null);
  const [lastCrit, setLastCrit] = useState(false);
  const audioCtxRef = useRef(null);

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = Ctx ? new Ctx() : null;
    }
    return audioCtxRef.current;
  };
  const playAttackSound = (crit = false) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(crit ? 620 : 360, t0);
    gain1.gain.setValueAtTime(0.0001, t0);
    gain1.gain.exponentialRampToValueAtTime(0.22, t0 + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.2);
    if (crit) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(420, t0);
      osc2.frequency.exponentialRampToValueAtTime(680, t0 + 0.15);
      gain2.gain.setValueAtTime(0.0001, t0);
      gain2.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(t0);
      osc2.stop(t0 + 0.18);
    }
  };

  const playHealSound = () => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    // Layer 1: High chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, t0);
    osc1.frequency.exponentialRampToValueAtTime(1200, t0 + 0.3);
    gain1.gain.setValueAtTime(0.0001, t0);
    gain1.gain.linearRampToValueAtTime(0.1, t0 + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.5);
    
    // Layer 2: Low warm pad
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(300, t0);
    osc2.frequency.linearRampToValueAtTime(400, t0 + 0.4);
    gain2.gain.setValueAtTime(0.0001, t0);
    gain2.gain.linearRampToValueAtTime(0.05, t0 + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t0 + 0.6);
  };

  const logContainerRef = useRef(null);
  // Replicating basic auth check if needed, or just using localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mapId = searchParams.get('mapId');

  const formatLog = (logEntry) => {
    if (typeof logEntry === 'string') return logEntry;
    // Se for objeto ou array, tenta extrair mensagem
    return String(logEntry); 
  };

  const addDamageIndicator = (value, target, crit = false, text = null, type = 'damage') => {
      const id = Date.now() + Math.random();
      setDamageIndicators(prev => [...prev, { id, value, target, crit, text, type }]);
      setTimeout(() => {
          setDamageIndicators(prev => prev.filter(i => i.id !== id));
      }, 1000);
  };

  useEffect(() => {
    if (mapId) {
        api.get(`/api/maps/${mapId}`)
            .then(res => setMapDetails(res.data))
            .catch(err => console.error('Erro ao carregar mapa:', err));
    }
  }, [mapId]);
  // Stop auto-battle if battle ends or component unmounts (cleanup)
  // Removed auto-battle effect
  const startBattle = async (isEntry = false) => {
    if (!user?.id) return;
    setLoading(true);
    setIsFetchingBattleData(true);
    setIsFetchingEnemyData(false);
    setBattle(null);
    setLogs([]);
    setPaused(false);
    try {
      const payload = { user_id: user.id };
      if (mapId) payload.map_id = mapId;
      if (isEntry) payload.entry = true;
      const res = await api.post('/api/battles', payload);
      const b = res.data;
      setBattle(b);
      await fetchActiveQuests({ detectCompletion: false });
      setShowWinModal(false);
      setRewards(null);
      setLevelUpInfo(null);
      setHealCooldownUntil(0);
      setHealCooldownMs(0);
      setFleeCooldownUntil(0);
      setFleeCooldownMs(0);
      setAnimState('idle');
      setHasPlayerAttacked(false);
      
      // Initialize Cooldowns
      // Prefer using the value returned by backend in `b.user` which should be effSpd
      const pSpeed = Number(b.user.attack_speed) || 2.0;
      const eSpeed = Number(b.enemy.attack_speed) || 2.0;
      const pCd = pSpeed * 1000;
      const eCd = eSpeed * 1000;

      console.log('Battle Init Speed:', { pSpeed, eSpeed });

      setPlayerMaxCooldown(pCd);
      setEnemyMaxCooldown(eCd);
      setPlayerCooldown(0); // Start ready (cooldown 0)
      setEnemyCooldown(0); // Enemy starts ready (cooldown 0)
      setCanAttack(true); // Enable button immediately
      return res.data;
    } catch (error) {
      console.error('Erro ao iniciar batalha:', error);
      return null;
    } finally {
      setLoading(false);
      setIsFetchingBattleData(false);
    }
  };
  useEffect(() => {
    startBattle(true);
  }, []);
  // Main Loop for Cooldowns
  useEffect(() => {
    if (!battle || battle.win || battle.user.hp <= 0 || paused) return;

    const interval = 50; // Update every 50ms
    const timer = setInterval(() => {
        // Player Cooldown
        setPlayerCooldown(prev => {
            const next = Math.max(0, prev - interval);
            if (next === 0 && !canAttack && animState === 'idle') {
                setCanAttack(true);
            }
            return next;
        });

        // Enemy Cooldown & Attack Logic
        setEnemyCooldown(prev => {
            const next = Math.max(0, prev - interval);
            // If enemy ready and player not attacking (to avoid overlapping anims mess)
            // Added check: !canAttack is false means player CAN attack. 
            // If player CAN attack, we shouldn't block enemy unless player IS attacking.
            // But if player clicks right now, we want priority.
            // So we strictly check animState.
            // Also checking hasPlayerAttacked to prevent auto-start
            if (next === 0 && animState === 'idle' && battle.user.hp > 0 && !battle.win && hasPlayerAttacked) {
                // Double check if player is currently acting to enforce priority
                if (!isPlayerAttacking && animState === 'idle') {
                    executeEnemyAttackReal();
                    return enemyMaxCooldown; // Reset enemy CD
                } else {
                     // Player is attacking, so we trigger Blocked logic here too if cooldown is ready
                     addDamageIndicator(0, 'enemy', false, 'Blocked!', 'blocked');
                     // Reset cooldown partially? Or full reset? 
                     // User said "cancel attack". So full reset.
                     return enemyMaxCooldown; 
                }
            }
            return next;
        });

    }, interval);

    return () => clearInterval(timer);
  }, [battle, animState, canAttack, playerMaxCooldown, enemyMaxCooldown, hasPlayerAttacked, paused]);

  // Execute Enemy Attack (Client-side trigger for server calculation)
  const executeEnemyAttackReal = async () => {
      // Priority Check: If player is currently attacking (animState is 'player-attack' or 'enemy-hit'), 
      // do NOT execute enemy attack yet. Wait for next cycle.
      if (animState === 'player-attack' || animState === 'enemy-hit' || isPlayerAttacking) {
          // Only show Blocked if we haven't shown it recently to avoid spam
          addDamageIndicator(0, 'enemy', false, 'Blocked!', 'blocked');
          return;
      }

      try {
          const res = await api.post(`/api/battles/${battle.id}/attack?actor=enemy`);
          await triggerSequence(res.data, 'enemy');
      } catch (e) {
          console.error("Enemy attack failed", e);
      }
  };

  const triggerSequence = async (newData, actor = 'both') => {
    const logArray = newData.log || [];
    const userDmgLine = logArray.find(l => l.includes('Você causou'));
    const enemyDmgLine = logArray.find(l => l.includes('Você tomou'));
    const userDmg = userDmgLine ? parseInt(userDmgLine.match(/\d+/)?.[0] || '0') : 0;
    const enemyDmg = enemyDmgLine ? parseInt(enemyDmgLine.match(/\d+/)?.[0] || '0') : 0;
    
    const attackDuration = 300; 
    const hitDuration = 400;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    if (actor === 'player' || actor === 'both') {
        // Player Attack Animation
        setAnimState('player-attack');
        await delay(attackDuration);
        
        setAnimState('enemy-hit');
        setShowImpact('enemy');
        setLastCrit(!!newData.crit);
        playAttackSound(!!newData.crit);
        if (userDmg > 0) addDamageIndicator(userDmg, 'enemy', !!newData.crit);
        await delay(hitDuration);
        
        setShowImpact(null);
        setLastCrit(false);
        setAnimState('idle');
    }

    // Update Data immediately
    setBattle(prev => ({ ...prev, ...newData }));
    
    // Ensure cooldowns are updated if speed changed (unlikely mid-battle but safe)
    if (newData.user && newData.user.attack_speed) {
        const newSpeed = Number(newData.user.attack_speed);
        if (newSpeed > 0) setPlayerMaxCooldown(newSpeed * 1000);
    }
    
    const formattedLog = formatLog(newData.log);
    if (formattedLog) setLogs(prev => [formattedLog, ...prev]);

    // Check Win/Defeat
    if (newData.win) {
         if (battle?.user && newData.user) {
             const prevLevel = Number(battle.user.level || 0);
             const newLevel = Number(newData.user.level || prevLevel);
             const leveledUp = newLevel > prevLevel;
             const hpGain = Number(newData.user.max_hp || 0) - Number(battle.user.max_hp || 0);
             const atkGain = Number(newData.user.attack || 0) - Number(battle.user.attack || 0);
             const defGain = Number(newData.user.defense || 0) - Number(battle.user.defense || 0);
             setLevelUpInfo({ leveledUp, prevLevel, newLevel, hpGain, atkGain, defGain });
         }
         setRewards(newData.rewards);
         const newlyCompleted = await fetchActiveQuests({ detectCompletion: true });
         if (newlyCompleted.length > 0) {
           setActiveQuestCompletion(newlyCompleted[0]);
           setQuestCompletionQueue(newlyCompleted.slice(1));
           setShowQuestCompletionDialog(true);
           setShowWinModal(false);
        } else {
          setShowWinModal(true);
          setWinInteractionReady(false);
          setTimeout(() => setWinInteractionReady(true), 500);
        }
         setAnimState('idle');
         return;
    }
    if (newData.user.hp <= 0) {
        // Defeat
    }

    if ((actor === 'enemy' || actor === 'both') && !newData.win && newData.user.hp > 0) {
        // Enemy Attack Animation
        if (actor === 'both') await delay(200);

        setAnimState('enemy-attack');
        await delay(attackDuration);

        setAnimState('player-hit');
        setShowImpact('player');
        if (enemyDmg > 0) addDamageIndicator(enemyDmg, 'player');
        await delay(hitDuration);
        
        setShowImpact(null);
        setAnimState('idle');
    }
  };

  const executeAttack = async () => {
    if (!battle || loading || !canAttack) return;
    setCanAttack(false); // Disable button immediately
    setPlayerCooldown(playerMaxCooldown); // Reset Cooldown
    
    // Priority: If enemy is about to attack or attacking, we override/interrupt if possible visually, 
    // but logic-wise we just proceed. However, to avoid visual clutter, if enemy is mid-animation, 
    // we might want to wait? No, user said "priorize o ataque do usuario".
    // So if user clicks, we run immediately.
    
    // If enemy cooldown is also 0 (or very close), we should force enemy reset and show blocked
    if (enemyCooldown <= 100) { // 100ms grace window
        setEnemyCooldown(enemyMaxCooldown);
        addDamageIndicator(0, 'enemy', false, 'Blocked!', 'blocked');
    }

    try {
      // Modifying call to send actor=player
      const res = await api.post(`/api/battles/${battle.id}/attack?actor=player`);
      await triggerSequence(res.data, 'player');
      
      // Mark that player has attacked, allowing enemy to start attacking if they were waiting
      if (!hasPlayerAttacked) setHasPlayerAttacked(true);
    } catch (error) {
      console.error('Erro ao atacar:', error);
    }
  };
  const onHeal = async () => {
    if (!battle || healCooldownMs > 0) return;
    setLoading(true);
    try {
      const res = await api.post(`/api/battles/${battle.id}/heal`);
      setBattle(prev => ({ 
        ...prev, 
        user: { ...prev.user, hp: res.data.user.hp, max_hp: res.data.user.max_hp } 
      }));
      setLogs(prev => [formatLog(res.data.log), ...prev]);
      setHealCooldownUntil(Date.now() + 2500);
    } catch (error) {
      console.error('Erro ao curar:', error);
    }
    setLoading(false);
  };
  const onFlee = async () => {
    if (!battle || fleeCooldownMs > 0) return;
    setLoading(true);
    setIsFetchingEnemyData(true);
    setBattle(prev => (prev ? { ...prev, enemy: null } : prev));
    try {
      const payload = {};
      if (mapId) payload.map_id = mapId;
      const res = await api.post(`/api/battles/${battle.id}/flee`, payload);
      setBattle(prev => ({ ...prev, enemy: res.data.enemy }));
      setLogs(prev => [formatLog(res.data.log), ...prev]);
      setFleeCooldownUntil(Date.now() + 1500);
    } catch (error) {
      console.error('Erro ao fugir:', error);
    }
    setLoading(false);
    setIsFetchingEnemyData(false);
  };

  const fetchInventory = async () => {
       if (!user?.id) return;
       try {
           const res = await api.get(`/api/items/user/${user.id}`);
           const hpConsumables = (res.data || []).filter(i => i.type === 'consumable' && i.effect_target === 'hp')
             .sort((a, b) => a.name.localeCompare(b.name));
           setInventory(hpConsumables);
       } catch (error) {
           console.error('Erro ao buscar inventário:', error);
       }
   };

  const handleOpenBag = () => {
      fetchInventory();
      setShowBag(true);
  };

  const handleCloseBag = () => {
      setShowBag(false);
  };

  async function handleUseItem(item) {
      try {
          const res = await api.post('/api/items/use', {
              userId: user.id,
              itemId: item.item_id,
              quantity: 1
          });

          if (res.data.success) {
              playHealSound();
              // Update inventory locally
              setInventory(prev => prev.map(i => 
                  i.inventory_id === item.inventory_id 
                      ? { ...i, quantity: res.data.remaining } 
                      : i
              ).filter(i => i.quantity > 0));

              // Update Battle State (HP)
              if (res.data.newCurrentHp !== undefined) {
                  setBattle(prev => ({
                      ...prev,
                      user: { ...prev.user, hp: res.data.newCurrentHp }
                  }));
                  // Show heal indicator
                  const healedAmount = res.data.newCurrentHp - battle.user.hp;
                  if (healedAmount > 0) {
                      addDamageIndicator(healedAmount, 'player', false, `+${healedAmount}`, 'heal');
                  }
              }

              // Log usage
              setLogs(prev => [res.data.message, ...prev]);
              return true; // Success signal for UI
          }
      } catch (error) {
          const status = error?.response?.status;
          const msg = error?.response?.data?.message || 'Erro ao usar item.';
          if (status !== 400) {
            console.error('Erro ao usar item:', error);
          }
          setLogs(prev => [msg, ...prev]);
          return false;
      }
  }

  async function handleUseItemWithFeedback(item) {
      if (usingItemId) return;
      const startedAt = Date.now();
      setUsingItemId(item.inventory_id);
      try {
        const success = await handleUseItem(item);
        if (success) {
            setUsedItemIds(prev => new Set(prev).add(item.inventory_id));
            setTimeout(() => {
                setUsedItemIds(prev => {
                    const next = new Set(prev);
                    next.delete(item.inventory_id);
                    return next;
                });
            }, 500);
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = 500 - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        setUsingItemId(null);
      }
  }

  useEffect(() => {
    setPaused(showBag || showWinModal || showQuestCompletionDialog || showNoItemsModal || !!selectedQuestForDetails);
  }, [selectedQuestForDetails, showBag, showNoItemsModal, showQuestCompletionDialog, showWinModal]);

  const continuingAfterWinRef = useRef(false);
  const handleContinueAfterWin = async () => {
    if (!winInteractionReady) return;
    if (continuingAfterWinRef.current) return;
    continuingAfterWinRef.current = true;
    if (mapDetails && mapDetails.require_item === 1 && mapDetails.consume_on_enter === 1 && Number(mapDetails.required_item_id)) {
      try {
        const res = await api.get(`/api/items/user/${user?.id}`);
        const inv = res.data || [];
        const hasItem = inv.some(x => Number(x.id) === Number(mapDetails.required_item_id) && Number(x.quantity) > 0);
        if (!hasItem) {
          setShowNoItemsModal(true);
          continuingAfterWinRef.current = false;
          return;
        }
      } catch (e) {
        console.error('Erro ao verificar inventário:', e);
      }
    }
    try {
      await startBattle(false);
    } finally {
      continuingAfterWinRef.current = false;
    }
  };

  const handleLeave = () => {
    if (!winInteractionReady) return;
    navigate('/exploration');
  };

  useEffect(() => {
    if (!showWinModal || showNoItemsModal) return;

    const onKeyDown = (e) => {
      if (e.defaultPrevented) return;
      if (e.repeat) return;

      const target = e.target;
      const tagName = target?.tagName ? String(target.tagName).toUpperCase() : '';
      const isTypingTarget = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable;
      if (isTypingTarget) return;

      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleContinueAfterWin();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleLeave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleContinueAfterWin, showNoItemsModal, showWinModal]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented) return;
      if (e.repeat) return;

      const target = e.target;
      const tagName = target?.tagName ? String(target.tagName).toUpperCase() : '';
      const isTypingTarget = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable;
      if (isTypingTarget) return;

      if (showBag) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleCloseBag();
          return;
        }

        const keyNum = Number.parseInt(e.key, 10);
        if (!Number.isFinite(keyNum) || keyNum < 1) return;
        const idx = keyNum - 1;
        const item = inventory[idx];
        if (!item) return;
        if (usingItemId) return;
        e.preventDefault();
        handleUseItemWithFeedback(item);
        return;
      }

      const hasBlockingDialog = showWinModal || showQuestCompletionDialog || showNoItemsModal || !!selectedQuestForDetails;
      if (hasBlockingDialog) return;
      if (!battle || battle.win) return;

      if (e.key === '1') {
        e.preventDefault();
        executeAttack();
      } else if (e.key === '2') {
        e.preventDefault();
        handleOpenBag();
      } else if (e.key === '3') {
        e.preventDefault();
        onFlee();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [battle, executeAttack, handleCloseBag, handleOpenBag, handleUseItemWithFeedback, inventory, onFlee, selectedQuestForDetails, showBag, showNoItemsModal, showQuestCompletionDialog, showWinModal, usingItemId]);

  const myDigimon = battle?.user;
  const enemy = battle?.enemy;
  const showPlayerSkeleton = isFetchingBattleData;
  const showEnemySkeleton = isFetchingBattleData || isFetchingEnemyData;
  const isBoss = enemy?.difficulty === 'Boss';
  const playerDisplayName = myDigimon?.display_name || myDigimon?.nickname || myDigimon?.name;
  const enemyDisplayName = enemy?.display_name || enemy?.name;
  const mapMediaPath = mapDetails?.video_path || mapDetails?.image_path;
  const mapMediaUrl = mapMediaPath
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${String(mapMediaPath).replace(/\\/g, '/')}`
    : null;
  const isMapVideo = !!(mapMediaPath && String(mapMediaPath).toLowerCase().endsWith('.mp4'));
  const getAttributeBadgeMeta = (rawType) => {
    const t = String(rawType || 'unknown').toLowerCase();
    if (t === 'vaccine' || t === 'vacina') {
      return { label: 'Vacina', className: 'border-emerald-400/30 bg-emerald-500/20 text-emerald-100' };
    }
    if (t === 'data') {
      return { label: 'Data', className: 'border-sky-400/30 bg-sky-500/20 text-sky-100' };
    }
    if (t === 'virus' || t === 'vírus') {
      return { label: 'Virus', className: 'border-red-400/30 bg-red-500/20 text-red-100' };
    }
    return { label: 'Unknown', className: 'border-white/10 bg-black/45 text-slate-100' };
  };
  const calcPercent = (current, max) => {
    if (!max || max <= 0) return 100;
    const p = (current / max) * 100;
    return Math.min(Math.max(p, 0), 100);
  };
  const hpPercent = calcPercent(myDigimon?.hp, myDigimon?.max_hp);
  const enemyHpPercent = calcPercent(enemy?.hp, enemy?.max_hp);
  const xpPercent = calcPercent(myDigimon?.xp, myDigimon?.max_xp);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);

  // Helper styles for animations
  const getPlayerStyle = () => {
    if (animState === 'player-attack') return "translate-x-40 scale-110 z-20 transition-transform duration-300 ease-in";
    if (animState === 'player-hit') return "animate-shake text-red-500 brightness-150 saturate-0";
    return "transition-all duration-300";
  };
  const getEnemyStyle = () => {
    if (animState === 'enemy-attack') return "-translate-x-40 scale-110 z-20 transition-transform duration-300 ease-in";
    if (animState === 'enemy-hit') return "animate-shake text-red-500 brightness-150 saturate-0";
    return "transition-all duration-300";
  };

  useEffect(() => {
    // Sync boolean states with animState for inline styles
    if (animState === 'player-attack') {
        setIsPlayerAttacking(true);
        setTimeout(() => setIsPlayerAttacking(false), 300);
    } else if (animState === 'player-hit') {
        setIsPlayerHit(true);
        setTimeout(() => setIsPlayerHit(false), 500);
    } else if (animState === 'enemy-attack') {
        setIsEnemyAttacking(true);
        setTimeout(() => setIsEnemyAttacking(false), 300);
    } else if (animState === 'enemy-hit') {
        setIsEnemyHit(true);
        setTimeout(() => setIsEnemyHit(false), 500);
    }
  }, [animState]);

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const toInt = (v) => Math.floor(toNum(v));
  const normalizeStageLevel = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.floor(value) : null;
    const raw = String(value).trim();
    if (!raw) return null;
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) return Math.floor(asNumber);
    const key = raw.toLowerCase();
    if (key === 'rookie') return 1;
    if (key === 'champion') return 2;
    if (key === 'ultimate') return 3;
    if (key === 'mega') return 4;
    if (key === 'burst mode' || key === 'burst_mode' || key === 'burst') return 5;
    return null;
  };
  const resolveStageLevel = (digimon) => {
    const stage = normalizeStageLevel(
      digimon?.stage_level ??
      digimon?.base_level ??
      digimon?.stage ??
      digimon?.evolution_level ??
      (toInt(digimon?.level) <= 5 ? digimon?.level : null)
    );
    return stage;
  };
  const getStageScale = (stageLevel) => {
    const level = normalizeStageLevel(stageLevel);
    if (level === 2) return 1.2;
    if (level === 3) return 1.5;
    if (level === 4 || level === 5) return 1.8;
    return 1;
  };

  const playerStageScale = getStageScale(resolveStageLevel(myDigimon));
  const enemyStageScale = getStageScale(resolveStageLevel(enemy));
  const playerExtraAtk = toInt(myDigimon?.extra_attack);
  const playerExtraDef = toInt(myDigimon?.extra_defense);
  const playerExtraHp = toInt(myDigimon?.extra_hp);

  const playerTooltipContent = myDigimon ? (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-50 truncate">{playerDisplayName}</div>
          <div className="text-[10px] text-slate-300">Lv. {myDigimon?.level ?? '—'}</div>
        </div>
        {myDigimon?.type ? (
          <span className="shrink-0 rounded border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-100">
            {myDigimon.type}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-red-400" />
          <span className="text-slate-200">Vida</span>
          <span className="ml-auto font-mono text-slate-50">
            {toInt(myDigimon?.hp)}/{toInt(myDigimon?.max_hp)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-300" />
          <span className="text-slate-200">Vel.</span>
          <span className="ml-auto font-mono text-slate-50">{toNum(myDigimon?.attack_speed).toFixed(2)}s</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5 text-slate-200" />
          <span className="text-slate-200">Ataque</span>
          <span className="ml-auto flex items-baseline gap-1 font-mono">
            <span className="text-slate-50">{toInt(myDigimon?.attack)}</span>
            {playerExtraAtk ? <span className="text-cyan-300">(+{playerExtraAtk})</span> : null}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-slate-200" />
          <span className="text-slate-200">Defesa</span>
          <span className="ml-auto flex items-baseline gap-1 font-mono">
            <span className="text-slate-50">{toInt(myDigimon?.defense)}</span>
            {playerExtraDef ? <span className="text-cyan-300">(+{playerExtraDef})</span> : null}
          </span>
        </div>
      </div>

      {playerExtraHp ? (
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-slate-300">Vida extra</span>
          <span className="font-mono text-cyan-300">+{playerExtraHp}</span>
        </div>
      ) : null}
    </div>
  ) : null;

  const enemyTooltipContent = enemy ? (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-50 truncate">{enemyDisplayName}</div>
          <div className="text-[10px] text-slate-300">
            {enemy?.difficulty || 'Normal'}
          </div>
        </div>
        {enemy?.type ? (
          <span className="shrink-0 rounded border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-100">
            {enemy.type}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-red-400" />
          <span className="text-slate-200">Vida</span>
          <span className="ml-auto font-mono text-slate-50">
            {toInt(enemy?.hp)}/{toInt(enemy?.max_hp)}
          </span>
        </div>
        {enemy?.attack_speed ? (
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-slate-200">Vel.</span>
            <span className="ml-auto font-mono text-slate-50">{toNum(enemy?.attack_speed).toFixed(2)}s</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5 text-slate-200" />
          <span className="text-slate-200">Ataque</span>
          <span className="ml-auto font-mono text-slate-50">{toInt(enemy?.attack)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-slate-200" />
          <span className="text-slate-200">Defesa</span>
          <span className="ml-auto font-mono text-slate-50">{toInt(enemy?.defense)}</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[100] w-full h-[100dvh] md:static md:z-auto md:container md:mx-auto md:py-8 md:space-y-6 md:h-auto overflow-hidden md:overflow-visible flex flex-col justify-center bg-slate-950 md:bg-transparent">
      {/* Custom Keyframes for Shake Effect & MMO Visuals */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        @keyframes flash {
            0% { opacity: 0; transform: scale(0.5); filter: brightness(2); }
            20% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        .animate-impact {
            animation: flash 0.4s ease-out forwards;
        }
        @keyframes damage-pop {
            0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
            15% { transform: translate(-50%, -20px) scale(1.4); opacity: 1; }
            100% { transform: translate(-50%, -80px) scale(1); opacity: 0; }
        }
        .animate-damage {
            animation: damage-pop 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        @keyframes heal-float {
            0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
            20% { transform: translate(-50%, -15px) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
        }
        .animate-heal {
            animation: heal-float 1.2s ease-out forwards;
        }
        @keyframes slash {
            0% { clip-path: polygon(0 0, 0 0, 0 0, 0 0); opacity: 1; }
            20% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
            100% { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); opacity: 0; }
        }
        @keyframes slide-in-right {
            0% { transform: translateX(100%) scale(0.8); opacity: 0; }
            100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        .animate-slide-in-right {
             animation: slide-in-right 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
         }
      `}</style>
      <div className="w-full h-full md:h-auto">
        <Card className="border-0 md:border shadow-none rounded-none md:rounded-2xl overflow-hidden bg-slate-950 text-slate-100 h-full md:h-auto w-full">
          <CardContent className="p-0 h-full md:h-auto">
            <div className="relative h-full md:h-[640px] bg-slate-950 w-full overflow-hidden px-0 pb-0 md:px-24 md:pb-10">
              {mapMediaUrl ? (
                isMapVideo ? (
                  <video
                    className="absolute inset-0 z-0 h-full w-full object-cover"
                    src={mapMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                    style={{ backgroundImage: `url(${mapMediaUrl})` }}
                  />
                )
              ) : null}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
              <div className="absolute inset-0 z-10 [background:radial-gradient(70%_55%_at_50%_45%,rgba(255,255,255,0.06),rgba(0,0,0,0.55))]" />

              <div className="absolute left-2 right-2 top-2 z-40 md:left-6 md:right-6 md:top-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-2 shadow-[0_14px_40px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md md:border-transparent md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold tracking-tight text-slate-100 shadow-[0_14px_40px_-22px_rgba(0,0,0,0.95)] backdrop-blur-md md:shadow-none">
                        <Map className="h-4 w-4 text-slate-200" />
                        <span className="max-w-[60vw] truncate">{mapDetails ? mapDetails.name : 'Mapa de Batalha'}</span>
                        {paused ? (
                          <span className="ml-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-[0.24em] text-slate-200">
                            PAUSADO
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div />
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-2 md:hidden">
                      <Button
                        size={isMobile ? "icon" : "sm"}
                        variant="secondary"
                        className={`${isMobile ? 'h-10 w-10 rounded-full bg-slate-950/60 border border-white/10' : 'h-8 rounded-full border border-white/10 bg-slate-950/60 text-slate-100 hover:bg-slate-950/75'}`}
                        onClick={() => {
                          setShowMobileLog((v) => !v);
                          setShowMobileQuests(false);
                        }}
                      >
                        <Activity className={isMobile ? "h-5 w-5 text-slate-200" : "mr-2 h-3.5 w-3.5"} />
                        {!isMobile && "Histórico"}
                      </Button>
                      <Button
                        size={isMobile ? "icon" : "sm"}
                        variant="secondary"
                        className={`${isMobile ? 'h-10 w-10 rounded-full bg-slate-950/60 border border-white/10' : 'h-8 rounded-full border border-white/10 bg-slate-950/60 text-slate-100 hover:bg-slate-950/75'}`}
                        onClick={() => {
                          setShowMobileQuests((v) => !v);
                          setShowMobileLog(false);
                        }}
                      >
                        <ScrollText className={isMobile ? "h-5 w-5 text-slate-200" : "mr-2 h-3.5 w-3.5"} />
                        {!isMobile && "Missões"}
                      </Button>
                    </div>
                  <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between md:gap-2">
                    <div className="relative w-full md:w-[40%]">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md">
                        {showPlayerSkeleton ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-32 bg-white/10" />
                              <Skeleton className="h-4 w-14 rounded-full bg-white/10" />
                            </div>
                            <Skeleton className="h-2.5 w-full rounded-full bg-white/10" />
                            <Skeleton className="h-1.5 w-[86%] rounded-full bg-white/10" />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="min-w-0 truncate text-xs font-semibold text-slate-100">
                                {playerDisplayName || '—'}
                              </span>
                              {myDigimon?.level !== undefined && myDigimon?.level !== null ? (
                                <span className="shrink-0 text-[10px] font-semibold text-slate-200/80">
                                  (Lv. {myDigimon.level})
                                </span>
                              ) : null}
                              {(() => {
                                const meta = getAttributeBadgeMeta(myDigimon?.type ?? myDigimon?.attribute);
                                return (
                                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                                    {meta.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div
                              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(hpPercent)}
                            >
                              <div className="h-full bg-gradient-to-r from-red-500 to-red-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]" style={{ width: `${hpPercent}%` }} />
                            </div>
                            <div
                              className="mt-1 h-1.5 w-[86%] overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(xpPercent)}
                            >
                              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35)]" style={{ width: `${xpPercent}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`${showMobileLog ? 'block' : 'hidden'} mt-3 w-full max-w-[calc(100vw-16px)] md:absolute md:left-0 md:top-full md:mt-2 md:w-[320px] md:block`}>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] backdrop-blur-md overflow-hidden">
                          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-slate-200">
                              <Activity className="h-4 w-4 text-slate-200" />
                              HISTÓRICO
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 rounded-full border border-white/10 bg-slate-950/60 text-slate-100 hover:bg-slate-950/75"
                              onClick={() => setIsLogExpanded((v) => !v)}
                            >
                              {isLogExpanded ? 'Menos' : 'Mais'}
                            </Button>
                          </div>
                          <div
                            ref={logContainerRef}
                            className={`px-3 py-2.5 font-mono text-xs overflow-y-auto ${isLogExpanded ? 'max-h-[220px]' : 'max-h-[120px]'}`}
                          >
                            <div className="space-y-1.5">
                              {logs.length === 0 ? (
                                <div className="text-slate-400 text-xs">Aguardando ações...</div>
                              ) : (
                                logs.map((l, i) => (
                                  <div key={i} className="flex gap-3 text-slate-200/90 text-xs animate-in fade-in slide-in-from-top-1 py-1 border-b border-white/10 last:border-0">
                                    <span className="text-slate-400 min-w-[24px] text-right font-mono opacity-60">{String(logs.length - i).padStart(2, '0')}</span>
                                    <span className="min-w-0 break-words">{l}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 md:pt-2">
                      <div className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[10px] font-bold tracking-[0.32em] text-slate-200 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md">
                        VS
                      </div>
                    </div>

                    <div className="relative w-full md:w-[40%]">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-right shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md">
                        {showEnemySkeleton ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-end gap-2">
                              <Skeleton className="h-4 w-20 bg-white/10" />
                              <Skeleton className="h-4 w-12 rounded-full bg-white/10" />
                            </div>
                            <Skeleton className="h-2.5 w-full rounded-full bg-white/10" />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-end gap-2">
                              {isBoss ? (
                                <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-600/25 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                                  BOSS
                                </span>
                              ) : null}
                              <span className="min-w-0 truncate text-xs font-semibold text-slate-100">
                                {enemyDisplayName || '—'}
                              </span>
                              {(() => {
                                const meta = getAttributeBadgeMeta(enemy?.type ?? enemy?.attribute);
                                return (
                                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                                    {meta.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div
                              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(enemyHpPercent)}
                            >
                              <div className="ml-auto h-full bg-gradient-to-l from-red-500 to-red-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]" style={{ width: `${enemyHpPercent}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`${showMobileQuests ? 'block' : 'hidden'} mt-3 w-full max-w-[calc(100vw-16px)] md:absolute md:right-0 md:top-full md:mt-2 md:w-[280px] md:block`}>
                        <QuestTracker
                          quests={activeQuests}
                          onSelectQuest={setSelectedQuestForDetails}
                          className="w-full md:bg-slate-950/55 md:opacity-100"
                          contentClassName="max-h-[180px] overflow-auto pr-1 scrollbar-thin"
                        />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

{/* Modal de Vitória removido para imersão */}
            {/* Player Side */}
            <div className={`absolute bottom-[140px] left-4 z-30 flex flex-col items-center gap-2 md:bottom-[80px] md:left-[25%] md:-ml-20 ${getPlayerStyle()}`}>
               <div className="relative">
                  {/* Impact Effect Overlay */}
                  {showImpact === 'player' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center animate-impact pointer-events-none">
                        <div className="w-[140%] h-[6px] bg-red-100 shadow-[0_0_20px_rgba(239,68,68,1)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 animate-[slash_0.2s_ease-out_forwards]" />
                        <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay rounded-full" />
                    </div>
                  )}
                  {showPlayerSkeleton ? (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
                    </div>
                  ) : myDigimon ? (
                    <GlobalTooltip content={playerTooltipContent}>
                      <div
                        className="flex items-center justify-center"
                        style={{ 
                            width: `${(isMobile ? 100 : 160) * playerStageScale}px`, 
                            height: `${(isMobile ? 100 : 160) * playerStageScale}px` 
                        }}
                      >
                        {myDigimon?.sprite_path ? (
                          <img
                            src={myDigimon.sprite_path.startsWith('http') ? myDigimon.sprite_path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${myDigimon.sprite_path}`}
                            alt={myDigimon?.name}
                            className="max-h-full max-w-full object-contain"
                            style={{
                              filter: isPlayerAttacking ? 'brightness(1.5)' : (isPlayerHit ? 'brightness(0.5) sepia(1) hue-rotate(-50deg)' : 'none'),
                              transform: `${isPlayerAttacking ? 'translateX(50px)' : (isPlayerHit ? 'translateX(-20px)' : 'translateX(0)')} scale(${playerStageScale}) scaleX(-1)`,
                              transition: 'transform 0.2s, filter 0.2s'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </GlobalTooltip>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {/* Damage Indicators */}
                  {damageIndicators.filter(i => i.target === 'player').map(i => (
                    <div key={i.id} className={`absolute top-0 left-1/2 -translate-x-1/2 text-4xl font-black z-50 pointer-events-none whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${i.type === 'heal' ? 'text-emerald-400 animate-heal' : 'text-red-500 animate-damage'}`}>
                        {i.type === 'heal' && <Heart className="inline-block w-6 h-6 mr-1 fill-current" />}
                        {i.text ? i.text : `-${i.value}${i.crit ? '!' : ''}`}
                    </div>
                  ))}
               </div>
            </div>
            {/* VS Divider - Fades out during combat action */}
            <div className={`absolute bottom-[180px] left-1/2 z-20 h-40 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-800 to-transparent transition-opacity duration-300 md:bottom-[165px] ${animState !== 'idle' ? 'opacity-0' : 'opacity-100'}`}></div>
            {/* Enemy Side */}
            <div className={`absolute bottom-[220px] right-4 left-auto z-20 flex flex-col items-center gap-2 md:z-30 md:bottom-[80px] md:left-[75%] md:right-auto md:-ml-20 ${getEnemyStyle()} ${!isFetchingBattleData ? 'animate-slide-in-right' : ''}`}>
               <div className="relative">
                  {/* Impact Effect Overlay */}
                  {showImpact === 'enemy' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center animate-impact pointer-events-none">
                        <div className="w-[140%] h-[8px] bg-white shadow-[0_0_20px_rgba(255,255,255,1)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 animate-[slash_0.3s_ease-out_forwards]" />
                        <div className="w-[140%] h-[8px] bg-white shadow-[0_0_20px_rgba(255,255,255,1)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-[slash_0.3s_ease-out_forwards_0.1s]" />
                        {lastCrit && (
                             <div className="absolute inset-0 bg-yellow-400/40 mix-blend-overlay animate-pulse rounded-full" />
                        )}
                    </div>
                   )}
                   {showEnemySkeleton ? (
                     <div className="w-40 h-40 flex items-center justify-center">
                       <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
                     </div>
                   ) : enemy ? (
                     <div className="relative">
                        {/* Win State: Drops */}
                       {battle?.win && (
                            <div className="absolute inset-x-0 top-[40%] -translate-y-1/2 z-50 flex flex-wrap items-center justify-center gap-2">
                               {/* XP Drop */}
                               {rewards?.xp > 0 && (
                                    <GlobalTooltip content={<span className="text-xs font-bold text-blue-300">+{rewards.xp} XP</span>}>
                                        <div className="flex h-10 w-10 animate-in fade-in slide-in-from-bottom-4 items-center justify-center rounded-full border border-blue-400/40 bg-blue-900/60 shadow-[0_0_15px_rgba(59,130,246,0.5)] backdrop-blur-sm transition-transform hover:scale-110 duration-700">
                                            <span className="text-[10px] font-extrabold text-blue-100">XP</span>
                                        </div>
                                    </GlobalTooltip>
                                )}
                                {/* Bits Drop */}
                                {rewards?.bits > 0 && (
                                    <GlobalTooltip content={<span className="text-xs font-bold text-yellow-300">+{rewards.bits} Bits</span>}>
                                        <div className="flex h-10 w-10 animate-in fade-in slide-in-from-bottom-4 items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-900/60 shadow-[0_0_15px_rgba(234,179,8,0.5)] backdrop-blur-sm transition-transform hover:scale-110 duration-700 delay-100">
                                            <span className="text-[10px] font-extrabold text-yellow-100">B</span>
                                        </div>
                                    </GlobalTooltip>
                                )}
                                {/* Item Drops */}
                                {rewards?.drops?.map((drop, idx) => (
                                    <GlobalTooltip 
                                        key={idx} 
                                        content={
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm text-yellow-400">{drop.name}</p>
                                                <p className="text-slate-300 text-[10px]">{drop.type === 'consumable' ? 'Consumível' : 'Item'}</p>
                                            </div>
                                        }
                                    >
                                        <div 
                                            className="flex h-10 w-10 animate-in fade-in slide-in-from-bottom-8 items-center justify-center rounded-lg border border-white/20 bg-black/60 shadow-[0_0_10px_rgba(255,255,255,0.2)] backdrop-blur-sm transition-transform hover:scale-110 duration-500"
                                            style={{ animationDelay: `${200 + (idx * 100)}ms` }}
                                        >
                                            {drop.icon ? (
                                                <img 
                                                    src={drop.icon.startsWith('http') ? drop.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${drop.icon}`} 
                                                    alt={drop.name} 
                                                    className="h-7 w-7 object-contain" 
                                                />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full bg-white/20" />
                                            )}
                                        </div>
                                    </GlobalTooltip>
                                ))}
                             </div>
                       )}
                    <GlobalTooltip content={battle?.win ? null : enemyTooltipContent}>
                      <div
                        className={`flex items-center justify-center transition-all duration-1000 ${battle?.win ? 'opacity-0 filter grayscale blur-sm scale-90' : ''}`}
                        style={{ 
                            width: `${(isMobile ? 100 : 160) * enemyStageScale}px`, 
                            height: `${(isMobile ? 100 : 160) * enemyStageScale}px` 
                        }}
                      >
                        {enemy?.sprite_path ? (
                          <img
                            src={enemy.sprite_path.startsWith('http') ? enemy.sprite_path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${enemy.sprite_path}`}
                            alt={enemy?.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                            style={{
                               filter: isEnemyAttacking ? 'brightness(1.5)' : (isEnemyHit ? 'brightness(0.5) sepia(1) hue-rotate(-50deg)' : 'none'),
                               transform: `${isEnemyAttacking ? 'translateX(-50px)' : (isEnemyHit ? 'translateX(20px)' : 'translateX(0)')} scale(${enemyStageScale})`,
                               transition: 'transform 0.2s, filter 0.2s'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                       </div>
                     </GlobalTooltip>
                      </div>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse"></div>
                     </div>
                   )}
                {/* Damage Indicators */}
                {damageIndicators.filter(i => i.target === 'enemy').map(i => (
                  <div 
                    key={i.id} 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 text-5xl font-black z-50 pointer-events-none whitespace-nowrap animate-damage ${
                      i.type === 'blocked' 
                        ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] text-3xl' 
                        : (i.crit 
                            ? 'text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,1)] scale-125'
                            : 'text-white drop-shadow-[0_2px_4px_rgba(220,38,38,0.8)]'
                          )
                    }`}
                  >
                    {i.type === 'blocked' && <Shield className="inline-block w-6 h-6 mr-1" />}
                    {i.text ? i.text : <span>{i.value}{i.crit && <span className="text-3xl align-top">CRIT!</span>}</span>}
                  </div>
                 ))}
               </div>
            </div>
              <div className="absolute bottom-4 left-1/2 z-40 w-[min(720px,calc(100%-16px))] -translate-x-1/2 md:bottom-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] backdrop-blur-md">
                  {showWinModal ? (
                    <div className={isMobile ? "flex justify-center gap-6" : "grid grid-cols-2 gap-2 w-full"}>
                      <Button
                          size={isMobile ? "icon" : "lg"}
                          disabled={!winInteractionReady}
                          className={`${isMobile 
                            ? 'h-16 w-16 rounded-full bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                            : 'h-12 w-full rounded-xl bg-green-600 hover:bg-green-500'
                          } select-none text-white border border-green-400/30 animate-in fade-in zoom-in duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={handleContinueAfterWin}
                      >
                          {isMobile ? (
                            <Play className="h-8 w-8 fill-current" />
                          ) : (
                            <div className="flex w-full items-center justify-between px-2">
                                <span className="inline-flex items-center font-bold">
                                    <Play className="mr-2 h-5 w-5 fill-current" /> Continuar
                                </span>
                                <span className="rounded-md bg-black/20 px-2 py-1 text-[10px] font-bold tracking-[0.15em] text-white/90 border border-white/10">
                                    ENTER
                                </span>
                            </div>
                          )}
                      </Button>

                      <Button
                          size={isMobile ? "icon" : "lg"}
                          variant="destructive"
                          disabled={!winInteractionReady}
                          className={`${isMobile 
                            ? 'h-16 w-16 rounded-full bg-red-950/80 hover:bg-red-900/90' 
                            : 'h-12 w-full rounded-xl bg-red-950/80 hover:bg-red-900/90'
                          } select-none text-red-200 border border-red-500/30 animate-in fade-in zoom-in duration-300 delay-75 disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={handleLeave}
                      >
                          {isMobile ? (
                            <XCircle className="h-8 w-8" />
                          ) : (
                            <div className="flex w-full items-center justify-between px-2">
                                <span className="inline-flex items-center font-semibold">
                                    <XCircle className="mr-2 h-5 w-5" /> Sair
                                </span>
                                <span className="rounded-md bg-black/20 px-2 py-1 text-[10px] font-bold tracking-[0.15em] text-red-200/90 border border-white/10">
                                    ESC
                                </span>
                            </div>
                          )}
                      </Button>
                    </div>
                  ) : (
                    <div className={isMobile ? "flex items-center justify-center gap-4" : "grid grid-cols-2 gap-2 md:grid-cols-4"}>
                      <Button
                        size={isMobile ? "icon" : "lg"}
                        className={`${isMobile 
                          ? 'h-14 w-14 rounded-full border border-white/20' 
                          : 'h-12 w-full rounded-xl'
                        } relative overflow-hidden select-none bg-white text-slate-950 hover:bg-white/90`}
                        onClick={executeAttack}
                        disabled={!canAttack || battle?.win || (battle?.user?.hp ?? 0) <= 0 || loading || animState !== 'idle'}
                      >
                        {!canAttack && playerMaxCooldown > 0 && (
                          <div
                            className="absolute inset-0 bg-slate-900/45 z-10 transition-all duration-75"
                            style={{ height: `${(playerCooldown / playerMaxCooldown) * 100}%` }}
                          />
                        )}
                        {isMobile ? (
                          <div className="relative z-20 flex items-center justify-center">
                            <Swords className="h-6 w-6" />
                            {/* Cooldown overlay number if needed, but maybe distracting on icon. User said 'menos texto'. */}
                          </div>
                        ) : (
                          <div className="relative z-20 flex w-full items-center justify-between">
                            <span className="inline-flex items-center">
                              <Swords className="mr-2 h-4 w-4" />
                              {!canAttack && playerCooldown > 0 ? `${(playerCooldown / 1000).toFixed(1)}s` : 'Atacar'}
                            </span>
                            <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-slate-900/80">
                              1
                            </span>
                          </div>
                        )}
                      </Button>

                      <Button
                        size={isMobile ? "icon" : "lg"}
                        variant="secondary"
                        className={`${isMobile 
                          ? 'h-14 w-14 rounded-full border border-white/20' 
                          : 'h-12 w-full rounded-xl border border-white/10'
                        } select-none bg-slate-950/60 text-slate-100 hover:bg-slate-950/75`}
                        onClick={handleOpenBag}
                        disabled={loading || battle?.win}
                      >
                        {isMobile ? (
                           <Backpack className="h-6 w-6" />
                        ) : (
                          <div className="flex w-full items-center justify-between">
                            <span className="inline-flex items-center">
                              <Backpack className="mr-2 h-4 w-4" /> Itens
                            </span>
                            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-slate-200">
                              2
                            </span>
                          </div>
                        )}
                      </Button>

                      <Button
                        size={isMobile ? "icon" : "lg"}
                        variant="destructive"
                        className={`${isMobile 
                          ? 'h-14 w-14 rounded-full border border-white/20' 
                          : 'h-12 w-full rounded-xl'
                        } select-none`}
                        onClick={onFlee}
                        disabled={fleeCooldownMs > 0}
                      >
                        {isMobile ? (
                           <XCircle className="h-6 w-6" />
                        ) : (
                          <div className="flex w-full items-center justify-between">
                            <span className="inline-flex items-center">
                              <XCircle className="mr-2 h-4 w-4" />
                              {fleeCooldownMs > 0 ? `Fugir (${(fleeCooldownMs / 1000).toFixed(2)}s)` : 'Fugir'}
                            </span>
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-white/90">
                              3
                            </span>
                          </div>
                        )}
                      </Button>

                      <Button
                        size={isMobile ? "icon" : "lg"}
                        variant="outline"
                        className={`${isMobile 
                          ? 'h-14 w-14 rounded-full border-white/20 bg-slate-950/45' 
                          : 'h-12 w-full rounded-xl border-white/10 bg-slate-950/45'
                        } text-slate-100 hover:bg-slate-950/60`}
                        onClick={() => navigate('/exploration')}
                      >
                        {isMobile ? (
                           <Map className="h-6 w-6" />
                        ) : (
                          <div className="flex w-full items-center justify-between">
                            <span className="inline-flex items-center">
                              <Map className="mr-2 h-4 w-4" /> Explorar
                            </span>
                            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-slate-200">
                              4
                            </span>
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {showBag ? (
                <div className="absolute left-1/2 top-1/2 z-50 w-[min(420px,calc(100%-16px))] -translate-x-1/2 -translate-y-1/2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] backdrop-blur-md overflow-hidden">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-slate-200">
                        <Backpack className="h-4 w-4 text-slate-200" />
                        ITENS
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full border border-white/10 bg-slate-950/60 p-0 text-slate-100 hover:bg-slate-950/75"
                        onClick={handleCloseBag}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold text-slate-200/70">
                      <span className="tracking-[0.18em]">1–9 USAR</span>
                      <span className="tracking-[0.18em]">ENTER/ESPAÇO/ESC FECHA</span>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
                      {inventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300/60">
                          <Backpack className="h-10 w-10 opacity-60" />
                          <div className="text-xs font-semibold">Mochila vazia.</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {inventory.map((item, idx) => {
                            const isUsing = usingItemId === item.inventory_id;
                            const isUsed = usedItemIds.has(item.inventory_id);
                            const effectValue = item.effect_value ?? 0;
                            const isPercent = item.is_percent === 1 || item.is_percent === true;
                            const hotkeyLabel = idx < 9 ? String(idx + 1) : null;

                            return (
                              <button
                                key={item.inventory_id}
                                type="button"
                                className={`group flex w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                                  isUsed ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/25 hover:bg-black/35'
                                } ${isUsing ? 'cursor-not-allowed opacity-80' : ''}`}
                                onClick={() => !isUsing && handleUseItemWithFeedback(item)}
                                disabled={isUsing}
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                    {item.icon ? (
                                      <img
                                        src={item.icon.startsWith('http') ? item.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${item.icon}`}
                                        alt={item.name}
                                        className="h-7 w-7 object-contain"
                                      />
                                    ) : (
                                      <Backpack className="h-5 w-5 text-slate-200/40" />
                                    )}
                                    {isUsing ? (
                                      <div className="absolute inset-0 grid place-items-center bg-black/55">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-100/80" />
                                      </div>
                                    ) : null}
                                    {isUsed ? (
                                      <div className="absolute inset-0 grid place-items-center bg-emerald-500/10">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]" />
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="min-w-0 truncate text-[11px] font-semibold text-slate-100">
                                        {item.name}
                                      </div>
                                      <div className="shrink-0 rounded-md border border-white/10 bg-slate-950/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-100 tabular-nums">
                                        x{item.quantity}
                                      </div>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200">
                                      <Heart className="h-3.5 w-3.5 text-emerald-300" />
                                      +{effectValue}{isPercent ? '%' : ''} HP
                                    </div>
                                  </div>
                                </div>

                                {hotkeyLabel ? (
                                  <div className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-slate-200">
                                    {hotkeyLabel}
                                  </div>
                                ) : (
                                  <div className="shrink-0 rounded-md bg-white/0 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.22em] text-slate-200/40">
                                    —
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          </CardContent>
        </Card>
      </div>

      <QuestDetailDialog
        quest={selectedQuestForDetails}
        open={!!selectedQuestForDetails}
        onOpenChange={(open) => !open && setSelectedQuestForDetails(null)}
        userProgress={
          selectedQuestForDetails
            ? (() => {
                const q = activeQuests.find(x => x.id === selectedQuestForDetails.id);
                return q ? { status: q.status, progress: q.progress } : null;
              })()
            : null
        }
        showActions={false}
      />

      <QuestDetailDialog
        quest={activeQuestCompletion}
        open={showQuestCompletionDialog}
        requireClickToClose
        disableKeyboardActions
        onOpenChange={(open) => {
          if (open) return;
          const [next, ...rest] = questCompletionQueue;
          if (next) {
            setActiveQuestCompletion(next);
            setQuestCompletionQueue(rest);
            setShowQuestCompletionDialog(true);
            return;
          }
          setActiveQuestCompletion(null);
          setQuestCompletionQueue([]);
          setShowQuestCompletionDialog(false);
          setShowWinModal(true);
        }}
        userProgress={
          activeQuestCompletion
            ? { status: 'COMPLETED', progress: activeQuestCompletion.progress }
            : null
        }
        onClaim={async (questId) => {
          try {
            await api.post('/api/quests/claim', { questId });
          } catch (error) {
            console.error("Error claiming reward:", error);
          } finally {
            await fetchActiveQuests({ detectCompletion: false });
            const [next, ...rest] = questCompletionQueue;
            if (next) {
              setActiveQuestCompletion(next);
              setQuestCompletionQueue(rest);
              setShowQuestCompletionDialog(true);
              return;
            }
            setActiveQuestCompletion(null);
            setQuestCompletionQueue([]);
            setShowQuestCompletionDialog(false);
            setShowWinModal(true);
          }
        }}
        onCancel={() => {}}
      />

      <Dialog open={showNoItemsModal} onOpenChange={setShowNoItemsModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Itens consumíveis esgotados</DialogTitle>
            <DialogDescription>
              Você não possui mais o item necessário para continuar neste mapa. Você será redirecionado para o Digimundo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => navigate('/exploration')}>
              Ir para Explorar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
