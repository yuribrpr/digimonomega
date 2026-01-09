import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { 
    Lock, 
    Unlock, 
    Zap, 
    Dna, 
    ArrowRight, 
    ArrowDown,
    Star, 
    Shield, 
    Swords, 
    Heart,
    ChevronRight,
    Sparkles,
    Search
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      // Check both item_id and id to be safe
      const item = inventory.find(i => Number(i.item_id) === Number(itemId) || Number(i.id) === Number(itemId));
      return item ? Number(item.quantity) : 0;
  };
  const showMessage = (title, message, type = 'info') => {
      setMessageModal({ isOpen: true, title, message, type });
  };
  const fetchUserDigimons = async () => {
    try {
      const res = await api.get(`/api/users/${user.id}/digimons`);
      setDigimons(res.data);
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
      // Trigger Animation instead of immediate success message
      if (newSpecies) {
          setEvolutionAnim({
              isOpen: true,
              beforeSprite: `${API_URL}/${evolutionData.currentSpecies.sprite_path}`,
              afterSprite: `${API_URL}/${newSpecies.sprite_path}`,
              digimonName: evolutionData.currentSpecies.name,
              targetName: newSpecies.name
          });
      } else {
          // Fallback if something weird happens
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
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Centro de Evolução</h1>
                <p className="text-muted-foreground">Gerencie o crescimento e as formas dos seus Digimons.</p>
            </div>
            {selectedDigimon && (
                <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">Digimon Selecionado: {selectedDigimon.nickname || selectedDigimon.name}</span>
                </div>
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Digimon List */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="h-[calc(100vh-200px)] border-muted flex flex-col bg-transparent">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Dna className="h-5 w-5 text-primary" /> 
                  Seus Parceiros
                </CardTitle>
                <CardDescription>Selecione um Digimon para ver sua linha evolutiva.</CardDescription>
              </CardHeader>
              <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar Digimon..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredDigimons.map(digi => (
                  <div
                    key={digi.id}
                    onClick={() => setSelectedDigimon(digi)}
                    className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md
                      ${selectedDigimon?.id === digi.id 
                        ? 'bg-transparent border-primary/50 shadow-sm' 
                        : 'bg-transparent border-transparent hover:border-border'
                      }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-transparent border border-border flex items-center justify-center">
                      {digi.sprite_path ? (
                          <img src={`${API_URL}/${digi.sprite_path}`} alt={digi.nickname} className="h-full w-full object-cover" />
                      ) : (
                          <Dna className="h-6 w-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-2">
                          {digi.nickname || digi.name}
                          {digi.is_main && <Badge variant="secondary" className="text-[10px] h-4 px-1">MAIN</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Lv. {digi.level}</span>
                          <span className="uppercase tracking-wider">{digi.type}</span>
                      </div>
                    </div>
                    {selectedDigimon?.id === digi.id && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <ChevronRight className="h-5 w-5 text-primary opacity-50" />
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Right Panel: Evolution Tree */}
          <div className="lg:col-span-8 space-y-6">
            {evolutionData ? (
              <>
                  {/* Evolution Line Organogram */}
                  <div>
                      <div className="flex items-center gap-2 mb-4">
                          <Zap className="h-4 w-4 text-primary" />
                          <h3 className="text-lg font-semibold">Árvore Evolutiva</h3>
                      </div>
                      <div className="space-y-4 py-2">
                          {[1, 2, 3, 4, 5].map((level, index) => {
                              const digimonsInLevel = evolutionData.line.filter(e => e.base_level === level);
                              if (digimonsInLevel.length === 0) return null;
                              return (
                                <div key={level} className="flex flex-col items-center">
                                    {/* Level Badge */}
                                    <Badge variant="outline" className="mb-2 px-2 py-0.5 text-[10px] uppercase tracking-widest border-primary/20 bg-primary/5">
                                        {getStageName(level)}
                                    </Badge>
                                    {/* Cards Row */}
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {digimonsInLevel.map((evo) => {
                                            const isUnlocked = evolutionData.unlockedIds.includes(evo.id);
                                            const isCurrent = evo.id === evolutionData.currentSpecies.id;
                                            const reqLevel = evo.evolution_level || 1;
                                            const reqItemQty = evo.required_item_quantity !== undefined ? Number(evo.required_item_quantity) : (Number(evo.required_evoluters) || 0);
                                            const reqItemId = evo.required_item_id || 12;
                                            const userItemQty = getItemQty(reqItemId);
                                            const reqItemIcon = evo.required_item_icon || 'assets/items/1767895266042-154080746.png';
                                            const reqItemName = evo.required_item_name || 'Evoluter';
                                            const canUnlock = evolutionData.userDigimon.level >= reqLevel; 
                                            // Rookie (Level 1) is visually unlocked
                                            const isRookie = evo.base_level === 1;
                                            const visualUnlocked = isUnlocked || isRookie;
                                            return (
                                                <Card 
                                                    key={evo.id} 
                                                    className={`relative overflow-hidden transition-all duration-300 w-[160px] md:w-[180px] bg-transparent
                                                        ${isCurrent ? 'ring-1 ring-primary border-primary shadow-md shadow-primary/20' : 'border-muted'}
                                                        ${visualUnlocked ? 'opacity-100' : 'opacity-80'}
                                                    `}
                                                >
                                                    <CardContent className="p-2 space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[9px] text-muted-foreground uppercase font-bold">{evo.type}</span>
                                                            {isCurrent ? (
                                                                <Badge className="bg-primary text-[9px] h-4 px-1">ATUAL</Badge>
                                                            ) : (
                                                                visualUnlocked ? (
                                                                    <Unlock className="h-3 w-3 text-green-500" />
                                                                ) : (
                                                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="h-16 w-full rounded-lg flex items-center justify-center p-1 bg-transparent">
                                                            <img 
                                                                src={`${API_URL}/${evo.sprite_path}`} 
                                                                className={`h-full object-contain transition-all duration-500 ${!visualUnlocked ? 'grayscale blur-[1px]' : 'hover:scale-110'}`} 
                                                                alt={evo.name} 
                                                            />
                                                        </div>
                                                        <div className="text-center">
                                                            <h4 className="font-bold text-sm truncate leading-tight">{evo.name}</h4>
                                                        </div>
                                                        {!isCurrent && !isRookie && (
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-center items-center gap-2 text-[10px]">
                                                                    <span className={`flex items-center gap-0.5 ${evolutionData.userDigimon.level >= reqLevel ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                                        <Star className="h-2.5 w-2.5" /> {reqLevel}
                                                                    </span>
                                                                    {reqItemQty > 0 && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <span className={`flex items-center gap-0.5 cursor-help px-1 py-0 rounded border ${userItemQty >= reqItemQty ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-secondary border-border text-muted-foreground'}`}>
                                                                                        <img 
                                                            src={`${API_URL}/${reqItemIcon}`} 
                                                            alt={reqItemName} 
                                                            className="h-2.5 w-2.5 object-contain" 
                                                        />
                                                                                        {reqItemQty}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p className="text-xs">{reqItemName}: {userItemQty}/{reqItemQty}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                                {isUnlocked ? (
                                                                    <Button onClick={() => handleEvolve(evo.id)} className="w-full h-6 text-[10px]" size="sm" variant="outline">
                                                                        Evoluir
                                                                    </Button>
                                                                ) : (
                                                                    <Button 
                                                                        onClick={() => handleUnlock(evo.id)}
                                                                        variant={canUnlock && userItemQty >= reqItemQty ? "default" : "secondary"}
                                                                        className="w-full h-6 text-[10px]"
                                                                        size="sm"
                                                                        disabled={!canUnlock || userItemQty < reqItemQty}
                                                                    >
                                                                        {canUnlock && userItemQty >= reqItemQty ? "Desbloquear" : "Bloqueado"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                         {isRookie && !isCurrent && (
                                                             <Button onClick={() => handleEvolve(evo.id)} variant="ghost" className="w-full h-6 text-[10px]" size="sm">
                                                                 Voltar
                                                             </Button>
                                                         )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                    {/* Connection Line/Arrow to next level */}
                                    {index < 4 && evolutionData.line.some(e => e.base_level === level + 1) && (
                                        <div className="h-4 w-px bg-border my-1 relative">
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                <ArrowDown className="h-3 w-3 text-muted-foreground/30" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                              );
                          })}
                      </div>
                  </div>
              </>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground p-8 border-2 border-dashed border-muted rounded-xl bg-secondary/5">
                  <div className="h-20 w-20 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                    <Dna className="h-10 w-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nenhum Digimon Selecionado</h3>
                  <p className="text-sm max-w-xs text-center">Selecione um dos seus parceiros na lista ao lado para visualizar e gerenciar suas evoluções.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-secondary/20 border-primary/20">
            <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    {unlockedEvolution?.isEvolving ? 'Digievolução Completa!' : 'Evolução Desbloqueada!'}
                </DialogTitle>
            </DialogHeader>
            {unlockedEvolution && (
                <div className="flex flex-col items-center py-6 space-y-6">
                    {/* Animation Container */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Background Burst */}
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                        {/* Rotating Rings */}
                        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-[spin_3s_linear_infinite]" />
                        <div className="absolute inset-4 border-2 border-purple-500/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                        {/* Sprite */}
                        <img 
                            src={`${API_URL}/${unlockedEvolution.sprite_path}`}
                            alt={unlockedEvolution.name}
                            className="relative z-10 w-40 h-40 object-contain animate-in zoom-in-0 duration-700" 
                        />
                    </div>
                    <div className="text-center space-y-2">
                        <Badge variant="outline" className="text-sm px-3 py-1 border-primary/50 text-primary">
                            {getStageName(unlockedEvolution.base_level)}
                        </Badge>
                        <h3 className="text-3xl font-bold">{unlockedEvolution.name}</h3>
                        <p className="text-muted-foreground uppercase tracking-widest text-xs">{unlockedEvolution.type}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full px-4">
                        <div className="text-center p-2 bg-secondary/30 rounded-lg">
                            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                            <span className="font-bold">{unlockedEvolution.base_hp}</span>
                        </div>
                        <div className="text-center p-2 bg-secondary/30 rounded-lg">
                            <Swords className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                            <span className="font-bold">{unlockedEvolution.base_attack}</span>
                        </div>
                        <div className="text-center p-2 bg-secondary/30 rounded-lg">
                            <Shield className="h-4 w-4 mx-auto mb-1 text-green-500" />
                            <span className="font-bold">{unlockedEvolution.base_defense}</span>
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter className="sm:justify-center">
                <Button onClick={() => setShowUnlockModal(false)} className="w-full sm:w-auto min-w-[150px]">
                    Confirmar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={messageModal.isOpen} onOpenChange={(open) => setMessageModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className={messageModal.type === 'error' ? 'text-destructive' : 'text-primary'}>
                {messageModal.title}
            </DialogTitle>
            <DialogDescription>
                {messageModal.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EvolutionAnimation 
        isOpen={evolutionAnim.isOpen}
        onClose={handleAnimationComplete}
        beforeSprite={evolutionAnim.beforeSprite}
        afterSprite={evolutionAnim.afterSprite}
        digimonName={evolutionAnim.digimonName}
        targetName={evolutionAnim.targetName}
      />
    </div>
  );
}
