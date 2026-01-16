import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '../services/api';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  Heart, 
  Swords, 
  Shield, 
  Dna, 
  Layers, 
  ArrowRight,
  Filter
} from 'lucide-react';
export default function AdminDigidex() {
  const [digimons, setDigimons] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredDigimons, setFilteredDigimons] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDigimon, setEditingDigimon] = useState(null);
  const [isCreatingLine, setIsCreatingLine] = useState(false);
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [evoLineFilter, setEvoLineFilter] = useState('Todas');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Vacina');
  const [hp, setHp] = useState('');
  const [atk, setAtk] = useState('');
  const [def, setDef] = useState('');
  const [evolutionLineId, setEvolutionLineId] = useState('');
  // nextEvolutionId removed as per request
  const [evolutionLevel, setEvolutionLevel] = useState('');
  const [baseLevel, setBaseLevel] = useState('');
  const [requiredEvoluters, setRequiredEvoluters] = useState('');
  const [requiredItemId, setRequiredItemId] = useState('12'); // Default to Evoluter
  const [requiredItemQty, setRequiredItemQty] = useState('1'); // Default quantity
  const [file, setFile] = useState(null);
  const fetchItems = async () => {
    try {
        const res = await api.get('/api/items');
        setItems(res.data);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
  };
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
    fetchItems();
  }, []);
  useEffect(() => {
    let result = digimons;
    if (searchTerm) {
      result = result.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (typeFilter !== 'Todos') {
      result = result.filter(d => d.type === typeFilter);
    }
    if (evoLineFilter !== 'Todas') {
      result = result.filter(d => d.evolution_line_id === evoLineFilter);
    }
    setFilteredDigimons(result);
    setPage(1); // Reset to first page when filters change
  }, [digimons, searchTerm, typeFilter, evoLineFilter]);
  // ... (omitted)
  const resetForm = () => {
    setName('');
    setType('Vacina');
    setHp('');
    setAtk('');
    setDef('');
    setEvolutionLineId('');
    // setNextEvolutionId(''); removed
    setEvolutionLevel('');
    setBaseLevel('');
    setRequiredEvoluters('');
    setRequiredItemId('12');
    setRequiredItemQty('1');
    setFile(null);
    setEditingDigimon(null);
    setIsCreatingLine(false);
  };
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) resetForm();
  };
  const handleEdit = (digimon) => {
    setEditingDigimon(digimon);
    setName(digimon.name);
    setType(digimon.type);
    setHp(digimon.base_hp);
    setAtk(digimon.base_attack);
    setDef(digimon.base_defense);
    setEvolutionLineId(digimon.evolution_line_id || '');
    // setNextEvolutionId(digimon.next_evolution_id ? String(digimon.next_evolution_id) : ''); removed
    setEvolutionLevel(digimon.evolution_level || '');
    setBaseLevel(digimon.base_level || '');
    setRequiredEvoluters(digimon.required_evoluters || '');
    setRequiredItemId(digimon.required_item_id ? String(digimon.required_item_id) : '12');
    setRequiredItemQty(
      digimon.required_item_quantity !== undefined && digimon.required_item_quantity !== null
        ? String(digimon.required_item_quantity)
        : '1'
    );
    setIsOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyValue = requiredItemQty === '' || requiredItemQty === null || requiredItemQty === undefined
      ? '0'
      : String(requiredItemQty);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('base_hp', hp);
    formData.append('base_attack', atk);
    formData.append('base_defense', def);
    formData.append('evolution_line_id', evolutionLineId);
    formData.append('required_evoluters', qtyValue); // Legacy support
    formData.append('required_item_id', requiredItemId);
    formData.append('required_item_quantity', qtyValue);
    // next_evolution_id removed
    formData.append('evolution_level', evolutionLevel);
    formData.append('base_level', baseLevel);
    if (file) {
      formData.append('sprite', file);
    }
    try {
      if (editingDigimon) {
        await api.put(`/api/digimons/${editingDigimon.id}`, formData);
      } else {
        await api.post('/api/digimons', formData);
      }
      setIsOpen(false);
      fetchDigimons();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar digimon:', error);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este Digimon?')) {
      try {
        await api.delete(`/api/digimons/${id}`);
        fetchDigimons();
      } catch (error) {
        console.error('Erro ao deletar digimon:', error);
      }
    }
  };
  const availableEvolutions = digimons.filter(d => {
    if (evolutionLineId && d.evolution_line_id !== evolutionLineId) return false;
    if (editingDigimon && d.id === editingDigimon.id) return false;
    return true;
  });
  const uniqueEvoLines = [...new Set(digimons.map(d => d.evolution_line_id).filter(Boolean))].sort();
  const getDigimonName = (id) => {
      const found = digimons.find(d => d.id === id);
      return found ? found.name : 'Desconhecido';
  };
  const getNextEvolutionLevel = (nextId) => {
    const targetId = typeof nextId === 'string' ? parseInt(nextId, 10) : nextId;
    const next = digimons.find(d => d.id === targetId);
    if (!next) return null;
    return next.evolution_level || next.base_level || null;
  };
  const getStageName = (level) => {
    switch(String(level)) {
        case '1': return 'Rookie';
        case '2': return 'Champion';
        case '3': return 'Ultimate';
        case '4': return 'Mega';
        case '5': return 'Burst Mode';
        default: return level || '?';
    }
  };
  const generateStats = (level) => {
    const base = parseInt(level);
    if (!base) return;
    // Ranges based on level:
    // 1 (Rookie): HP 1000-1500, Atk 100-150, Def 100-150
    // 2 (Champion): HP 2000-2500, Atk 200-250, Def 200-250
    // etc.
    const minHp = base * 1000;
    const maxHp = minHp + 500;
    const minStat = base * 100;
    const maxStat = minStat + 50;
    const newHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
    const newAtk = Math.floor(Math.random() * (maxStat - minStat + 1)) + minStat;
    const newDef = Math.floor(Math.random() * (maxStat - minStat + 1)) + minStat;
    setHp(newHp);
    setAtk(newAtk);
    setDef(newDef);
  };
  const handleBaseLevelChange = (val) => {
    setBaseLevel(val);
    generateStats(val);
    // Reset item to default (Evoluter)
    setRequiredItemId('12');
    switch(String(val)) {
      case '1': 
        setEvolutionLevel('1'); 
        setRequiredItemQty('1');
        break;
      case '2': 
        setEvolutionLevel('15'); 
        setRequiredItemQty('5'); // Champion = 5
        break;
      case '3': 
        setEvolutionLevel('30'); 
        setRequiredItemQty('15'); // Ultimate = 15
        break;
      case '4': 
        setEvolutionLevel('45'); 
        setRequiredItemQty('30'); // Mega = 30
        break;
      case '5': 
        setEvolutionLevel('60'); 
        setRequiredItemQty('50'); // Burst Mode = 50
        break;
      default: break;
    }
  };
  const totalPages = Math.max(1, Math.ceil(filteredDigimons.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const currentPageItems = filteredDigimons.slice(startIndex, startIndex + pageSize);
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Digidex Admin</h1>
            <p className="text-muted-foreground">Gerencie a base de dados dos Digimons.</p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="icon" className="h-10 w-10 rounded-full">
                    <Plus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>{editingDigimon ? 'Editar Digimon' : 'Adicionar Novo Digimon'}</DialogTitle>
                <DialogDescription>Preencha os dados do Digimon abaixo.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="baseLevel">Nível Base (Auto-preencher Status)</Label>
                        <Select value={baseLevel ? String(baseLevel) : ''} onValueChange={handleBaseLevelChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o estágio..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Rookie</SelectItem>
                                <SelectItem value="2">Champion</SelectItem>
                                <SelectItem value="3">Ultimate</SelectItem>
                                <SelectItem value="4">Mega</SelectItem>
                                <SelectItem value="5">Burst Mode</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Vacina">Vacina</SelectItem>
                            <SelectItem value="Vírus">Vírus</SelectItem>
                            <SelectItem value="Data">Data</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp">HP Base</Label>
                    <Input id="hp" type="number" value={hp} onChange={(e) => setHp(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atk">Ataque Base</Label>
                    <Input id="atk" type="number" value={atk} onChange={(e) => setAtk(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="def">Defesa Base</Label>
                    <Input id="def" type="number" value={def} onChange={(e) => setDef(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evoLevel">Nível de Evolução</Label>
                    <Input id="evoLevel" type="number" value={evolutionLevel} onChange={(e) => setEvolutionLevel(e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="evoLine">Linha Evolutiva</Label>
                    {!isCreatingLine ? (
                        <Select 
                            value={uniqueEvoLines.includes(evolutionLineId) ? evolutionLineId : (evolutionLineId ? 'custom' : '')} 
                            onValueChange={(val) => {
                                if (val === 'new_line_creation') {
                                    setIsCreatingLine(true);
                                    setEvolutionLineId('');
                                } else {
                                    setEvolutionLineId(val);
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={evolutionLineId || "Selecione uma linha"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new_line_creation" className="font-bold text-primary">+ Nova Linha</SelectItem>
                                {uniqueEvoLines.map(line => (
                                    <SelectItem key={line} value={line}>{line}</SelectItem>
                                ))}
                                {evolutionLineId && !uniqueEvoLines.includes(evolutionLineId) && (
                                     <SelectItem value="custom" disabled>{evolutionLineId} (Atual)</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex gap-2">
                            <Input 
                                id="evoLine" 
                                value={evolutionLineId} 
                                onChange={(e) => setEvolutionLineId(e.target.value)} 
                                placeholder="Nome da Nova Linha" 
                                autoFocus
                            />
                            <Button type="button" variant="outline" onClick={() => setIsCreatingLine(false)}>
                                Voltar
                            </Button>
                        </div>
                    )}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="reqItemId">Item de Evolução</Label>
                    <Select value={requiredItemId} onValueChange={setRequiredItemId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o item" />
                        </SelectTrigger>
                        <SelectContent>
                            {items.map(item => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                    <div className="flex items-center gap-2">
                                        {item.icon && <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${item.icon}`} className="h-4 w-4 object-contain" />}
                                        {item.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reqItemQty">Quantidade do Item</Label>
                    <Input id="reqItemQty" type="number" value={requiredItemQty} onChange={(e) => setRequiredItemQty(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="sprite">Imagem (Sprite)</Label>
                    <Input id="sprite" type="file" onChange={(e) => setFile(e.target.files[0])} />
                  </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-lg border">
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9 w-full md:w-[250px]"
            />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Tipo" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Todos">Todos os Tipos</SelectItem>
                <SelectItem value="Vacina">Vacina</SelectItem>
                <SelectItem value="Vírus">Vírus</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
        </Select>
        <Select value={evoLineFilter} onValueChange={setEvoLineFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
                <div className="flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    <SelectValue placeholder="Linha Evolutiva" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Todas">Todas as Linhas</SelectItem>
                {uniqueEvoLines.map(line => (
                    <SelectItem key={line} value={line}>{line}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentPageItems.map((digimon) => (
          <Card key={digimon.id} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-xs uppercase">{digimon.type}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(digimon)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(digimon.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
              <div className="w-full h-32 my-2 flex items-center justify-center">
                {digimon.sprite_path ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${digimon.sprite_path}`}
                    alt={digimon.name}
                    className="h-full object-contain drop-shadow-md"
                    onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">Sem Imagem</span>
                )}
              </div>
              <CardTitle className="text-center text-lg">{digimon.name}</CardTitle>
              <div className="flex justify-center items-center gap-1 text-xs text-muted-foreground mt-1">
                 <Layers className="h-3 w-3" />
                 <span>{getStageName(digimon.base_level)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-sm space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                    <Heart className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-bold">{digimon.base_hp}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                    <Swords className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-bold">{digimon.base_attack}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                    <Shield className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-bold">{digimon.base_defense}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Dna className="h-4 w-4" />
                        <span>Linha:</span>
                    </div>
                    <span className="font-medium">{digimon.evolution_line_id || '-'}</span>
                 </div>
                 {digimon.next_evolution_id && (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                            <span>Próx:</span>
                        </div>
                        <span className="font-medium text-xs text-right truncate max-w-[150px]" title={getDigimonName(digimon.next_evolution_id)}>
                            {getDigimonName(digimon.next_evolution_id)}
                            {(() => {
                              const lvl = getNextEvolutionLevel(digimon.next_evolution_id);
                              return lvl ? ' (Lv. ' + lvl + ')' : null;
                            })()}
                        </span>
                     </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
          <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(parseInt(val, 10)); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 por página</SelectItem>
              <SelectItem value="24">24 por página</SelectItem>
              <SelectItem value="48">48 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
