import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Backpack,
  Zap, 
  Shield, 
  Heart, 
  Search,
  Filter,
  Check,
  Plus,
  Minus
} from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/items/user/${user.id}`);
      setInventory(response.data);
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'consumable': return 'Consumíveis';
      case 'object': return 'Itens Chave';
      case 'equipable': return 'Equipamentos';
      case 'quest': return 'Itens de Missão';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const itemTypes = ['all', ...new Set(inventory.map(item => item.type))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const groupedInventory = activeTab === 'all' 
    ? {
        consumable: filteredInventory.filter(item => item.type === 'consumable'),
        object: filteredInventory.filter(item => item.type === 'object'),
        ...filteredInventory.reduce((acc, item) => {
          if (!['consumable', 'object'].includes(item.type)) {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
          }
          return acc;
        }, {})
      }
    : { [activeTab]: filteredInventory };

  const sectionOrder = ['consumable', 'object', 'equipable', 'quest'];
  const availableSections = Object.keys(groupedInventory).sort((a, b) => {
    const indexA = sectionOrder.indexOf(a);
    const indexB = sectionOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const [useModalOpen, setUseModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [useQuantity, setUseQuantity] = useState(1);
  const [useSuccess, setUseSuccess] = useState(null);
  const [isUsing, setIsUsing] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [discardQuantity, setDiscardQuantity] = useState(1);
  const [discardSuccess, setDiscardSuccess] = useState(null);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const handleOpenUseModal = (item) => {
    if (item.type !== 'consumable') return;
    setSelectedItem(item);
    setUseQuantity(1);
    setUseSuccess(null);
    setUseModalOpen(true);
  };

  const handleCloseModal = () => {
    setUseModalOpen(false);
    setSelectedItem(null);
    setUseSuccess(null);
    setIsUsing(false);
  };

  const handleConfirmUse = async () => {
    if (!selectedItem) return;
    
    setIsUsing(true);
    try {
        const response = await axios.post('http://localhost:5000/api/items/use', {
            userId: user.id,
            itemId: selectedItem.id,
            quantity: useQuantity
        });
        
        if (response.data.success) {
            setUseSuccess(response.data.message);
            fetchInventory(); 
        }
    } catch (error) {
        console.error('Erro ao usar item:', error);
        alert(error.response?.data?.message || 'Erro ao usar item');
        setIsUsing(false);
    }
  };
  
  const handleOpenDiscardModal = (item) => {
    setSelectedItem(item);
    setDiscardQuantity(1);
    setDiscardSuccess(null);
    setDiscardModalOpen(true);
  };
  
  const handleCloseDiscardModal = () => {
    setDiscardModalOpen(false);
    setSelectedItem(null);
    setDiscardSuccess(null);
    setIsDiscarding(false);
  };
  
  const handleConfirmDiscard = async () => {
    if (!selectedItem) return;
    setIsDiscarding(true);
    try {
      const response = await axios.post('http://localhost:5000/api/items/discard', {
        userId: user.id,
        itemId: selectedItem.id,
        quantity: discardQuantity
      });
      if (response.data.success) {
        setDiscardSuccess(response.data.message);
        fetchInventory();
      }
    } catch (error) {
      console.error('Erro ao descartar item:', error);
      alert(error.response?.data?.message || 'Erro ao descartar item');
      setIsDiscarding(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
              <Backpack className="w-8 h-8 text-primary" />
          </div>
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
              <p className="text-muted-foreground">Gerencie seus itens e equipamentos.</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar item..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-4 overflow-x-auto">
        {itemTypes.map(type => (
          <Button 
            key={type}
            variant={activeTab === type ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab(type)}
            className="rounded-full capitalize whitespace-nowrap"
          >
            {type === 'all' ? 'Todos' : getTypeLabel(type)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">
            Carregando inventário...
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-secondary/10">
            <Backpack className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Mochila Vazia</h3>
            <p className="text-muted-foreground mt-2">Você ainda não possui nenhum item.</p>
            <p className="text-xs text-muted-foreground mt-1">Explore mapas e derrote inimigos para encontrar itens.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {availableSections.map(type => {
            const items = groupedInventory[type];
            if (items.length === 0) return null;
            
            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{getTypeLabel(type)}</h2>
                  <Badge variant="outline" className="text-xs">{items.length}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.map((slot) => (
                    <Card key={slot.inventory_id} className="relative group overflow-hidden border-muted hover:border-primary/50 transition-all">
                      <CardContent className="p-4 flex flex-col items-center text-center space-y-3 pt-6">
                          <div className="w-16 h-16 bg-secondary/50 rounded-md flex items-center justify-center mb-2 relative">
                              {slot.icon ? (
                                  <img src={`http://localhost:5000/${slot.icon}`} alt={slot.name} className="w-12 h-12 object-contain" />
                              ) : (
                                  <Backpack className="w-8 h-8 text-muted-foreground/50" />
                              )}
                              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                                  {slot.quantity}
                              </Badge>
                          </div>
                          
                          <div>
                              <h3 className="font-bold text-sm leading-tight min-h-[2.5em] flex items-center justify-center">{slot.name}</h3>
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">{slot.description}</p>
                          </div>

                          {slot.type === 'consumable' && slot.effect_target !== 'none' && (
                              <div className="flex items-center gap-1 text-[10px] font-mono bg-secondary/30 px-2 py-1 rounded w-full justify-center">
                                  {slot.effect_target === 'attack' && <Zap className="w-3 h-3 text-yellow-500" />}
                                  {slot.effect_target === 'defense' && <Shield className="w-3 h-3 text-blue-500" />}
                                  {slot.effect_target === 'hp' && <Heart className="w-3 h-3 text-red-500" />}
                                  <span className="uppercase">{slot.effect_target === 'hp' ? 'HP' : slot.effect_target === 'attack' ? 'ATK' : 'DEF'}</span>
                                  <span className="font-bold">+{slot.effect_value}{slot.is_percent ? '%' : ''}</span>
                              </div>
                          )}
                          
                          <div className="w-full pt-2 mt-auto">
                              <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="w-full text-xs h-7"
                                  onClick={() => handleOpenUseModal(slot)}
                                  disabled={slot.type !== 'consumable'}
                              >
                                  {slot.type === 'consumable' ? 'Usar' : slot.type === 'equipable' ? 'Equipar' : 'Detalhes'}
                              </Button>
                              <Button 
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs h-7 mt-2"
                                  onClick={() => handleOpenDiscardModal(slot)}
                              >
                                  Descartar
                              </Button>
                          </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Uso de Item */}
      <Dialog open={useModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{useSuccess ? 'Sucesso!' : 'Usar Item'}</DialogTitle>
            {!useSuccess && selectedItem && <DialogDescription>Escolha a quantidade que deseja usar.</DialogDescription>}
          </DialogHeader>
          
          {useSuccess ? (
            <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">{useSuccess}</p>
                <Button onClick={handleCloseModal} className="w-full">Fechar</Button>
            </div>
          ) : (
            selectedItem && (
                <div className="space-y-6 py-2">
                    <div className="flex items-center gap-4">
                         <div className="bg-secondary/20 rounded-md p-2">
                            {selectedItem.icon ? (
                                <img src={`http://localhost:5000/${selectedItem.icon}`} alt={selectedItem.name} className="w-12 h-12 object-contain" />
                            ) : <Backpack className="w-12 h-12 text-muted-foreground" />}
                         </div>
                         <div>
                             <h3 className="font-bold">{selectedItem.name}</h3>
                             <p className="text-xs text-muted-foreground">{selectedItem.description}</p>
                             <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                <span>Disponível: {selectedItem.quantity}</span>
                             </div>
                         </div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Quantidade</Label>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setUseQuantity(Math.max(1, useQuantity - 1))}
                                disabled={useQuantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input 
                                type="number" 
                                value={useQuantity} 
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setUseQuantity(Math.max(1, Math.min(val, selectedItem.quantity)));
                                }}
                                className="text-center h-8"
                            />
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setUseQuantity(Math.min(selectedItem.quantity, useQuantity + 1))}
                                disabled={useQuantity >= selectedItem.quantity}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <button className="hover:underline" onClick={() => setUseQuantity(1)}>Mínimo</button>
                            <button className="hover:underline" onClick={() => setUseQuantity(selectedItem.quantity)}>Máximo</button>
                        </div>
                    </div>
                    
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto">Cancelar</Button>
                        <Button onClick={handleConfirmUse} disabled={isUsing} className="w-full sm:w-auto">
                            {isUsing ? 'Usando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </div>
            )
        )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={discardModalOpen} onOpenChange={handleCloseDiscardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{discardSuccess ? 'Sucesso!' : 'Descartar Item'}</DialogTitle>
            {!discardSuccess && selectedItem && <DialogDescription>Escolha a quantidade que deseja descartar.</DialogDescription>}
          </DialogHeader>
          
          {discardSuccess ? (
            <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">{discardSuccess}</p>
                <Button onClick={handleCloseDiscardModal} className="w-full">Fechar</Button>
            </div>
          ) : (
            selectedItem && (
                <div className="space-y-6 py-2">
                    <div className="flex items-center gap-4">
                         <div className="bg-secondary/20 rounded-md p-2">
                            {selectedItem.icon ? (
                                <img src={`http://localhost:5000/${selectedItem.icon}`} alt={selectedItem.name} className="w-12 h-12 object-contain" />
                            ) : <Backpack className="w-12 h-12 text-muted-foreground" />}
                         </div>
                         <div>
                             <h3 className="font-bold">{selectedItem.name}</h3>
                             <p className="text-xs text-muted-foreground">{selectedItem.description}</p>
                             <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                <span>Disponível: {selectedItem.quantity}</span>
                             </div>
                         </div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Quantidade</Label>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setDiscardQuantity(Math.max(1, discardQuantity - 1))}
                                disabled={discardQuantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input 
                                type="number" 
                                value={discardQuantity} 
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setDiscardQuantity(Math.max(1, Math.min(val, selectedItem.quantity)));
                                }}
                                className="text-center h-8"
                            />
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setDiscardQuantity(Math.min(selectedItem.quantity, discardQuantity + 1))}
                                disabled={discardQuantity >= selectedItem.quantity}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <button className="hover:underline" onClick={() => setDiscardQuantity(1)}>Mínimo</button>
                            <button className="hover:underline" onClick={() => setDiscardQuantity(selectedItem.quantity)}>Máximo</button>
                        </div>
                    </div>
                    
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button variant="outline" onClick={handleCloseDiscardModal} className="w-full sm:w-auto">Cancelar</Button>
                        <Button onClick={handleConfirmDiscard} disabled={isDiscarding} className="w-full sm:w-auto">
                            {isDiscarding ? 'Descartando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
