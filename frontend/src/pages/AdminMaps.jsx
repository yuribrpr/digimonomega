import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, Map as MapIcon, Users } from 'lucide-react';
import api from '../services/api';
export default function AdminMaps() {
  const [maps, setMaps] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Campanha');
  const [minLevel, setMinLevel] = useState('1');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [requireItem, setRequireItem] = useState(false);
  const [requiredItemId, setRequiredItemId] = useState('');
  const [consumeOnEnter, setConsumeOnEnter] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [difficulty, setDifficulty] = useState(1.0);
  useEffect(() => {
    fetchMaps();
    fetchEnemies();
    fetchItems();
  }, []);
  const fetchMaps = async () => {
    try {
      const response = await api.get('/api/maps');
      setMaps(response.data);
    } catch (error) {
      console.error('Erro ao buscar mapas:', error);
    }
  };
  const fetchEnemies = async () => {
    try {
      const response = await api.get('/api/enemies');
      setEnemies(response.data);
    } catch (error) {
      console.error('Erro ao buscar inimigos:', error);
    }
  };
  const fetchItems = async () => {
    try {
      const response = await api.get('/api/items');
      setItems(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };
  const resetForm = () => {
    setName('');
    setType('Campanha');
    setMinLevel('1');
    setDescription('');
    setFile(null);
    setSelectedEnemies([]);
    setEditingId(null);
    setRequireItem(false);
    setRequiredItemId('');
    setConsumeOnEnter(false);
    setIsActive(true);
    setDifficulty(1.0);
  };
  const handleEdit = (map) => {
    setEditingId(map.id);
    setName(map.name);
    setType(map.type || 'Campanha');
    setMinLevel(map.min_level);
    setDescription(map.description || '');
    // Pre-select enemies
    const mapEnemyIds = map.enemies ? map.enemies.map(e => e.id) : [];
    setSelectedEnemies(mapEnemyIds);
    setRequireItem(Boolean(map.require_item));
    setRequiredItemId(map.required_item_id ? String(map.required_item_id) : '');
    setConsumeOnEnter(Boolean(map.consume_on_enter));
    setIsActive(map.is_active !== undefined ? Boolean(map.is_active) : true);
    setDifficulty(map.difficulty ? parseFloat(map.difficulty) : 1.0);
    setIsOpen(true);
  };
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) resetForm();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('min_level', minLevel);
    formData.append('description', description);
    if (file) formData.append('image', file);
    // Append enemies as JSON string or individual fields? 
    // Backend expects: JSON.parse(enemies) or array
    formData.append('enemies', JSON.stringify(selectedEnemies));
    formData.append('require_item', requireItem ? 'true' : 'false');
    formData.append('required_item_id', requiredItemId || '');
    formData.append('consume_on_enter', consumeOnEnter ? 'true' : 'false');
    formData.append('is_active', isActive ? 'true' : 'false');
    formData.append('difficulty', difficulty.toString());
    try {
        if (editingId) {
            await api.put(`/api/maps/${editingId}`, formData);
        } else {
            await api.post('/api/maps', formData);
        }
        setIsOpen(false);
        fetchMaps();
        resetForm();
    } catch (error) {
        console.error('Erro ao salvar mapa:', error);
        window.alert('Erro ao salvar mapa.');
    } finally {
        setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este Mapa?')) {
      try {
        await api.delete(`/api/maps/${id}`);
        fetchMaps();
      } catch (error) {
        console.error('Erro ao deletar mapa:', error);
      }
    }
  };
  const toggleEnemy = (id) => {
    setSelectedEnemies(prev => 
        prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };
  const filteredMaps = maps.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração de Mapas</h1>
          <p className="text-muted-foreground">Gerencie as áreas exploráveis do jogo.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-10 w-10 rounded-full">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Mapa' : 'Adicionar Novo Mapa'}</DialogTitle>
              <DialogDescription>{editingId ? 'Edite as informações do mapa.' : 'Crie uma nova área de exploração.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Mapa</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Campanha">Campanha</SelectItem>
                      <SelectItem value="Raid">Raid</SelectItem>
                      <SelectItem value="Evento">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="minLevel">Nível Mínimo</Label>
                      <Input id="minLevel" type="number" value={minLevel} onChange={(e) => setMinLevel(e.target.value)} required min="1" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="difficulty">Dificuldade (Mult. Inimigo)</Label>
                      <Input id="difficulty" type="number" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required min="0.1" step="0.1" />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Thumbnail</Label>
                <Input id="image" type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Mapa Ativo (Visível no Explorar)</Label>
              </div>
              <div className="space-y-2">
                <Label>Requisito de Item</Label>
                <div className="flex items-center gap-3">
                  <input 
                    id="requireItem" 
                    type="checkbox" 
                    checked={requireItem} 
                    onChange={(e) => setRequireItem(e.target.checked)} 
                  />
                  <Label htmlFor="requireItem">Requer item para acessar</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requiredItemId">Item Necessário</Label>
                    <select
                      id="requiredItemId"
                      value={requiredItemId}
                      onChange={(e) => setRequiredItemId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={!requireItem}
                    >
                      <option value="">Selecione um item...</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consumeOnEnter">Uso do Item</Label>
                    <div className="flex items-center gap-3">
                      <input 
                        id="consumeOnEnter" 
                        type="checkbox" 
                        checked={consumeOnEnter} 
                        onChange={(e) => setConsumeOnEnter(e.target.checked)} 
                        disabled={!requireItem}
                      />
                      <Label htmlFor="consumeOnEnter">Consumir item ao acessar</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {requireItem ? (consumeOnEnter ? 'O item será subtraído ao entrar.' : 'Basta possuir o item no inventário.') : 'Nenhum requisito de item.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Inimigos Disponíveis (Selecione)</Label>
                <div className="border rounded-md p-4 h-60 overflow-y-auto grid grid-cols-2 gap-2">
                    {enemies.map(enemy => (
                        <div key={enemy.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => toggleEnemy(enemy.id)}>
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedEnemies.includes(enemy.id) ? 'bg-primary border-primary text-white' : 'border-slate-400'}`}>
                                {selectedEnemies.includes(enemy.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {enemy.sprite_path && <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${enemy.sprite_path}`} className="w-8 h-8 object-contain" alt="" />}
                                <span className="truncate">{enemy.name} (Lvl {enemy.base_level || '?'})</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">{selectedEnemies.length} inimigos selecionados.</p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : (editingId ? 'Atualizar Mapa' : 'Criar Mapa')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative w-full md:w-auto max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mapas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaps.map((map) => (
          <Card key={map.id} className="group overflow-hidden">
            <div className="aspect-video bg-slate-900 relative">
                {map.image_path ? (
                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${map.image_path}`} alt={map.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <MapIcon className="w-12 h-12 opacity-20" />
                    </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={map.is_active ? "default" : "destructive"} className="shadow-md">
                        {map.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="secondary" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                        Lvl {map.min_level}+
                    </Badge>
                    {map.difficulty && map.difficulty != 1 && (
                        <Badge variant="destructive" className="bg-red-600/80 hover:bg-red-600/90 text-white backdrop-blur-sm">
                            x{map.difficulty}
                        </Badge>
                    )}
                </div>
            </div>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                 <CardTitle className="text-lg">{map.name}</CardTitle>
                 <div className="flex -mr-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(map)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(map.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{map.description || 'Sem descrição.'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    <span>{map.enemies ? map.enemies.length : 0} Inimigos possíveis</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
