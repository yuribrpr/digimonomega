import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, Swords, Shield, ShoppingBag } from 'lucide-react';
import api from '../services/api';
export default function Adoption() {
  const [digimons, setDigimons] = useState([]);
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  useEffect(() => {
    fetchDigimons();
  }, []);
  const fetchDigimons = async () => {
    try {
      const res = await api.get('/api/adoption/available');
      setDigimons(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  const handleAdopt = async () => {
    if (!selectedDigimon) return;
    setLoading(true);
    try {
      await api.post('/api/adoption/adopt', {
        user_id: user.id,
        digimon_id: selectedDigimon.id,
        nickname: nickname
      });
      alert('Digimon adotado com sucesso!');
      setSelectedDigimon(null);
      setNickname('');
    } catch (error) {
      alert('Erro ao adotar: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };
  const getTypeBadgeVariant = (type) => {
    switch (type?.toLowerCase()) {
      case 'vacina': return 'default'; 
      case 'virus': return 'destructive'; 
      case 'data': return 'secondary'; 
      default: return 'outline';
    }
  };
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Centro de Adoção
          </h1>
          <p className="text-muted-foreground text-sm">
            Novos parceiros disponíveis
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {digimons.map(d => (
          <Card 
            key={d.id} 
            className="group relative overflow-hidden transition-all hover:border-primary/50 cursor-pointer"
            onClick={() => setSelectedDigimon(d)}
          >
            <div className="aspect-square bg-muted/30 flex items-center justify-center p-4">
                <img 
                  src={''/' + d.sprite_path} 
                  alt={d.name} 
                  className="w-16 h-16 object-contain drop-shadow-sm transition-transform group-hover:scale-110" 
                  style={{imageRendering: 'pixelated'}}
                />
                <Badge variant={getTypeBadgeVariant(d.type)} className="absolute top-2 right-2 text-[10px] px-1.5 h-5">
                    {d.type}
                </Badge>
            </div>
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm truncate">{d.name}</h3>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground bg-muted/50 p-1.5 rounded-md">
                <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {d.base_hp}
                </div>
                <div className="flex items-center gap-1">
                    <Swords className="h-3 w-3" /> {d.base_attack}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 pt-0">
                <Button size="sm" variant="secondary" className="w-full text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    Adotar
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Dialog open={!!selectedDigimon} onOpenChange={(open) => !open && setSelectedDigimon(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adotar {selectedDigimon?.name}</DialogTitle>
            <DialogDescription>
              Personalize seu novo parceiro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
             {selectedDigimon && (
                <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-muted">
                    <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${selectedDigimon.sprite_path}`} 
                        alt={selectedDigimon.name} 
                        className="w-16 h-16 object-contain"
                        style={{imageRendering: 'pixelated'}}
                    />
                </div>
             )}
            <div className="grid w-full gap-2">
                <Label htmlFor="nickname">Apelido</Label>
                <Input 
                  id="nickname" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)} 
                  placeholder={selectedDigimon?.name}
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDigimon(null)}>Cancelar</Button>
            <Button onClick={handleAdopt} disabled={loading}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}