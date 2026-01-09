import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Shield, Swords, Dna, ArrowRight, Zap } from 'lucide-react';
import api from '../services/api';
export default function Digidex() {
  const navigate = useNavigate();
  const [digimons, setDigimons] = useState([]);
  const [filteredDigimons, setFilteredDigimons] = useState([]);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const fetchDigimons = async () => {
    try {
      const response = await api.get('/api/digimons');
      setDigimons(response.data);
      setFilteredDigimons(response.data);
    } catch (error) {
      console.error('Erro ao buscar digimons:', error);
    }
  };
  useEffect(() => {
    fetchDigimons();
  }, []);
  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = digimons.filter(d => 
      d.name.toLowerCase().includes(term) ||
      (d.evolution_line_id && d.evolution_line_id.toLowerCase().includes(term))
    );
    setFilteredDigimons(filtered);
  }, [search, digimons]);
  const getStageName = (level) => {
    switch(level) {
      case 1: return 'Rookie';
      case 2: return 'Champion';
      case 3: return 'Ultimate';
      case 4: return 'Mega';
      case 5: return 'Burst Mode';
      default: return 'Desconhecido';
    }
  };
  const getDigimonName = (id) => {
    const digimon = digimons.find(d => d.id === id);
    return digimon ? digimon.name : 'Desconhecido';
  };
  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <h1 className="text-4xl font-bold mb-8">Digimon Omega</h1>
            <div className="space-x-4">
                <Button onClick={() => navigate('/login')}>Entrar</Button>
                <Button variant="outline" onClick={() => navigate('/register')}>Cadastrar</Button>
            </div>
        </div>
     );
  }
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Digidex</h1>
            <p className="text-muted-foreground">Enciclopédia de todos os Digimons descobertos.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
        </header>
        <div className="mb-8 relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por Nome ou Linha Evolutiva..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDigimons.map((digimon) => (
            <Card key={digimon.id} className="hover:shadow-lg transition-shadow border-muted">
              <CardHeader className="text-center pb-2">
                 <div className="w-full h-40 bg-secondary/20 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    {digimon.sprite_path ? (
                        <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${digimon.sprite_path}`} 
                            alt={digimon.name}
                            className="h-full object-contain mix-blend-multiply"
                            onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=Sem+Imagem'; }}
                        />
                    ) : (
                        <span className="text-muted-foreground">Sem Imagem</span>
                    )}
                 </div>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle className="text-lg">{digimon.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{getStageName(digimon.base_level)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase tracking-wider">{digimon.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center p-2 bg-secondary/10 rounded">
                        <Heart className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="font-bold">{digimon.base_hp}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-secondary/10 rounded">
                        <Swords className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="font-bold">{digimon.base_attack}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-secondary/10 rounded">
                        <Shield className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="font-bold">{digimon.base_defense}</span>
                    </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-muted-foreground">
                        <Dna className="h-3 w-3 mr-1" />
                        <span>Linha:</span>
                    </div>
                    <span className="font-medium">{digimon.evolution_line_id || '-'}</span>
                  </div>
                  {digimon.required_evoluters > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center text-muted-foreground">
                            <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                            <span>Evoluters:</span>
                        </div>
                        <span className="font-medium">{digimon.required_evoluters}</span>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
