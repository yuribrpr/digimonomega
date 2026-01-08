import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    ChevronRight,
    Sparkles
} from 'lucide-react';

import EvolutionAnimation from '@/components/EvolutionAnimation';

export default function EvolutionCenter() {
  const [userDigimons, setUserDigimons] = useState([]);
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unlockedEvolution, setUnlockedEvolution] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
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
        const res = await axios.get(`http://localhost:5000/api/items/user/${user.id}`);
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
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}/digimons`);
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
      const res = await axios.get(`http://localhost:5000/api/digimons/evolution-line/${userDigimonId}`, {
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
      await axios.post('http://localhost:5000/api/digimons/unlock-evolution', {
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
      const res = await axios.post('http://localhost:5000/api/digimons/evolve', {
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
              beforeSprite: `http://localhost:5000/${evolutionData.currentSpecies.sprite_path}`,
              afterSprite: `http://localhost:5000/${newSpecies.sprite_path}`,
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
    <div className="min-h-screen bg-background p-6 md:p-8">
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
            <Card className="h-[calc(100vh-200px)] border-muted flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Dna className="h-5 w-5 text-primary" /> 
                  Seus Parceiros
                </CardTitle>
                <CardDescription>Selecione um Digimon para ver sua linha evolutiva.</CardDescription>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {userDigimons.map(digi => (
                  <div
                    key={digi.id}
                    onClick={() => setSelectedDigimon(digi)}
                    className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md
                      ${selectedDigimon?.id === digi.id 
                        ? 'bg-secondary/40 border-primary/50 shadow-sm' 
                        : 'bg-card border-transparent hover:bg-secondary/20 hover:border-border'
                      }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/20 border border-border flex items-center justify-center">
                      {digi.sprite_path ? (
                          <img src={`http://localhost:5000/${digi.sprite_path}`} alt={digi.nickname} className="h-full w-full object-cover" />
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
                  {/* Current Form Card */}
                  <Card className="border-muted bg-gradient-to-br from-card to-secondary/10 overflow-hidden">
                      <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/3 bg-secondary/20 p-6 flex items-center justify-center border-r border-border/50">
                                  <div className="relative w-40 h-40">
                                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50"></div>
                                      <img 
                                          src={`http://localhost:5000/${evolutionData.currentSpecies.sprite_path}`} 
                                          className="relative z-10 w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                                          alt="Current Form"
                                      />
                                  </div>
                              </div>
                              <div className="flex-1 p-6 space-y-6">
                                  <div>
                                      <div className="flex items-center justify-between mb-2">
                                          <Badge variant="outline" className="uppercase tracking-widest text-xs">{evolutionData.currentSpecies.type}</Badge>
                                          <Badge className="bg-primary text-primary-foreground">{getStageName(evolutionData.currentSpecies.base_level)}</Badge>
                                      </div>
                                      <h2 className="text-3xl font-bold tracking-tight">{evolutionData.currentSpecies.name}</h2>
                                      <p className="text-muted-foreground text-sm">Forma Atual</p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                      <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                                          <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                                          <span className="text-xs text-muted-foreground uppercase">HP</span>
                                          <p className="font-bold text-lg">{evolutionData.currentSpecies.base_hp}</p>
                                      </div>
                                      <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                                          <Swords className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                                          <span className="text-xs text-muted-foreground uppercase">ATK</span>
                                          <p className="font-bold text-lg">{evolutionData.currentSpecies.base_attack}</p>
                                      </div>
                                      <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                                          <Shield className="h-4 w-4 mx-auto mb-1 text-green-500" />
                                          <span className="text-xs text-muted-foreground uppercase">DEF</span>
                                          <p className="font-bold text-lg">{evolutionData.currentSpecies.base_defense}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </CardContent>
                  </Card>

                  {/* Evolution Line Grid */}
                  <div>
                      <div className="flex items-center gap-2 mb-4">
                          <Zap className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-semibold">Linha Evolutiva</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {evolutionData.line.map((evo) => {
                              const isUnlocked = evolutionData.unlockedIds.includes(evo.id);
                              const isCurrent = evo.id === evolutionData.currentSpecies.id;
                              const reqLevel = evo.evolution_level || 1;
                              const reqItemQty = evo.required_item_quantity !== undefined ? Number(evo.required_item_quantity) : (Number(evo.required_evoluters) || 0);
                              const reqItemId = evo.required_item_id || 12;
                              const userItemQty = getItemQty(reqItemId);
                              const reqItemIcon = evo.required_item_icon || 'assets/items/1767895266042-154080746.png'; // Default to Evoluter icon
                              const reqItemName = evo.required_item_name || 'Evoluter';

                              const canUnlock = evolutionData.userDigimon.level >= reqLevel; 
                              
                              if (isCurrent) return null; // Skip current form in the grid as it's shown above

                              return (
                                  <Card 
                                      key={evo.id} 
                                      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg border-muted
                                          ${isUnlocked ? 'opacity-100' : 'opacity-70 bg-secondary/10'}
                                      `}
                                  >
                                      <CardContent className="p-5 space-y-4">
                                          <div className="flex justify-between items-start">
                                              <Badge variant="outline" className="text-[10px] uppercase">{getStageName(evo.base_level)}</Badge>
                                              {isUnlocked ? (
                                                  <Unlock className="h-4 w-4 text-green-500" />
                                              ) : (
                                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                              )}
                                          </div>

                                          <div className="h-32 w-full bg-secondary/20 rounded-lg flex items-center justify-center p-2">
                                              <img 
                                                  src={`http://localhost:5000/${evo.sprite_path}`} 
                                                  className={`h-full object-contain transition-all duration-500 ${!isUnlocked ? 'grayscale blur-[1px]' : 'hover:scale-110'}`} 
                                                  alt={evo.name} 
                                              />
                                          </div>

                                          <div className="text-center">
                                              <h4 className="font-bold text-lg">{evo.name}</h4>
                                              <p className="text-xs text-muted-foreground uppercase tracking-wider">{evo.type}</p>
                                          </div>

                                          <div className="h-px bg-border w-full" />

                                          <div className="space-y-3">
                                              <div className="flex justify-between items-center text-xs">
                                                  <span className="text-muted-foreground">Requisitos:</span>
                                                  <div className="flex gap-2">
                                                      <span className={`flex items-center gap-1 ${evolutionData.userDigimon.level >= reqLevel ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                          <Star className="h-3 w-3" /> Lv.{reqLevel}
                                                      </span>
                                                      {reqItemQty > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 font-medium cursor-help bg-secondary/50 px-2 py-0.5 rounded-full border border-border text-xs">
                                                <img 
                                                    src={`http://localhost:5000/${reqItemIcon}`} 
                                                    alt={reqItemName} 
                                                    className="h-3 w-3 object-contain drop-shadow-sm" 
                                                />
                                                {reqItemQty}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-popover border-border p-3 space-y-2">
                                            <p className="font-semibold text-sm flex items-center gap-2">
                                                 <img src={`http://localhost:5000/${reqItemIcon}`} className="h-4 w-4" />
                                                 {reqItemName} (Item)
                                            </p>
                                            <div className="text-xs space-y-1 text-muted-foreground">
                                                <div className="flex justify-between gap-4">
                                                    <span>Necessário:</span>
                                                    <span className="font-mono text-foreground">{reqItemQty}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span>Você possui:</span>
                                                    <span className={`font-mono font-bold ${userItemQty >= reqItemQty ? 'text-green-500' : 'text-red-500'}`}>{userItemQty}</span>
                                                </div>
                                                <div className="pt-1 border-t mt-1 flex justify-between gap-4">
                                                    <span>Progresso:</span>
                                                    <span className="font-mono text-foreground">
                                                        {Math.min(100, Math.floor((userItemQty / reqItemQty) * 100))}%
                                                    </span>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                                                  </div>
                                              </div>

                                              {isUnlocked ? (
                                                  <Button 
                                                      onClick={() => handleEvolve(evo.id)}
                                                      className="w-full"
                                                      size="sm"
                                                  >
                                                      Selecionar
                                                  </Button>
                                              ) : (
                                                  <Button 
                                                      onClick={() => handleUnlock(evo.id)}
                                                      variant={canUnlock && userItemQty >= reqItemQty ? "default" : "secondary"}
                                                      className="w-full"
                                                      size="sm"
                                                      disabled={!canUnlock || userItemQty < reqItemQty}
                                                  >
                                                      {canUnlock && userItemQty >= reqItemQty ? (
                                                          <>
                                                              <Unlock className="mr-1 h-3 w-3" /> Desbloquear
                                                          </>
                                                      ) : (
                                                          <>
                                                              <Lock className="mr-1 h-3 w-3" /> Bloqueado
                                                          </>
                                                      )}
                                                  </Button>
                                              )}
                                          </div>
                                      </CardContent>
                                  </Card>
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
                            src={`http://localhost:5000/${unlockedEvolution.sprite_path}`}
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
