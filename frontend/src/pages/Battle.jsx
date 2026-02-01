import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  XCircle,
  AlertCircle
} from 'lucide-react';
import GlobalTooltip from '@/components/GlobalTooltip';
import api from '../services/api';

export default function Battle() {
  const navigate = useNavigate();
  const [battle, setBattle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
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

  const addDamageIndicator = (value, target, crit = false, text = null) => {
      const id = Date.now() + Math.random();
      setDamageIndicators(prev => [...prev, { id, value, target, crit, text }]);
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
    try {
      const payload = { user_id: user.id };
      if (mapId) payload.map_id = mapId;
      if (isEntry) payload.entry = true;
      const res = await api.post('/api/battles', payload);
      const b = res.data;
      setBattle(b);
      setLogs([]);
      setShowWinModal(false);
      setRewards(null);
      setLevelUpInfo(null);
      setHealCooldownUntil(0);
      setHealCooldownMs(0);
      setFleeCooldownUntil(0);
      setFleeCooldownMs(0);
      setAnimState('idle');
      
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

      setLoading(false);
      return res.data;
    } catch (error) {
      console.error('Erro ao iniciar batalha:', error);
    }
    setLoading(false);
  };
  useEffect(() => {
    startBattle(true);
  }, []);
  // Main Loop for Cooldowns
  useEffect(() => {
    if (!battle || battle.win || battle.user.hp <= 0) return;

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
            if (next === 0 && animState === 'idle' && battle.user.hp > 0 && !battle.win) {
                // Double check if player is currently acting to enforce priority
                if (!isPlayerAttacking && animState === 'idle') {
                    executeEnemyAttackReal();
                    return enemyMaxCooldown; // Reset enemy CD
                } else {
                     // Player is attacking, so we trigger Blocked logic here too if cooldown is ready
                     addDamageIndicator(0, 'enemy', false, 'Blocked!');
                     // Reset cooldown partially? Or full reset? 
                     // User said "cancel attack". So full reset.
                     return enemyMaxCooldown; 
                }
            }
            return next;
        });

    }, interval);

    return () => clearInterval(timer);
  }, [battle, animState, canAttack, playerMaxCooldown, enemyMaxCooldown]);

  // Execute Enemy Attack (Client-side trigger for server calculation)
  const executeEnemyAttackReal = async () => {
      // Priority Check: If player is currently attacking (animState is 'player-attack' or 'enemy-hit'), 
      // do NOT execute enemy attack yet. Wait for next cycle.
      if (animState === 'player-attack' || animState === 'enemy-hit' || isPlayerAttacking) {
          // Only show Blocked if we haven't shown it recently to avoid spam
          addDamageIndicator(0, 'enemy', false, 'Blocked!');
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
         setShowWinModal(true);
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
        addDamageIndicator(0, 'enemy', false, 'Blocked!');
    }

    try {
      // Modifying call to send actor=player
      const res = await api.post(`/api/battles/${battle.id}/attack?actor=player`);
      await triggerSequence(res.data, 'player');
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
  };
  const myDigimon = battle?.user;
  const enemy = battle?.enemy;
  const isBoss = enemy?.difficulty === 'Boss';
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
    if (animState === 'player-attack') return "translate-x-64 scale-110 z-20 transition-transform duration-300 ease-in";
    if (animState === 'player-hit') return "animate-shake text-red-500 brightness-150 saturate-0";
    return "transition-all duration-300";
  };
  const getEnemyStyle = () => {
    if (animState === 'enemy-attack') return "-translate-x-64 scale-110 z-20 transition-transform duration-300 ease-in";
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
  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Custom Keyframes for Shake Effect */}
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
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.5); }
            100% { opacity: 0; transform: scale(2); }
        }
        .animate-impact {
            animation: flash 0.4s ease-out forwards;
        }
        @keyframes float-up {
            0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -60px) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
            animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
      <Card className="border shadow-none rounded-xl overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="border-b bg-white dark:bg-slate-950 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {mapDetails ? mapDetails.name : 'Simulação de Combate'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Battle Arena - Tech Grid */}
          <div className="relative h-[300px] md:h-[400px] bg-slate-950 w-full overflow-hidden flex justify-between items-center px-2 md:px-24">
            {/* Map Background */}
            {mapDetails?.image_path && (
                <div 
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ 
                        backgroundImage: `url(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${mapDetails.image_path.replace(/\\/g, '/')})`
                    }}
                ></div>
            )}
            {/* Dark Gradient Overlay with Blur for Text Readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent backdrop-blur-[1px]"
                 style={{ height: '100%' }}
            ></div>
            {/* Grid Background - Visible in dark areas */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px] z-0 opacity-50"
                 style={{
                    maskImage: 'linear-gradient(to top, black 50%, transparent 85%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 85%)'
                 }}
            ></div>
            {/* Player Side */}
            <div className={`relative z-10 flex flex-col items-center gap-6 ${getPlayerStyle()}`}>
               <div className="relative">
                  {/* Selection circle */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-blue-500/20 rounded-[100%] blur-md transition-opacity duration-300"></div>
                  {/* Impact Effect Overlay */}
                  {showImpact === 'player' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center animate-impact pointer-events-none">
                        <Skull className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    </div>
                  )}
                  <div className="w-48 h-48 md:w-72 md:h-72 flex items-center justify-center">
                    {myDigimon?.sprite_path ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${myDigimon.sprite_path}`} 
                        alt={myDigimon?.name} 
                        className="h-full w-full object-contain scale-x-[-1]" 
                        style={{
                          filter: isPlayerAttacking ? 'brightness(1.5)' : (isPlayerHit ? 'brightness(0.5) sepia(1) hue-rotate(-50deg)' : 'none'),
                          transform: `${isPlayerAttacking ? 'translateX(50px)' : (isPlayerHit ? 'translateX(-20px)' : 'translateX(0)')} scaleX(-1)`,
                          transition: 'transform 0.2s, filter 0.2s'
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  {/* Damage Indicators */}
                  {damageIndicators.filter(i => i.target === 'player').map(i => (
                    <div key={i.id} className="absolute top-0 left-1/2 text-4xl font-bold text-red-500 animate-float-up z-50 pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-mono">
                        -{i.value}
                    </div>
                  ))}
               </div>
               {/* Player Stats - Minimal */}
               <div className="w-48 space-y-2 transition-opacity duration-300">
                  <div className="flex justify-between items-end">
                    <span className="font-medium text-slate-200">{myDigimon?.name}</span>
                    <span className="text-xs text-slate-500 font-mono">Lvl {myDigimon?.level}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                      <span>HP</span>
                      <span className={animState === 'player-hit' ? 'text-red-500 font-bold' : ''}>{myDigimon?.hp}/{myDigimon?.max_hp}</span>
                    </div>
                    <Progress value={hpPercent} className="h-1.5 bg-slate-800" indicatorClassName={`bg-white transition-all duration-500 ${hpPercent < 30 ? 'bg-red-500' : ''}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                      <span>XP</span>
                    </div>
                    <Progress value={xpPercent} className="h-1 bg-slate-800" indicatorClassName="bg-slate-500" />
                  </div>
                  {/* Detailed Stats */}
                  <div className="pt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono">
                     <div className="flex items-center gap-1">
                        <Swords className="h-3 w-3 text-blue-400" />
                        <span className="text-slate-300">{battle?.user?.attack}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-green-400" />
                        <span className="text-slate-300">{battle?.user?.defense}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-400" />
                        <span className="text-slate-300">{battle?.user?.attack_speed ? Number(battle.user.attack_speed).toFixed(1) : '2.0'}s</span>
                     </div>
                  </div>
               </div>
            </div>
            {/* VS Divider - Fades out during combat action */}
            <div className={`h-32 w-px bg-gradient-to-b from-transparent via-slate-800 to-transparent transition-opacity duration-300 ${animState !== 'idle' ? 'opacity-0' : 'opacity-100'}`}></div>
            {/* Enemy Side */}
            <div className={`relative z-10 flex flex-col items-center gap-6 ${getEnemyStyle()}`}>
               <div className="relative">
                   <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 ${isBoss ? 'bg-red-600/40 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-red-500/20'} rounded-[100%] blur-md transition-opacity duration-300`}></div>
                  {/* Impact Effect Overlay */}
                  {showImpact === 'enemy' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center animate-impact pointer-events-none">
                        {lastCrit ? (
                          <Sparkles className="w-24 h-24 text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.9)]" />
                        ) : (
                          <Zap className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] fill-yellow-200" />
                        )}
                    </div>
                   )}
                   <div className="w-48 h-48 md:w-72 md:h-72 flex items-center justify-center">
                    {enemy?.sprite_path ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${enemy.sprite_path}`} 
                        alt={enemy?.name} 
                        className={`h-full w-full object-contain ${isBoss ? 'drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]' : ''}`} 
                        style={{
                           filter: isEnemyAttacking ? 'brightness(1.5)' : (isEnemyHit ? 'brightness(0.5) sepia(1) hue-rotate(-50deg)' : 'none'),
                           transform: isEnemyAttacking ? 'translateX(-50px)' : (isEnemyHit ? 'translateX(20px)' : 'translateX(0)'),
                           transition: 'transform 0.2s, filter 0.2s'
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                   </div>
                {/* Damage Indicators */}
                {damageIndicators.filter(i => i.target === 'enemy').map(i => (
                  <div 
                    key={i.id} 
                    className={`absolute top-0 left-1/2 text-4xl font-extrabold animate-float-up z-50 pointer-events-none font-mono ${
                      i.text === 'Blocked!' 
                        ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' 
                        : (i.crit 
                            ? 'text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]'
                            : 'text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                          )
                    }`}
                  >
                    {i.text ? i.text : `-${i.value}${i.crit ? '!' : ''}`}
                  </div>
                 ))}
               </div>
               {/* Enemy Stats - Minimal */}
               <div className="w-48 space-y-2 transition-opacity duration-300">
                  <div className="flex justify-between items-end">
                    <span className="font-medium text-slate-200">{enemy?.name}</span>
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${isBoss ? 'border-red-500/50 text-red-400 bg-red-950/30' : 'border-slate-700 text-slate-400'}`}>{enemy?.difficulty}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                      <span>HP</span>
                      <span className={animState === 'enemy-hit' ? 'text-red-500 font-bold' : ''}>{enemy?.hp}/{enemy?.max_hp}</span>
                    </div>
                    <Progress value={enemyHpPercent} className="h-1.5 bg-slate-800" indicatorClassName={`bg-slate-400 transition-all duration-500 ${enemyHpPercent < 30 ? 'bg-red-500' : ''}`} />
                  </div>
                  {/* Detailed Stats */}
                  <div className="pt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono">
                     <span>ATK <span className="text-slate-300">{enemy?.attack}</span></span>
                     <span>DEF <span className="text-slate-300">{enemy?.defense}</span></span>
                     <span>SPD <span className="text-slate-300">{enemy?.attack_speed || 2.0}s</span></span>
                  </div>
               </div>
            </div>
          </div>
          {/* Control Bar */}
          <div className="p-4 md:p-6 bg-white dark:bg-slate-950 border-t grid grid-cols-2 gap-3 md:flex md:items-center md:justify-center md:gap-4">
             <Button 
                size="lg" 
                className="w-full md:w-32 relative overflow-hidden select-none"
                onClick={executeAttack}
                disabled={!canAttack || battle?.win || (battle?.user?.hp ?? 0) <= 0 || loading || animState !== 'idle'}
             >
                {/* Cooldown Overlay */}
                {!canAttack && playerMaxCooldown > 0 && (
                    <div 
                        className="absolute inset-0 bg-slate-900/50 z-10 transition-all duration-75"
                        style={{ height: `${(playerCooldown / playerMaxCooldown) * 100}%` }}
                    ></div>
                )}
                <div className="relative z-20 flex items-center">
                    <Swords className="mr-2 h-4 w-4" /> 
                    {!canAttack && playerCooldown > 0 
                        ? `${(playerCooldown / 1000).toFixed(1)}s` 
                        : 'Atacar'
                    }
                </div>
             </Button>
             <Button 
                size="lg" 
                variant="secondary"
                className="w-full md:w-32 select-none"
                onClick={onHeal}
                disabled={healCooldownMs > 0}
             >
                <Activity className="mr-2 h-4 w-4" /> {healCooldownMs > 0 ? `Curar (${(healCooldownMs/1000).toFixed(2)}s)` : 'Curar'}
             </Button>
             <Button 
                size="lg" 
                variant="destructive"
                className="w-full md:w-32 select-none"
                onClick={() => {
                    onFlee();
                }} 
                disabled={fleeCooldownMs > 0}
             >
                {fleeCooldownMs > 0 ? `Fugir (${(fleeCooldownMs/1000).toFixed(2)}s)` : 'Fugir'}
             </Button>
             <Button 
                size="lg" 
                variant="outline"
                className="w-full md:w-32"
                onClick={() => navigate('/exploration')} 
             >
                <Map className="mr-2 h-4 w-4" /> Explorar
             </Button>
          </div>
          {/* Battle Log */}
          <div ref={logContainerRef} className="bg-slate-50 dark:bg-slate-900 border-t p-4 h-40 overflow-y-auto font-mono text-sm flex flex-col">
             <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold pb-2 border-b border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
               <Activity size={14} /> Histórico Recente
             </div>
             <div className="space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-slate-400 text-xs">Aguardando ações...</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex gap-3 text-slate-600 dark:text-slate-300 text-xs animate-in fade-in slide-in-from-top-1 py-1 border-b border-slate-800/50 last:border-0">
                    <span className="text-slate-500 min-w-[24px] text-right font-mono opacity-50">{String(logs.length - i).padStart(2, '0')}</span>
                    <span>{l}</span>
                  </div>
                ))
              )}
             </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showWinModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Vitória</DialogTitle>
            <DialogDescription>
              Você derrotou o inimigo com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-slate-500">Experiência obtida</span>
              <span className="font-medium">+{rewards?.xp} XP</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-slate-500">Bits obtidos</span>
              <span className="font-medium">+{rewards?.bits} Bits</span>
            </div>
            {rewards?.drops && rewards.drops.length > 0 && (
              <div className="space-y-2 border-b pb-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Drops</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {rewards.drops.map((drop, idx) => (
                    <GlobalTooltip 
                        key={idx} 
                        content={
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-yellow-400">{drop.name}</p>
                                <p className="text-slate-300">Tipo: {drop.type === 'consumable' ? 'Consumível' : 'Outro'}</p>
                                {drop.type === 'consumable' && drop.effect_target && drop.effect_target !== 'none' && (
                                    <p className="text-green-400 text-xs">
                                        Efeito: +{drop.effect_value}{drop.is_percent ? '%' : ''} {drop.effect_target.toUpperCase()}
                                    </p>
                                )}
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center p-2 bg-muted/40 rounded hover:bg-muted/60 transition-colors cursor-help">
                            {drop.icon ? (
                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${drop.icon}`} alt={drop.name} className="w-8 h-8 object-contain mb-1" />
                            ) : (
                                <div className="w-8 h-8 bg-slate-200 rounded-full mb-1 flex items-center justify-center text-[8px]">?</div>
                            )}
                            <span className="text-[10px] text-center leading-tight truncate w-full">{drop.name}</span>
                        </div>
                    </GlobalTooltip>
                  ))}
                </div>
              </div>
            )}
            {levelUpInfo?.leveledUp && (
              <div className="space-y-2 border-b pb-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Subiu de nível</span>
                  <span className="font-medium">Nível {levelUpInfo.prevLevel} → {levelUpInfo.newLevel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded">
                    <span className="text-slate-500">HP</span>
                    <span className="font-semibold text-green-600">+{levelUpInfo.hpGain}</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded">
                    <span className="text-slate-500">ATK</span>
                    <span className="font-semibold text-green-600">+{levelUpInfo.atkGain}</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded">
                    <span className="text-slate-500">DEF</span>
                    <span className="font-semibold text-green-600">+{levelUpInfo.defGain}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={async () => {
              if (mapDetails && mapDetails.require_item === 1 && mapDetails.consume_on_enter === 1 && Number(mapDetails.required_item_id)) {
                try {
                  const res = await api.get(`/api/items/user/${user?.id}`);
                  const inv = res.data || [];
                  const hasItem = inv.some(x => Number(x.id) === Number(mapDetails.required_item_id) && Number(x.quantity) > 0);
                  if (!hasItem) {
                    setShowNoItemsModal(true);
                    return;
                  }
                } catch (e) {
                  console.error('Erro ao verificar inventário:', e);
                }
              }
              startBattle(false);
            }}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
