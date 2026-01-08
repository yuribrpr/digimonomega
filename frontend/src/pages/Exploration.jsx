import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Compass, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Exploration() {
  const [maps, setMaps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  // We need to fetch user's digimon level to check if they can enter.
  // For now, let's assume we can get it or just warn.
  // Actually, let's fetch the user's main digimon level.
  const [userLevel, setUserLevel] = useState(1);

  const fetchMaps = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/maps');
      setMaps(response.data);
    } catch (error) {
      console.error('Erro ao buscar mapas:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      if (!user?.id) return;
      const res = await axios.get(`http://localhost:5000/api/items/user/${user.id}`);
      setInventory(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      setItems(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  const getRequiredItem = (map) => {
    const reqId = Number(map?.required_item_id);
    if (!reqId) return null;
    return items.find(i => Number(i.id) === reqId) || null;
  };

  const fetchUserLevel = async () => {
    if (!user?.id) return;
    try {
        const res = await axios.get(`http://localhost:5000/api/users/${user.id}/digimons`);
        // The backend returns 'principal' (1 or 0), but let's also check 'is_main' just in case
        const main = res.data.find(d => d.principal === 1 || d.is_main === 1 || d.principal === true || d.is_main === true) || res.data[0];
        
        if (main) {
            // Priority: level (current level) > base_level > 1
            const level = main.level || main.base_level || 1;
            console.log('Nível do usuário (Digimon Principal):', level, main);
            setUserLevel(level);
        }
    } catch (error) {
        console.error('Erro ao buscar nível do usuário:', error);
    }
  };

  useEffect(() => {
    fetchMaps();
    fetchUserLevel();
    fetchInventory();
    fetchItems();
  }, []);

  const handleEnterMap = (map) => {
    if (userLevel < Number(map.min_level || 0)) {
        alert(`Seu Digimon precisa ser nível ${map.min_level} para entrar aqui!`);
        return;
    }
    if (map.require_item && Number(map.required_item_id)) {
        const invItem = inventory.find(inv => Number(inv.id) === Number(map.required_item_id));
        if (!invItem || !(Number(invItem.quantity) > 0)) {
            alert('Você não possui o item necessário para acessar este mapa.');
            return;
        }
    }
    // Navigate to battle with mapId
    navigate(`/battle?mapId=${map.id}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="w-8 h-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Exploração</h1>
            <p className="text-muted-foreground">Viaje pelo Mundo Digital e encontre novos desafios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {maps.map((map) => {
          const levelLocked = userLevel < Number(map.min_level || 0);
          let itemLocked = false;
          if (map.require_item && Number(map.required_item_id)) {
            const invItem = inventory.find(inv => Number(inv.id) === Number(map.required_item_id));
            itemLocked = !(invItem && Number(invItem.quantity) > 0);
          }
          const isLocked = levelLocked || itemLocked;
          const reqItem = getRequiredItem(map);
          
          return (
            <Card key={map.id} className={`group overflow-hidden border-2 transition-all hover:border-primary/50 ${isLocked ? 'opacity-75 grayscale' : ''}`}>
                <div className="aspect-video bg-slate-950 relative overflow-hidden">
                    {map.image_path ? (
                        <img 
                            src={`http://localhost:5000/${map.image_path}`} 
                            alt={map.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                            <MapIcon className="w-12 h-12 opacity-20" />
                        </div>
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    <div className="absolute top-2 right-2">
                        <Badge variant={isLocked ? "destructive" : "secondary"} className="backdrop-blur-sm shadow-sm">
                            {isLocked ? <Lock className="w-3 h-3 mr-1" /> : null}
                            Lvl {map.min_level}+
                        </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{map.name}</h3>
                    </div>
                </div>
                
                <CardContent className="p-4 text-sm text-muted-foreground min-h-[80px]">
                    <p className="line-clamp-3">{map.description || 'Uma área misteriosa do Digimundo.'}</p>
                    {map.require_item && Number(map.required_item_id) ? (
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                        <span>Requer:</span>
                        {reqItem ? (
                          <>
                            {reqItem.icon ? (
                              <img 
                                src={`http://localhost:5000/${reqItem.icon}`} 
                                alt={reqItem.name} 
                                className="w-5 h-5 rounded-sm object-contain"
                                title={reqItem.description || reqItem.name}
                              />
                            ) : null}
                            <span title={reqItem.description || reqItem.name} className="text-slate-300">
                              {reqItem.name}
                            </span>
                          </>
                        ) : (
                          <span>Item #{map.required_item_id}</span>
                        )}
                        <span className="ml-auto">{map.consume_on_enter ? '(consome ao acessar)' : '(persistente)'}</span>
                      </div>
                    ) : null}
                </CardContent>

                <CardFooter className="p-4 pt-0">
                    <Button 
                        className="w-full" 
                        variant={isLocked ? "outline" : "default"}
                        disabled={isLocked}
                        onClick={() => handleEnterMap(map)}
                    >
                        {isLocked ? 'Bloqueado' : 'Explorar'}
                    </Button>
                </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
