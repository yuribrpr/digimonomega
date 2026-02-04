import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ScrollText, CheckCircle2, Circle, Trophy, ChevronLeft, Map as MapIcon, Lock, Play, Gift, Backpack, Coins, Dna, ArrowUpCircle, RotateCcw, XCircle } from 'lucide-react';

export default function Quests() {
  const [campaigns, setCampaigns] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [view, setView] = useState('list'); // 'list' | 'details'
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, progressRes] = await Promise.all([
        api.get('/api/quests/campaigns'),
        api.get('/api/quests/progress')
      ]);
      setCampaigns(campaignsRes.data);
      setUserProgress(progressRes.data);
    } catch (error) {
      console.error("Error fetching quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestStatus = (questId) => {
    const progress = userProgress.find(p => p.quest_id === questId);
    return progress ? progress.status : 'AVAILABLE';
  };

  const getCampaignProgress = (campaign) => {
    if (!campaign.quests || campaign.quests.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const total = campaign.quests.length;
    const completed = campaign.quests.filter(q => {
        const status = getQuestStatus(q.id);
        return status === 'COMPLETED' || status === 'CLAIMED';
    }).length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const handleStartQuest = async (questId) => {
    try {
      await api.post('/api/quests/start', { questId });
      fetchData();
      setSelectedQuest(null);
    } catch (error) {
      console.error("Error starting quest:", error);
      const msg = error.response?.data?.message || "Falha ao iniciar missão";
      alert(msg);
    }
  };

  const handleCancelQuest = async (questId) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta missão? Todo o progresso será perdido.")) return;
    try {
      await api.post('/api/quests/cancel', { questId });
      fetchData();
      setSelectedQuest(null);
    } catch (error) {
      console.error("Error cancelling quest:", error);
      const msg = error.response?.data?.message || "Falha ao cancelar missão";
      alert(msg);
    }
  };

  const handleClaimReward = async (questId) => {
    try {
      await api.post('/api/quests/claim', { questId });
      fetchData();
      setSelectedQuest(null);
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Falha ao resgatar recompensa");
    }
  };

  const handleRestartQuest = async (questId) => {
    if (!window.confirm("Deseja refazer esta missão? Seu progresso atual será reiniciado.")) return;
    try {
      await api.post('/api/quests/restart', { questId });
      fetchData();
      setSelectedQuest(null);
    } catch (error) {
      console.error("Error restarting quest:", error);
      const msg = error.response?.data?.message || "Falha ao reiniciar missão";
      alert(msg);
    }
  };

  const handleSelectCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setView('details');
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setView('list');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <div className="p-3 bg-yellow-500/10 rounded-full">
            <ScrollText className="h-8 w-8 text-yellow-500" />
        </div>
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Diário de Missões
            </h1>
            <p className="text-muted-foreground">Complete missões e ganhe recompensas incríveis!</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {view === 'list' ? (
            <CampaignList 
                campaigns={campaigns} 
                getProgress={getCampaignProgress} 
                onSelect={handleSelectCampaign} 
            />
        ) : (
            <CampaignDetails 
                campaign={selectedCampaign} 
                onBack={handleBackToCampaigns} 
                getQuestStatus={getQuestStatus}
                onSelectQuest={setSelectedQuest}
            />
        )}
      </div>

      <QuestDetailDialog 
        quest={selectedQuest} 
        open={!!selectedQuest} 
        onOpenChange={(open) => !open && setSelectedQuest(null)}
        userProgress={userProgress.find(p => p.quest_id === selectedQuest?.id)}
        onStart={handleStartQuest}
        onClaim={handleClaimReward}
        onCancel={handleCancelQuest}
        onRestart={handleRestartQuest}
      />
    </div>
  );
}

