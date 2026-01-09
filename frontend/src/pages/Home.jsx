import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import GlobalTooltip from '@/components/GlobalTooltip';
import NewsList from '@/components/NewsList';
import { 
  Map as MapIcon, 
  Dna, 
  Home as HomeIcon, 
  BookOpen, 
  User, 
  Coins, 
  Zap,
  Shield,
  Swords,
  Package,
  Trophy
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [mainDigimon, setMainDigimon] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [userStats, setUserStats] = useState({
      bits: 0,
      rank: 1,
      profile_image: null,
      exp: 0,
      exp_m: 1000,
      level: 1
  });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchRanking();
    }
  }, []);

  const fetchRanking = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/digimons/ranking');
      setRanking(res.data);
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch user details
      const userRes = await axios.get(`http://localhost:5000/api/users/${user.id}`);
      if (userRes.data) {
        setUserStats({
            bits: userRes.data.bits || 0,
            rank: userRes.data.role === 'admin' ? 2 : userRes.data.role === 'owner' ? 3 : 1,
            profile_image: userRes.data.profile_image,
            exp: userRes.data.exp || 0,
            exp_m: userRes.data.exp_m || 1000,
            level: userRes.data.level || 1
        });
      }

      // Fetch user digimons
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/digimons`);
      const digimons = response.data;
      
      if (digimons && digimons.length > 0) {
        const main = digimons.find(d => d.principal === 1 || d.is_main === 1) || digimons[0];
        setMainDigimon(main);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <h1 className="text-4xl font-bold mb-8">Digimon Omega</h1>
            <p className="text-muted-foreground mb-8">Sua jornada digital começa aqui.</p>
            <div className="space-x-4">
                <Button size="lg" onClick={() => navigate('/login')}>Entrar</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/register')}>Cadastrar</Button>
            </div>
        </div>
     );
  }

  const NavCard = ({ title, description, icon, to, colorClass = "text-primary" }) => (
    <Card 
      className="group hover:shadow-lg transition-all cursor-pointer border-muted hover:border-primary/50"
      onClick={() => navigate(to)}
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className={`p-4 rounded-full bg-secondary/30 group-hover:scale-110 transition-transform ${colorClass}`}>
          {React.createElement(icon, { className: "w-8 h-8" })}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Digivice / Main Digimon - Polished Minimalist Style */}
          <div className="lg:col-span-5 space-y-6">
             <Card className="h-full border shadow-xl overflow-hidden relative">
                {/* Tech Grid Background */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(currentColor 1px, transparent 1px), 
                      linear-gradient(90deg, currentColor 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />
                
                <CardHeader className="relative z-10 border-b pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="font-mono tracking-widest text-sm text-muted-foreground">DIGIVICE</span>
                    <Zap className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-8 relative z-10 pt-8">
                  {loading ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
                      LOADING DATA...
                    </div>
                  ) : mainDigimon ? (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 flex items-center justify-center mb-6 group">
                           {/* Glow Effect */}
                           <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all duration-700" />
                           
                           {mainDigimon.sprite_path ? (
                              <img 
                                src={`http://localhost:5000/${mainDigimon.sprite_path}`} 
                                alt={mainDigimon.species_name}
                                className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl transition-all duration-500"
                              />
                           ) : (
                              <span className="text-muted-foreground font-mono text-xs">NO SIGNAL</span>
                           )}
                        </div>
                        
                        <div className="text-center space-y-1">
                          <h2 className="text-2xl font-bold tracking-tight uppercase">{mainDigimon.name || mainDigimon.species_name}</h2>
                          <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground uppercase">
                            <span className="px-2 py-0.5 border rounded">{mainDigimon.type || 'UNKNOWN'}</span>
                            <span className="px-2 py-0.5 border rounded">LV. {mainDigimon.level || 1}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5 bg-secondary/30 p-5 rounded-sm border backdrop-blur-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                            <span>Health Integrity</span>
                            {(() => {
                              const baseHp = Number(mainDigimon.base_hp || 0);
                              const hpCols = ['max_hp','hp','vida'];
                              const persistedHp = hpCols.reduce((v,k)=> v != null ? v : mainDigimon?.[k], null);
                              const persistedHpNum = persistedHp != null ? Number(persistedHp || 0) : baseHp;
                              const lvUpHp = Math.max(persistedHpNum - baseHp, 0);
                              const extraHp = Number(mainDigimon.extra_hp || 0);
                              const effMax = baseHp + lvUpHp + extraHp;
                              const current = Number(mainDigimon.current_hp != null ? mainDigimon.current_hp : effMax);
                              return (
                                <GlobalTooltip 
                                  content={
                                    <div className="space-y-1">
                                      <p className="text-xs">Base: {baseHp}</p>
                                      <p className="text-xs">Itens: +{extraHp}</p>
                                      <p className="text-xs">Lv Up: +{lvUpHp}</p>
                                    </div>
                                  }
                                >
                                  <span>{current} / {effMax}</span>
                                </GlobalTooltip>
                              );
                            })()}
                          </div>
                          {(() => {
                            const baseHp = Number(mainDigimon.base_hp || 0);
                            const hpCols = ['max_hp','hp','vida'];
                            const persistedHp = hpCols.reduce((v,k)=> v != null ? v : mainDigimon?.[k], null);
                            const persistedHpNum = persistedHp != null ? Number(persistedHp || 0) : baseHp;
                            const lvUpHp = Math.max(persistedHpNum - baseHp, 0);
                            const extraHp = Number(mainDigimon.extra_hp || 0);
                            const effMax = baseHp + lvUpHp + extraHp;
                            const current = Number(mainDigimon.current_hp != null ? mainDigimon.current_hp : effMax);
                            const pct = effMax > 0 ? Math.min(Math.max((current / effMax) * 100, 0), 100) : 100;
                            return <Progress value={pct} className="h-1" />;
                          })()}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                            <span>Data Volume (XP)</span>
                            <span>{mainDigimon.xp || 0} / {mainDigimon.level * 100}</span>
                          </div>
                          <Progress value={((mainDigimon.xp || 0) / (mainDigimon.level * 100)) * 100} className="h-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <div className="flex items-center gap-3 bg-card p-3 rounded border">
                              <Swords className="w-4 h-4 text-muted-foreground" />
                               <div>
                                 <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Ataque</p>
                                 <div className="font-mono text-sm">
                                  {(() => {
                                    const keys = ['extra_attack','attack_bonus','bonus_attack','extra_atk','atk_bonus','atk_extra','attack_extra'];
                                    const extra = keys.reduce((s,k)=> s + Number(mainDigimon?.[k] || 0), 0);
                                    const base = Number(mainDigimon.base_attack || 0);
                                    const atkCols = ['attack','atk','ataque','forca'];
                                    const persistedAtk = atkCols.reduce((v,k)=> v != null ? v : mainDigimon?.[k], null);
                                    const persistedAtkNum = persistedAtk != null ? Number(persistedAtk || 0) : base;
                                    const lvUp = Math.max(persistedAtkNum - base, 0);
                                    const total = base + lvUp + extra;
                                    return (
                                      <GlobalTooltip 
                                        content={
                                          <div className="space-y-1">
                                            <p className="text-xs">Base: {base}</p>
                                            <p className="text-xs">Itens: +{extra}</p>
                                            <p className="text-xs">Lv Up: +{lvUp}</p>
                                          </div>
                                        }
                                      >
                                        <span>{total}</span>
                                      </GlobalTooltip>
                                    );
                                  })()}
                                 </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-3 bg-card p-3 rounded border">
                               <Shield className="w-4 h-4 text-muted-foreground" />
                               <div>
                                 <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Defesa</p>
                                 <div className="font-mono text-sm">
                                  {(() => {
                                    const base = Number(mainDigimon.base_defense || 0);
                                    const defCols = ['defense','def','defesa'];
                                    const persistedDef = defCols.reduce((v,k)=> v != null ? v : mainDigimon?.[k], null);
                                    const persistedDefNum = persistedDef != null ? Number(persistedDef || 0) : base;
                                    const lvUp = Math.max(persistedDefNum - base, 0);
                                    const extra = Number(mainDigimon.extra_defense || 0);
                                    const total = base + lvUp + extra;
                                    return (
                                      <GlobalTooltip 
                                        content={
                                          <div className="space-y-1">
                                            <p className="text-xs">Base: {base}</p>
                                            <p className="text-xs">Itens: +{extra}</p>
                                            <p className="text-xs">Lv Up: +{lvUp}</p>
                                          </div>
                                        }
                                      >
                                        <span>{total}</span>
                                      </GlobalTooltip>
                                    );
                                  })()}
                                 </div>
                               </div>
                            </div>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 space-y-4">
                      <p className="text-muted-foreground font-mono text-sm">NO DATA FOUND</p>
                      <Button onClick={() => navigate('/adoption')} variant="outline" className="w-full">
                        INITIATE ADOPTION
                      </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
          </div>

          {/* Right Column: Global Ranking */}
          <div className="lg:col-span-7 flex flex-col gap-4">
             {/* News Feed */}
             <NewsList limit={3} />

             {/* Global Ranking */}
             <Card className="h-full shadow-sm border-muted">
                <CardHeader className="py-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    Ranking Global
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {ranking.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground font-mono">
                            {loading ? 'Carregando...' : 'Sem dados'}
                        </div>
                    ) : (
                        ranking.map((digi, index) => (
                            <GlobalTooltip
                                key={digi.user_digimon_id || index}
                                content={
                                    <div className="space-y-2 p-1 min-w-[180px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                            <span className="font-bold text-sm text-yellow-400">{digi.name || digi.species_name}</span>
                                            <Badge variant="outline" className="text-[10px] border-yellow-400/30 text-yellow-400 h-5 px-1">Lvl {digi.level}</Badge>
                                        </div>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between text-slate-300">
                                                <span>Tamer</span>
                                                <span 
                                                    className="text-white cursor-pointer hover:underline hover:text-yellow-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/profile/${digi.owner_id || digi.user_id}`);
                                                    }}
                                                >
                                                    {digi.owner_name}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-slate-300">
                                                <span>Poder Total</span>
                                                <span className="text-white font-mono">{digi.total_power}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-slate-400">
                                            <span className="flex justify-between">HP <span className="text-slate-200">{digi.max_hp}</span></span>
                                            <span className="flex justify-between">ATK <span className="text-slate-200">{digi.attack}</span></span>
                                            <span className="flex justify-between">DEF <span className="text-slate-200">{digi.defense}</span></span>
                                        </div>
                                    </div>
                                }
                            >
                                <div className="flex items-center justify-between py-2 px-3 border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors cursor-help group">
                                    <div className="flex items-center gap-3">
                                        <span className={`
                                            font-mono text-xs w-4 text-right
                                            ${index === 0 ? 'text-yellow-500 font-bold' : 
                                              index === 1 ? 'text-slate-400 font-bold' : 
                                              index === 2 ? 'text-amber-600 font-bold' : 
                                              'text-muted-foreground'}
                                        `}>
                                            {index + 1}.
                                        </span>
                                        
                                        <div className="relative w-8 h-8 rounded bg-muted/30 flex items-center justify-center overflow-hidden border border-muted/50">
                                            {digi.sprite_path ? (
                                                <img src={`http://localhost:5000/${digi.sprite_path}`} alt={digi.species_name} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <div className="text-[8px] text-muted-foreground">?</div>
                                            )}
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                                {digi.name || digi.species_name}
                                            </span>
                                            <span 
                                                className="text-[10px] text-muted-foreground mt-1 hover:text-primary cursor-pointer hover:underline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/profile/${digi.owner_id || digi.user_id}`);
                                                }}
                                            >
                                                {digi.owner_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="font-mono text-xs font-medium">
                                        {digi.total_power}
                                    </div>
                                </div>
                            </GlobalTooltip>
                        ))
                    )}
                  </div>
                </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
