import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Search, Package, Zap, Shield, Heart, Info } from 'lucide-react';
import api from '../services/api';
export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('consumable');
  const [effectTarget, setEffectTarget] = useState('none');
  const [effectValue, setEffectValue] = useState('');
  const [isPercent, setIsPercent] = useState(false);
  const [recoveryType, setRecoveryType] = useState('max'); // 'max' or 'current'
  const [file, setFile] = useState(null);
  useEffect(() => {
    fetchItems();
  }, []);
  useEffect(() => {
    if (searchTerm) {
      setFilteredItems(items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())));
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);
  const fetchItems = async () => {
    try {
      const response = await api.get('/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('type', type);
    if (type === 'consumable') {
        formData.append('effect_target', effectTarget);
        formData.append('effect_value', effectValue);
        formData.append('is_percent', isPercent);
        formData.append('recovery_type', recoveryType);
    }
    if (file) {
      formData.append('icon', file);
    }
    try {
      if (editingId) {
        await api.put(`/api/items/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchItems();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await api.delete(`/api/items/${id}`);
        fetchItems();
      } catch (error) {
        console.error('Erro ao excluir item:', error);
      }
    }
  };
  const resetForm = () => {
    setName('');
    setDescription('');
    setType('consumable');
    setEffectTarget('none');
    setEffectValue('');
    setIsPercent(false);
    setFile(null);
    setEditingId(null);
  };
  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setType(item.type || 'consumable');
    setEffectTarget(item.effect_target || 'none');
    setEffectValue(item.effect_value || '');
    setIsPercent(item.is_percent === 1 || item.is_percent === true);
    setRecoveryType(item.recovery_type || 'max');
    setFile(null);
    setIsOpen(true);
  };
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Gerenciar Itens</h1>
           <p className="text-muted-foreground">Adicione e gerencie os itens do jogo.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Novo Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Item' : 'Criar Novo Item'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Atualize os dados do item.' : 'Preencha os dados do novo item.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Input id="icon" type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumable">Consumível</SelectItem>
                    <SelectItem value="object">Objeto (Key Item)</SelectItem>
                    <SelectItem value="equipable">Equipável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === 'consumable' && (
                <div className="space-y-4 border p-4 rounded-md bg-secondary/20">
                    <h4 className="font-semibold text-sm">Efeitos do Consumível</h4>
                    <div className="space-y-2">
                        <Label>Atributo Afetado</Label>
                        <Select value={effectTarget} onValueChange={setEffectTarget}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                <SelectItem value="hp">Vida (HP)</SelectItem>
                                <SelectItem value="attack">Ataque</SelectItem>
                                <SelectItem value="defense">Defesa</SelectItem>
                                <SelectItem value="xp">Experiência (XP)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {effectTarget === 'hp' && (
                        <div className="space-y-2">
                            <Label>Tipo de Recuperação</Label>
                            <Select value={recoveryType} onValueChange={setRecoveryType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="max">Aumentar HP Máximo (Permanente)</SelectItem>
                                    <SelectItem value="current">Recuperar HP Atual (Batalha)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <Label>Valor</Label>
                            <Input 
                                type="number" 
                                value={effectValue} 
                                onChange={(e) => setEffectValue(e.target.value)} 
                                placeholder="Ex: 500"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pb-3">
                            <Checkbox 
                                id="is_percent" 
                                checked={isPercent} 
                                onCheckedChange={setIsPercent}
                            />
                            <Label htmlFor="is_percent" className="cursor-pointer">É Porcentagem?</Label>
                        </div>
                    </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit">{editingId ? 'Salvar' : 'Criar Item'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center space-x-2 bg-secondary/30 p-2 rounded-md border w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar item..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative group overflow-hidden">
             <CardContent className="p-4 flex flex-col items-center text-center space-y-3 pt-6">
                <div className="w-16 h-16 bg-secondary/50 rounded-md flex items-center justify-center mb-2 relative">
                    {item.icon ? (
                        <img 
                          src={`${API_URL}/${item.icon}`} 
                          alt={item.name} 
                          className="w-12 h-12 object-contain"
                          onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                        />
                    ) : (
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                    )}
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] uppercase">
                        {item.type === 'consumable' ? 'Consum' : item.type === 'object' ? 'Obj' : 'Equip'}
                    </Badge>
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">{item.description || "Sem descrição"}</p>
                </div>
                {item.type === 'consumable' && item.effect_target !== 'none' && (
                    <div className="flex items-center gap-1 text-xs font-mono bg-secondary/30 px-2 py-1 rounded">
                        {item.effect_target === 'attack' && <Zap className="w-3 h-3 text-yellow-500" />}
                        {item.effect_target === 'defense' && <Shield className="w-3 h-3 text-blue-500" />}
                        {item.effect_target === 'hp' && <Heart className="w-3 h-3 text-red-500" />}
                        <span>+{item.effect_value}{item.is_percent ? '%' : ''}</span>
                    </div>
                )}
             </CardContent>
             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600" onClick={() => handleEdit(item)}>
                    <Info className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
