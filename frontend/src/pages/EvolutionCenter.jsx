import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
    Lock, 
    Unlock, 
    Zap, 
    Dna, 
    ArrowRight, 
    Star, 
    Shield, 
    Swords, 
    Heart,
    Sparkles,
    Search,
    Info
} from 'lucide-react';
import EvolutionAnimation from '@/components/EvolutionAnimation';
import api from '../services/api';

export default function EvolutionCenter() {
  const [userDigimons, setUserDigimons] = useState([]);
  const [filteredDigimons, setFilteredDigimons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unlockedEvolution, setUnlockedEvolution] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState("all");

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Animation State
  const [evolutionAnim, setEvolutionAnim] = useState({
    isOpen: false,
    beforeSprite: '',
    afterSprite: '',
    digimonName: '',
    targetName: ''
  });

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (searchTerm) {
        setFilteredDigimons(userDigimons.filter(d => 
            (d.nickname && d.nickname.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
    } else {
        setFilteredDigimons(userDigimons);
    }
  }, [searchTerm, userDigimons]);

  useEffect(() => {
    fetchUserDigimons();
    fetchUserInventory();
  }, []);

  useEffect(() => {
    if (selectedDigimon) {
      fetchEvolutionLine(selectedDigimon.id);
    }
  }, [selectedDigimon]);

  const fetchUserInventory = async () => {
    try {
        if (!user?.id) return;
        const res = await api.get(`/api/items/user/${user.id}`);
        setInventory(res.data);
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
  };

  const getItemQty = (itemId) => {
      const item = inventory.find(i => Number(i.item_id) === Number(itemId) || Number(i.id) === Number(itemId));
      return item ? Number(item.quantity) : 0;
  };

  const showMessage = (title, message, type = 'info') => {
      setMessageModal({ isOpen: true, title, message, type });
  };

  const fetchUserDigimons = async () => {
    try {
      if (!user?.id) return;
      const res = await api.get(`/api/users/${user.id}/digimons`);
      setUserDigimons(res.data);
      if (res.data.length > 0 && !selectedDigimon) {
        const main = res.data.find(d => d.is_main) || res.data[0];
        setSelectedDigimon(main);
      }
    } catch (error) {
      console.error('Error fetching digimons:', error);
    }
  };

  const fetchEvolutionLine = async (userDigimonId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/digimons/evolution-line/${userDigimonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvolutionData(res.data);
    } catch (error) {
      console.error('Error fetching line:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (targetDigidexId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/digimons/unlock-evolution', {
        userDigimonId: selectedDigimon.id,
        targetDigidexId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const unlockedSpecies = evolutionData.line.find(e => e.id === targetDigidexId);
      if (unlockedSpecies) {
          setUnlockedEvolution({ ...unlockedSpecies, isEvolving: false });
          setShowUnlockModal(true);
      } else {
          showMessage("Sucesso", "Evolução desbloqueada com sucesso!", "success");
      }
      
      fetchEvolutionLine(selectedDigimon.id);
      fetchUserInventory();
    } catch (error) {
      showMessage("Erro", `Erro ao desbloquear: ${error.response?.data?.message || "Erro desconhecido"}`, "error");
    }
  };

  const handleEvolve = async (targetDigidexId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/digimons/evolve', {
        userDigimonId: selectedDigimon.id,
        targetDigidexId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSpecies = evolutionData.line.find(e => e.id === targetDigidexId);
      
      if (newSpecies) {
          setEvolutionAnim({
              isOpen: true,
              beforeSprite: `${API_URL}/${evolutionData.currentSpecies.sprite_path}`,
              afterSprite: `${API_URL}/${newSpecies.sprite_path}`,
              digimonName: evolutionData.currentSpecies.name,
              targetName: newSpecies.name
          });
      } else {
          showMessage("Digievolução!", `Você evoluiu para ${res.data.newSpecies.name}!`, "success");
          fetchUserDigimons();
          fetchEvolutionLine(selectedDigimon.id);
          fetchUserInventory();
      }
    } catch (error) {
        showMessage("Erro", `Erro ao evoluir: ${error.response?.data?.message || "Erro desconhecido"}`, "error");
    }
  };

  const handleAnimationComplete = () => {
    setEvolutionAnim(prev => ({ ...prev, isOpen: false }));
    fetchUserDigimons();
    fetchEvolutionLine(selectedDigimon.id);
    fetchUserInventory();
    showMessage("Digievolução!", `Evolução concluída com sucesso!`, "success");
  };

  const getStageName = (level) => {
    switch(String(level)) {
      case '1': return 'Rookie';
      case '2': return 'Champion';
      case '3': return 'Ultimate';
      case '4': return 'Mega';
      case '5': return 'Burst Mode';
      default: return 'Desconhecido';
    }
  };

  const renderEvolutionCard = (evo) => {
    const isUnlocked = evolutionData?.unlockedIds.includes(evo.id);
    const isCurrent = evo.id === evolutionData?.currentSpecies.id;
    const reqLevel = evo.evolution_level || 1;
    const reqItemQty = evo.required_item_quantity !== undefined ? Number(evo.required_item_quantity) : (Number(evo.required_evoluters) || 0);
    const reqItemId = evo.required_item_id || 12;
    const userItemQty = getItemQty(reqItemId);
    const reqItemIcon = evo.required_item_icon || 'assets/items/1767895266042-154080746.png';
    const reqItemName = evo.required_item_name || 'Evoluter';
    const canUnlock = evolutionData?.userDigimon.level >= reqLevel; 
    const isRookie = evo.base_level === 1;
    const visualUnlocked = isUnlocked || isRookie;

    return (
        <Card 
            key={evo.id} 
            className={`flex-shrink-0 w-[180px] sm:w-[200px] max-w-full bg-card border transition-all duration-300 relative overflow-hidden group
                ${isCurrent ? 'ring-2 ring-primary border-primary shadow-lg shadow-primary/20' : 'hover:border-primary/50 hover:shadow-md'}
                ${visualUnlocked ? 'opacity-100' : 'opacity-90'}
            `}
        >
            {/* Background Gradient for Type */}
            <div className={`absolute inset-0 opacity-[0.03] pointer-events-none 
                ${evo.type === 'Virus' ? 'bg-purple-600' : 
                  evo.type === 'Vaccine' ? 'bg-green-600' : 
                  evo.type === 'Data' ? 'bg-blue-600' : 'bg-gray-600'}`} 
            />

            <CardContent className="p-3 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30">
                        {evo.type}
                    </Badge>
                    {isCurrent && <Badge className="bg-primary text-[10px] px-1.5 h-5">ATUAL</Badge>}
                    {!isCurrent && visualUnlocked && <Unlock className="h-3.5 w-3.5 text-green-500" />}
                    {!isCurrent && !visualUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>

                {/* Sprite */}
                <div className="flex-1 flex items-center justify-center py-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 rounded-full blur-xl transform scale-75" />
                    {evo.sprite_path ? (
                        <img 
                            src={`${API_URL}/${evo.sprite_path}`} 
                            className={`h-24 w-24 object-contain z-10 transition-transform duration-300 group-hover:scale-110 
                                ${!visualUnlocked ? 'grayscale brightness-75 contrast-125' : 'drop-shadow-md'}`} 
                            alt={evo.name} 
                        />
                    ) : (
                        <Dna className="h-12 w-12 text-muted-foreground/30" />
                    )}
                </div>

                {/* Info */}
                <div className="space-y-3 mt-2">
                    <div className="text-center">
                        <h4 className="font-bold text-sm truncate">{evo.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{getStageName(evo.base_level)}</p>
                    </div>

                    {/* Requirements / Actions */}
                    {!isCurrent && !isRookie && (
                        <div className="pt-2 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                                <div className={`flex items-center gap-1 justify-center rounded bg-secondary/50 py-1
                                    ${evolutionData.userDigimon.level >= reqLevel ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                    <Star className="h-3 w-3" /> Lv. {reqLevel}
                                </div>
                                {reqItemQty > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={`flex items-center gap-1 justify-center rounded bg-secondary/50 py-1 cursor-help
                                                    ${userItemQty >= reqItemQty ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                                    <img src={`${API_URL}/${reqItemIcon}`} className="h-3 w-3" alt="item" />
                                                    <span>{userItemQty}/{reqItemQty}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p className="text-xs">{reqItemName} necessário</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            {isUnlocked ? (
                                <Button 
                                    onClick={() => handleEvolve(evo.id)} 
                                    className="w-full h-8 text-xs font-medium shadow-sm" 
                                    size="sm"
                                >
                                    Evoluir
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUnlock(evo.id)}
                                    variant={canUnlock && userItemQty >= reqItemQty ? "default" : "secondary"}
                                    className="w-full h-8 text-xs font-medium"
                                    disabled={!canUnlock && !(userItemQty >= reqItemQty)}
                                >
                                    {canUnlock && userItemQty >= reqItemQty ? "Desbloquear" : "Bloqueado"}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
  };

  const renderTreeView = () => {
    if (!evolutionData?.line) return null;
    
    const nodes = evolutionData.line.map(d => ({ ...d }));
    const childrenById = new Map();
    const parentById = new Map();

    nodes.forEach(node => {
        const parent = nodes.find(p => 
            (p.next_evolution_id === node.id || node.evolution_id === p.id) && 
            p.base_level < node.base_level
        );

        if (parent) {
            parentById.set(node.id, parent.id);
            if (!childrenById.has(parent.id)) childrenById.set(parent.id, []);
            childrenById.get(parent.id).push(node);
        }
    });

    const levelMap = new Map();
    nodes.forEach(node => {
        if (!levelMap.has(node.base_level)) levelMap.set(node.base_level, []);
        levelMap.get(node.base_level).push(node);
    });

    const levels = Array.from(levelMap.keys()).sort((a, b) => a - b);
    const orderedLevels = new Map();

    levels.forEach((level, index) => {
        const currentNodes = levelMap.get(level);
        if (index === 0) {
            orderedLevels.set(level, currentNodes.sort((a, b) => a.id - b.id));
            return;
        }

        const prevLevel = levels[index - 1];
        const prevOrdered = orderedLevels.get(prevLevel) || [];
        const parentOrder = new Map(prevOrdered.map((n, idx) => [n.id, idx]));

        const sorted = [...currentNodes].sort((a, b) => {
            const parentA = parentById.get(a.id);
            const parentB = parentById.get(b.id);
            const orderA = parentOrder.has(parentA) ? parentOrder.get(parentA) : Number.MAX_SAFE_INTEGER;
            const orderB = parentOrder.has(parentB) ? parentOrder.get(parentB) : Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;
            return a.id - b.id;
        });

        orderedLevels.set(level, sorted);
    });

    return (
        <div className="w-full max-w-full flex justify-center py-6">
            <div className="flex flex-col items-center gap-8 min-w-max max-w-full">
                {levels.map((level, index) => (
                    <div key={level} className="flex flex-col items-center gap-4">
                        <div className="flex items-start justify-center gap-6">
                            {(orderedLevels.get(level) || []).map(node => (
                                <div key={node.id} className="flex flex-col items-center gap-3">
                                    <div className="relative z-10">
                                        {renderEvolutionCard(node)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {index < levels.length - 1 && (
                            <div className="flex items-center justify-center gap-6">
                                {(orderedLevels.get(level) || []).map(node => (
                                    <div key={node.id} className="flex items-center justify-center w-[200px]">
                                        {childrenById.has(node.id) ? (
                                            <div className="w-0.5 h-6 bg-border" />
                                        ) : (
                                            <div className="w-0.5 h-6 opacity-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-8 px-8">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
                Centro de Evolução
            </h1>
            <p className="text-muted-foreground">
                Descubra o potencial oculto dos seus parceiros. Desbloqueie novas formas e evolua para níveis superiores.
            </p>
        </div>

        {/* Digimon Selector - Horizontal Scroll */}
        <Card className="border-muted bg-card">
            <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Dna className="h-4 w-4 text-primary" /> 
                        Seus Parceiros
                    </CardTitle>
                    <div className="relative w-40 md:w-60">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar..." 
                            className="pl-7 h-8 text-xs" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-3 p-4">
                        {filteredDigimons.map(digi => (
                            <button
                                key={digi.id}
                                onClick={() => setSelectedDigimon(digi)}
                                className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all w-24 md:w-28
                                    ${selectedDigimon?.id === digi.id 
                                        ? 'bg-primary/10 border-primary scale-105 shadow-md' 
                                        : 'bg-background border-transparent hover:border-muted-foreground/30 hover:bg-secondary/50'
                                    }`}
                            >
                                <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all">
                                    {digi.sprite_path ? (
                                        <img src={`${API_URL}/${digi.sprite_path}`} alt={digi.nickname} className="h-full w-full object-cover scale-110" />
                                    ) : (
                                        <Dna className="h-6 w-6 text-muted-foreground/30" />
                                    )}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-xs font-bold truncate px-1">{digi.nickname || digi.name}</div>
                                    <div className="text-[10px] text-muted-foreground">Lv. {digi.level}</div>
                                </div>
                                {selectedDigimon?.id === digi.id && (
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                                        <div className="bg-primary text-primary-foreground text-[8px] px-1.5 rounded-full font-bold uppercase tracking-wider">
                                            Select
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>

        {/* Main Content Area */}
        {selectedDigimon && evolutionData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Evolution Tree */}
                <Card className="h-[70vh] border-muted/50 bg-card/50 overflow-hidden">
                    <CardHeader>
                         <CardTitle className="text-xl flex items-center gap-2">
                            <Dna className="h-5 w-5 text-primary" />
                            Árvore Evolutiva
                         </CardTitle>
                         <CardDescription>
                            Visualização completa da linha evolutiva.
                         </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 h-[70vh]">
                        <ScrollArea className="w-full h-full p-6 pb-28 max-w-full">
                            {renderTreeView()}
                            <ScrollBar orientation="horizontal" />
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </CardContent>
                </Card>

            </div>
        ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                    <Dna className="h-24 w-24 text-primary relative z-10 opacity-80" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-2xl font-bold">Selecione um Digimon</h2>
                    <p className="text-muted-foreground">
                        Escolha um dos seus parceiros na barra superior para visualizar sua linha evolutiva e gerenciar seu crescimento.
                    </p>
                </div>
            </div>
        )}

      {/* Animation Overlay */}
      <EvolutionAnimation 
        isOpen={evolutionAnim.isOpen}
        onClose={handleAnimationComplete}
        beforeSprite={evolutionAnim.beforeSprite}
        afterSprite={evolutionAnim.afterSprite}
        digimonName={evolutionAnim.digimonName}
        targetName={evolutionAnim.targetName}
      />

      {/* Messages Dialog */}
      <Dialog open={messageModal.isOpen} onOpenChange={(open) => !open && setMessageModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{messageModal.title}</DialogTitle>
                <DialogDescription>{messageModal.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}>OK</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Confirmation Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-500" />
                    Evolução Desbloqueada!
                </DialogTitle>
                <DialogDescription>
                    Você desbloqueou <strong>{unlockedEvolution?.name}</strong> com sucesso.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
                 {unlockedEvolution?.sprite_path && (
                    <div className="relative">
                         <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
                         <img 
                            src={`${API_URL}/${unlockedEvolution.sprite_path}`} 
                            alt={unlockedEvolution.name} 
                            className="h-32 w-32 object-contain relative z-10" 
                        />
                    </div>
                 )}
            </div>
            <DialogFooter className="sm:justify-center">
                <Button onClick={() => setShowUnlockModal(false)} className="w-full sm:w-auto">
                    Continuar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
