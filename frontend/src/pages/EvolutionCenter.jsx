import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, Unlock, ArrowUpCircle, Zap, Dna, Cpu, Terminal, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function EvolutionCenter() {
  const [userDigimons, setUserDigimons] = useState([]);
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { toast } = useToast();

  useEffect(() => {
    fetchUserDigimons();
  }, []);

  useEffect(() => {
    if (selectedDigimon) {
      fetchEvolutionLine(selectedDigimon.id);
    }
  }, [selectedDigimon]);

  const fetchUserDigimons = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}/digimons`);
      setUserDigimons(res.data);
      if (res.data.length > 0 && !selectedDigimon) {
        // Auto-select main or first
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a linha evolutiva."
      });
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
      
      toast({
        title: "Sucesso!",
        description: "Evolução desbloqueada.",
        className: "bg-green-500 text-white border-none"
      });
      
      fetchEvolutionLine(selectedDigimon.id); // Refresh
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao desbloquear",
        description: error.response?.data?.message || "Erro desconhecido"
      });
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

      toast({
        title: "Digievolução!",
        description: `Você evoluiu para ${res.data.newSpecies.name}!`,
        className: "bg-cyan-500 text-white border-none"
      });

      // Refresh everything
      fetchUserDigimons();
      fetchEvolutionLine(selectedDigimon.id);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao evoluir",
            description: error.response?.data?.message || "Erro desconhecido"
        });
    }
  };

  return (
    <div className="min-h-screen bg-black/95 text-green-500 font-mono p-4 md:p-8 bg-[url('https://transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Header Section */}
        <div className="md:col-span-12 mb-4 border-b border-green-500/30 pb-4">
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tighter uppercase">
                <Terminal className="h-8 w-8 text-green-400" />
                D-Terminal <span className="text-green-700 mx-2">//</span> Centro de Evolução
            </h1>
            <p className="text-green-600 mt-2 text-sm">v4.1.2_BETA // SYSTEM READY</p>
        </div>

        {/* Left Panel: Digimon List */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          <Card className="bg-black border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CardHeader className="bg-green-900/10 border-b border-green-500/30 py-3">
              <CardTitle className="text-lg text-green-400 flex items-center gap-2">
                <Dna className="h-4 w-4" /> PARCEIROS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] md:h-[600px]">
                <div className="p-2 space-y-1">
                  {userDigimons.map(digi => (
                    <button
                      key={digi.id}
                      onClick={() => setSelectedDigimon(digi)}
                      className={`w-full text-left p-3 rounded-sm border transition-all duration-200 flex items-center gap-3 group
                        ${selectedDigimon?.id === digi.id 
                          ? 'bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                          : 'bg-black border-transparent hover:bg-green-900/20 hover:border-green-500/30 text-green-700'
                        }`}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded bg-black border border-green-900">
                        {digi.sprite_path ? (
                            <img src={`http://localhost:5000/${digi.sprite_path}`} alt={digi.nickname} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center"><Dna className="h-6 w-6 opacity-20" /></div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm group-hover:text-green-400">{digi.nickname || 'Digimon'}</div>
                        <div className="text-xs opacity-70">Lv. {digi.level}</div>
                      </div>
                      {selectedDigimon?.id === digi.id && <Zap className="h-4 w-4 ml-auto animate-pulse text-green-400" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Evolution Tree */}
        <div className="md:col-span-8 lg:col-span-9">
          {evolutionData ? (
            <div className="space-y-6">
                
                {/* Current Status Header */}
                <Card className="bg-black border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Cpu className="h-32 w-32 text-green-500" />
                    </div>
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 z-10 relative">
                        <div className="h-32 w-32 border-2 border-green-500/50 rounded-lg bg-black flex items-center justify-center p-2 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <img 
                                src={`http://localhost:5000/${evolutionData.currentSpecies.sprite_path}`} 
                                className="max-h-full max-w-full object-contain drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                                alt="Current Form"
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-green-400 uppercase tracking-widest">{evolutionData.currentSpecies.name}</h2>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                                <Badge variant="outline" className="border-green-500 text-green-400 bg-green-500/10">Level {evolutionData.userDigimon.level}</Badge>
                                <Badge variant="outline" className="border-green-500 text-green-400 bg-green-500/10">{evolutionData.currentSpecies.type}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Evolution Line Grid */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Separator className="flex-1 bg-green-900" />
                        <span className="text-green-600 text-xs uppercase tracking-widest">Evolution Data Line</span>
                        <Separator className="flex-1 bg-green-900" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {evolutionData.line.map((evo) => {
                            const isUnlocked = evolutionData.unlockedIds.includes(evo.id);
                            const isCurrent = evo.id === evolutionData.currentSpecies.id;
                            const reqLevel = evo.evolution_level || 1;
                            const reqItem = evo.required_evoluters || 0;
                            const canUnlock = evolutionData.userDigimon.level >= reqLevel; 
                            // Note: Frontend doesn't know item count easily without extra fetch, 
                            // but backend validates. We can show requirements.

                            return (
                                <Card 
                                    key={evo.id} 
                                    className={`relative border transition-all duration-300 group
                                        ${isCurrent ? 'border-green-400 bg-green-900/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 
                                          isUnlocked ? 'border-green-800 bg-black/50 hover:border-green-600' : 
                                          'border-zinc-800 bg-black/80 opacity-70 hover:opacity-100 hover:border-green-800'
                                        }
                                    `}
                                >
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider
                                                ${isCurrent ? 'border-green-400 text-green-400' : 'border-zinc-700 text-zinc-500'}
                                            `}>
                                                {isCurrent ? 'Current' : isUnlocked ? 'Unlocked' : 'Locked'}
                                            </Badge>
                                            {isUnlocked ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-zinc-600" />}
                                        </div>
                                        <CardTitle className={`text-center mt-2 ${isCurrent ? 'text-green-300' : 'text-zinc-400 group-hover:text-green-500'}`}>
                                            {evo.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 flex flex-col items-center">
                                        <div className={`h-24 w-24 flex items-center justify-center rounded-full border-2 p-2 mb-4 bg-black
                                            ${isCurrent ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-zinc-800 group-hover:border-green-900'}
                                        `}>
                                            <img src={`http://localhost:5000/${evo.sprite_path}`} className={`max-h-full max-w-full ${!isUnlocked && !isCurrent ? 'brightness-0 invert opacity-30' : ''}`} alt={evo.name} />
                                        </div>
                                        
                                        <div className="text-xs space-y-1 w-full text-center text-zinc-500">
                                            <div className={evolutionData.userDigimon.level >= reqLevel ? 'text-green-600' : 'text-red-500'}>
                                                Level Req: {reqLevel}
                                            </div>
                                            {reqItem > 0 && (
                                                <div className="text-zinc-400">
                                                    Evoluters: {reqItem}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-3 pt-0 flex justify-center">
                                        {isCurrent ? (
                                            <Button disabled variant="outline" className="w-full border-green-500/50 text-green-500 bg-green-500/10">EQUIPPED</Button>
                                        ) : isUnlocked ? (
                                            <Button 
                                                onClick={() => handleEvolve(evo.id)}
                                                className="w-full bg-green-600 hover:bg-green-500 text-black font-bold"
                                            >
                                                EVOLVE
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => handleUnlock(evo.id)}
                                                variant="outline"
                                                className="w-full border-green-800 text-green-700 hover:bg-green-900/30 hover:text-green-400 hover:border-green-500"
                                            >
                                                UNLOCK
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-green-900/50 space-y-4 min-h-[400px]">
                <Cpu className="h-24 w-24 animate-pulse" />
                <p className="font-mono text-xl">SELECT A DIGIMON TO INITIALIZE EVOLUTION MATRIX</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