function CampaignList({ campaigns, getProgress, onSelect }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {campaigns.map(campaign => {
                const { completed, total, percentage } = getProgress(campaign);
                return (
                    <Card 
                        key={campaign.id} 
                        className="group relative overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10 transition-all border-muted/40 hover:border-yellow-500/50 bg-card/50 backdrop-blur-sm"
                        onClick={() => onSelect(campaign)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardHeader className="relative">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-background/50 backdrop-blur">
                                    Campanha #{campaign.order}
                                </Badge>
                                {percentage === 100 && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluída</Badge>}
                            </div>
                            <CardTitle className="text-xl group-hover:text-yellow-500 transition-colors">
                                {campaign.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                                {campaign.description || "Uma série de desafios aguarda por você."}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="relative">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Progresso</span>
                                    <span>{completed}/{total}</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-yellow-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${percentage}%` }} 
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="relative pt-0">
                            <Button variant="ghost" className="w-full group-hover:bg-yellow-500/10 group-hover:text-yellow-500">
                                Ver Missões
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
            {campaigns.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground">
                    Nenhuma campanha disponível no momento.
                </div>
            )}
        </div>
    );
}

function CampaignDetails({ campaign, onBack, getQuestStatus, onSelectQuest }) {
    if (!campaign) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{campaign.title}</h2>
                    <p className="text-muted-foreground">{campaign.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.quests.map((quest, index) => {
                    const status = getQuestStatus(quest.id);
                    // Simple lock logic: if it's not the first quest and the previous one isn't completed/claimed
                    // Actually, logic might be more complex, but for now let's just show status.
                    // Assuming sequential order if needed, but let's stick to status.
                    
                    return (
                        <QuestCard 
                            key={quest.id} 
                            quest={quest} 
                            status={status} 
                            index={index + 1}
                            onSelect={() => onSelectQuest(quest)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function QuestCard({ quest, status, index, onSelect }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'COMPLETED': return 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10';
      case 'CLAIMED': return 'border-slate-700 bg-slate-800/50 opacity-70';
      case 'IN_PROGRESS': return 'border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]';
      default: return 'border-muted/40 hover:border-yellow-500/50 hover:bg-yellow-500/5'; // AVAILABLE
    }
  };

  const getIcon = () => {
    switch (status) {
        case 'COMPLETED': return <Gift className="h-5 w-5 text-green-500" />;
        case 'CLAIMED': return <CheckCircle2 className="h-5 w-5 text-slate-500" />;
        case 'IN_PROGRESS': return <Play className="h-5 w-5 text-blue-500" />;
        default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
        case 'COMPLETED': return 'Concluída - Resgatar!';
        case 'CLAIMED': return 'Finalizada';
        case 'IN_PROGRESS': return 'Em Progresso';
        default: return 'Disponível';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${getStatusStyles()}`}
      onClick={onSelect}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-full ${status === 'IN_PROGRESS' ? 'bg-blue-500/10' : 'bg-secondary'}`}>
                    {getIcon()}
                </div>
                <div>
                    <CardTitle className="text-base font-bold line-clamp-1">{quest.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs mt-1">
                        {quest.description}
                    </CardDescription>
                </div>
            </div>
            <Badge variant="secondary" className="whitespace-nowrap text-[10px]">
                {getStatusLabel()}
            </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}

export function QuestDetailDialog({ quest, open, onOpenChange, userProgress, onStart = () => {}, onClaim = () => {}, onCancel = () => {}, onRestart = () => {}, showActions = true, requireClickToClose = false, disableKeyboardActions = false }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quest && open) {
      fetchDetails(quest.id);
    } else {
        setDetails(null);
    }
  }, [quest, open]);

  const fetchDetails = async (id) => {
    setLoading(true);
    try {
        // Add timestamp to prevent caching
        const res = await api.get(`/api/quests/${id}?t=${Date.now()}`);
        console.log("Quest Details Loaded:", res.data); // Debugging
        setDetails(res.data);
    } catch (error) {
        console.error("Error fetching quest details:", error);
    } finally {
        setLoading(false);
    }
  };

  if (!quest) return null;

  const status = userProgress ? userProgress.status : 'AVAILABLE';
  const progressData = userProgress?.progress 
    ? (typeof userProgress.progress === 'string' ? JSON.parse(userProgress.progress) : userProgress.progress)
    : {};

  const isRestartable = !!(details?.restartable ?? quest.restartable);

  const API_URL = api.defaults.baseURL;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        onEscapeKeyDown={requireClickToClose ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={requireClickToClose ? (e) => e.preventDefault() : undefined}
        onInteractOutside={requireClickToClose ? (e) => e.preventDefault() : undefined}
        onKeyDownCapture={disableKeyboardActions ? (e) => {
          if (e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
          }
        } : undefined}
      >
        <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">Missão #{quest.order}</Badge>
                    {status === 'IN_PROGRESS' && <Badge className="bg-blue-600">Em andamento</Badge>}
                </div>
                {details?.npc && (
                    <Badge variant="secondary" className="text-xs">
                        Quest de {details.npc.name}
                    </Badge>
                )}
            </div>
            <DialogTitle className="text-2xl font-bold ">{quest.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes e objetivos da missão {quest.title}
            </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-2">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 " /></div>
            ) : details ? (
                <>
                    {/* NPC Interaction Section */}
                    {details.npc ? (
                        <div className="flex gap-4 items-start bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                <div className="w-16 h-16  flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={details.npc.sprite_path ? `${API_URL}/${details.npc.sprite_path}` : (details.npc.image || `/digimons/${details.npc.name.toLowerCase()}.gif`)} 
                                        alt={details.npc.name} 
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => { e.target.src = '/placeholder-digimon.png' }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">{details.npc.name}</span>
                            </div>
                            <div className="relative flex-1 bg-background p-4 rounded-2xl rounded-tl-none border border-border shadow-sm">
                                <p className="text-sm italic text-foreground/90 leading-relaxed">
                                    "{quest.description}"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                             <p className="text-sm text-foreground/90 leading-relaxed">
                                {quest.description}
                            </p>
                        </div>
                    )}

                    {/* Objectives Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" /> Objetivos da Missão
                        </h4>
                        <div className="grid gap-2">
                            {details.objectives.map((obj, i) => {
                                const current = progressData[obj.id] || 0;
                                const isComplete = current >= obj.quantity_required;
                                
                                return (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isComplete ? 'bg-green-500/10 border-green-500/20' : 'bg-secondary/50 border-transparent'}`}>
                                        <div className="flex items-center gap-3">
                                            {isComplete ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            {obj.target_image && (
                                                <div className="w-10 h-10 rounded-md bg-secondary/50 p-1 border border-border/50 flex items-center justify-center overflow-hidden">
                                                    <img 
                                                        src={`${API_URL}/${obj.target_image}`} 
                                                        alt={obj.target_name} 
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => { e.target.style.display = 'none' }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${isComplete ? 'text-green-500 line-through opacity-70' : 'text-foreground'}`}>
                                                    {obj.description || (obj.type === 'COLLECT_ITEM' ? `Coletar ${obj.target_name || 'Item'}` : `Derrotar ${obj.target_name || 'Inimigo'}`)}
                                                </span>
                                                {status === 'IN_PROGRESS' && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({current}/{obj.quantity_required}) {obj.target_name || (obj.type === 'COLLECT_ITEM' ? 'Item' : 'Inimigo')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={isComplete ? "success" : "secondary"}>
                                            {obj.quantity_required}x
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rewards Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Gift className="h-4 w-4 text-purple-500" /> Recompensas
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {details.rewards.map((reward, i) => (
                                <div key={i} className="bg-background p-3 rounded-lg border border-border flex items-center gap-3 shadow-sm">
                                    <div className="p-2 rounded-full bg-secondary flex items-center justify-center w-12 h-12 overflow-hidden">
                                        {reward.image ? (
                                            <img 
                                                src={`${API_URL}/${reward.image}`} 
                                                alt={reward.name} 
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                        ) : (
                                            <>
                                                {reward.type === 'BITS' && <Coins className="h-5 w-5 text-yellow-500" />}
                                                {reward.type === 'ITEM' && <Backpack className="h-5 w-5 text-blue-500" />}
                                                {reward.type === 'DIGIMON' && <Dna className="h-5 w-5 text-red-500" />}
                                                {reward.type === 'XP' && <ArrowUpCircle className="h-5 w-5 text-green-500" />}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{reward.quantity}x {reward.name || ''}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{reward.type.toLowerCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            {!showActions && (
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                    Fechar
                </Button>
            )}
            {showActions && status === 'AVAILABLE' && (
                <Button onClick={() => onStart(quest.id)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold">
                    Aceitar Missão
                </Button>
            )}
            {showActions && status === 'IN_PROGRESS' && (
                <div className="flex gap-2 w-full">
                    <Button onClick={() => onCancel(quest.id)} variant="destructive" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button disabled variant="secondary" className="flex-1 opacity-80 cursor-not-allowed">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Em Progresso
                    </Button>
                </div>
            )}
            {showActions && status === 'COMPLETED' && (
                <Button onClick={() => onClaim(quest.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold animate-pulse shadow-lg shadow-green-500/20">
                    <Gift className="mr-2 h-4 w-4" /> Resgatar Recompensa
                </Button>
            )}
            {showActions && status === 'CLAIMED' && (
                isRestartable ? (
                    <div className="flex gap-2 w-full">
                        <Button onClick={() => onRestart(quest.id)} variant="secondary" className="flex-1">
                            <RotateCcw className="mr-2 h-4 w-4" /> Refazer
                        </Button>
                        <Button disabled variant="outline" className="flex-1 border-green-500/30 text-green-500 bg-green-500/5">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Concluída
                        </Button>
                    </div>
                ) : (
                    <Button disabled variant="outline" className="w-full border-green-500/30 text-green-500 bg-green-500/5">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Missão Concluída
                    </Button>
                )
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
