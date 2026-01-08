import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Search, Heart, Swords, Shield, Layers, Filter } from 'lucide-react';

export default function AdminEnemydex() {
  const [enemies, setEnemies] = useState([]);
  const [filteredEnemies, setFilteredEnemies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const [name, setName] = useState('');
  const [type, setType] = useState('Vacina');
  const [difficulty, setDifficulty] = useState('Normal');
  const [hp, setHp] = useState('');
  const [atk, setAtk] = useState('');
  const [def, setDef] = useState('');
  const [baseLevel, setBaseLevel] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expReward, setExpReward] = useState('');
  const [bitsReward, setBitsReward] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [items, setItems] = useState([]);
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    fetchEnemies();
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  const fetchDrops = async (enemyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/enemies/${enemyId}/drops`);
      setDrops(response.data);
    } catch (error) {
      console.error('Erro ao buscar drops:', error);
      setDrops([]);
    }
  };

  useEffect(() => {
    filterEnemies();
    setPage(1);
  }, [searchTerm, typeFilter, enemies]);

  const fetchEnemies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/enemies');
      setEnemies(response.data);
    } catch (error) {
      console.error('Erro ao buscar inimigos:', error);
    }
  };

  const filterEnemies = () => {
    let result = enemies;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(term)
      );
    }
    if (typeFilter && typeFilter !== 'Todos') {
      result = result.filter(d => d.type === typeFilter);
    }
    setFilteredEnemies(result);
  };

  const resetForm = () => {
    setName('');
    setType('Vacina');
    setDifficulty('Normal');
    setHp('');
    setAtk('');
    setDef('');
    setBaseLevel('');
    setFile(null);
    setEditingEnemy(null);
    setExpReward('');
    setBitsReward('');
    setDrops([]);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (enemy) => {
    setEditingEnemy(enemy);
    setName(enemy.name);
    setType(enemy.type);
    setDifficulty(
      enemy.difficulty === 'Boss' || enemy.difficulty === 'boss' || enemy.difficulty === 1 ? 'Boss' : 'Normal'
    );
    setHp(enemy.base_hp ?? enemy.hp ?? enemy.vida ?? '');
    setAtk(enemy.base_attack ?? enemy.attack ?? enemy.atk ?? enemy.ataque ?? '');
    setDef(enemy.base_defense ?? enemy.defense ?? enemy.def ?? enemy.defesa ?? '');
    setBaseLevel(enemy.base_level ?? enemy.level ?? enemy.nivel ?? '');
    setExpReward(enemy.exp_reward ?? '');
    setBitsReward(enemy.bits_reward ?? '');
    fetchDrops(enemy.id);
    setIsOpen(true);
  };

  const computeRewards = (a, d) => {
    const exp = Math.round((Number(a || 0) + Number(d || 0)) / 2);
    const bits = Math.round(exp * 0.5);
    return { exp, bits };
  };

  useEffect(() => {
    const { exp, bits } = computeRewards(atk, def);
    setExpReward(exp);
    setBitsReward(bits);
  }, [atk, def]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    try {
      if (editingEnemy) {
        const originalDifficulty =
          editingEnemy.difficulty === 'Boss' || editingEnemy.difficulty === 'boss' || editingEnemy.difficulty === 1 ? 'Boss' : 'Normal';
        const originalHp = editingEnemy.base_hp ?? editingEnemy.hp ?? editingEnemy.vida ?? '';
        const originalAtk = editingEnemy.base_attack ?? editingEnemy.attack ?? editingEnemy.atk ?? editingEnemy.ataque ?? '';
        const originalDef = editingEnemy.base_defense ?? editingEnemy.defense ?? editingEnemy.def ?? editingEnemy.defesa ?? '';
        const originalExp = editingEnemy.exp_reward ?? '';
        const originalBits = editingEnemy.bits_reward ?? '';

        if (name && name !== (editingEnemy.name ?? '')) formData.append('name', name);
        if (type && type !== (editingEnemy.type ?? '')) formData.append('type', type);
        if (difficulty && difficulty !== originalDifficulty) formData.append('difficulty', difficulty);
        if (hp !== '' && Number(hp) !== Number(originalHp || 0)) formData.append('base_hp', hp);
        if (atk !== '' && Number(atk) !== Number(originalAtk || 0)) formData.append('base_attack', atk);
        if (def !== '' && Number(def) !== Number(originalDef || 0)) formData.append('base_defense', def);
        if (expReward !== '' && Number(expReward) !== Number(originalExp || 0)) formData.append('exp_reward', expReward);
        if (bitsReward !== '' && Number(bitsReward) !== Number(originalBits || 0)) formData.append('bits_reward', bitsReward);
        if (file) formData.append('sprite', file);
        
        formData.append('drops', JSON.stringify(drops));

        if ([...formData.entries()].length === 0) {
          window.alert('Nenhuma alteração detectada.');
          setSaving(false);
          return;
        }
        await axios.put(
          `http://localhost:5000/api/enemies/${editingEnemy.id}`,
          formData
        );
      } else {
        if (!name || !type || !hp || !atk || !def) {
          window.alert('Preencha Nome, Tipo, HP, Ataque e Defesa.');
          setSaving(false);
          return;
        }
        formData.append('name', name);
        formData.append('type', type);
        formData.append('difficulty', difficulty);
        formData.append('base_hp', hp);
        formData.append('base_attack', atk);
        formData.append('base_defense', def);
        formData.append('exp_reward', expReward);
        formData.append('bits_reward', bitsReward);
        if (file) {
          formData.append('sprite', file);
        }
        await axios.post(
          'http://localhost:5000/api/enemies',
          formData
        );
      }
      setIsOpen(false);
      fetchEnemies();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar inimigo:', error);
      const backendMsg = error?.response?.data?.error || error?.message || '';
      window.alert(`Erro ao salvar inimigo. ${backendMsg ? 'Detalhe: ' + backendMsg : 'Verifique os campos e tente novamente.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este Inimigo?')) {
      try {
        await axios.delete(`http://localhost:5000/api/enemies/${id}`);
        fetchEnemies();
      } catch (error) {
        console.error('Erro ao deletar inimigo:', error);
      }
    }
  };

  const getStageName = (level) => {
    switch (String(level)) {
      case '1': return 'Rookie';
      case '2': return 'Champion';
      case '3': return 'Ultimate';
      case '4': return 'Mega';
      case '5': return 'Burst Mode';
      default: return level || '?';
    }
  };

  const generateStats = (level, diffOverride) => {
    const base = parseInt(level);
    if (!base) return;
    const minHp = base * 1000;
    const maxHp = minHp + 500;
    const minStat = base * 100;
    const maxStat = minStat + 50;
    const newHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
    const newAtk = Math.floor(Math.random() * (maxStat - minStat + 1)) + minStat;
    const newDef = Math.floor(Math.random() * (maxStat - minStat + 1)) + minStat;
    const currentDiff = diffOverride ?? difficulty;
    const factor = currentDiff === 'Boss' ? 2 : 1;
    setHp(newHp * factor);
    setAtk(newAtk * factor);
    setDef(newDef * factor);
  };

  const handleBaseLevelChange = (val) => {
    setBaseLevel(val);
    generateStats(val, difficulty);
  };

  const addDrop = () => {
    setDrops([...drops, { item_id: '', drop_rate: '' }]);
  };

  const removeDrop = (index) => {
    setDrops(drops.filter((_, i) => i !== index));
  };

  const updateDrop = (index, field, value) => {
    const newDrops = [...drops];
    newDrops[index][field] = value;
    setDrops(newDrops);
  };

  const totalPages = Math.max(1, Math.ceil(filteredEnemies.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const currentPageItems = filteredEnemies.slice(startIndex, startIndex + pageSize);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enemydex Admin</h1>
          <p className="text-muted-foreground">Gerencie a base de dados dos Inimigos.</p>
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
                <DialogTitle>{editingEnemy ? 'Editar Inimigo' : 'Adicionar Novo Inimigo'}</DialogTitle>
                <DialogDescription>Preencha os dados do Inimigo abaixo.</DialogDescription>
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
                    <Label htmlFor="difficulty">Tipo</Label>
                    <Select value={difficulty} onValueChange={(val) => { setDifficulty(val); if (baseLevel) generateStats(baseLevel, val); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Boss">Boss</SelectItem>
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
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="sprite">Imagem (Sprite)</Label>
                  <Input id="sprite" type="file" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expReward">Exp que dá</Label>
                  <Input id="expReward" type="number" value={expReward} onChange={(e) => setExpReward(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bitsReward">Bits que dá</Label>
                  <Input id="bitsReward" type="number" value={bitsReward} onChange={(e) => setBitsReward(e.target.value)} />
                </div>
                
                <div className="space-y-2 col-span-2 border-t pt-4">
                  <Label className="text-base font-semibold">Drops</Label>
                  <div className="space-y-2">
                    {drops.map((drop, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select
                          value={drop.item_id ? String(drop.item_id) : ''}
                          onValueChange={(val) => updateDrop(index, 'item_id', val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o Item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                <div className="flex items-center gap-2">
                                  {item.icon && <img src={`http://localhost:5000/${item.icon}`} alt="" className="w-4 h-4 object-contain" />}
                                  {item.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Rate %"
                          value={drop.drop_rate}
                          onChange={(e) => updateDrop(index, 'drop_rate', e.target.value)}
                          className="w-24"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDrop(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addDrop}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Drop
                    </Button>
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentPageItems.map((enemy) => (
          <Card key={enemy.id} className="group hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs uppercase">{enemy.type}</Badge>
                  {enemy.difficulty && (
                    <Badge variant="secondary" className="text-xs">{String(enemy.difficulty).toLowerCase() === 'boss' || enemy.difficulty === 1 ? 'Boss' : 'Normal'}</Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(enemy)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(enemy.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="w-full h-32 my-2 flex items-center justify-center">
                {enemy.sprite_path ? (
                  <img
                    src={'http://localhost:5000/' + enemy.sprite_path}
                    alt={enemy.name}
                    className="h-full object-contain drop-shadow-md"
                    onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">Sem Imagem</span>
                )}
              </div>
              <CardTitle className="text-center text-lg">{enemy.name}</CardTitle>
              <div className="flex justify-center items-center gap-1 text-xs text-muted-foreground mt-1">
                <Layers className="h-3 w-3" />
                <span>{getStageName(enemy.base_level ?? enemy.level ?? enemy.nivel)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-sm space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                  <Heart className="h-4 w-4 mb-1 text-muted-foreground" />
                  <span className="font-bold">{enemy.base_hp ?? enemy.hp ?? enemy.vida ?? '-'}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                  <Swords className="h-4 w-4 mb-1 text-muted-foreground" />
                  <span className="font-bold">{enemy.base_attack ?? enemy.attack ?? enemy.atk ?? enemy.ataque ?? '-'}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                  <Shield className="h-4 w-4 mb-1 text-muted-foreground" />
                  <span className="font-bold">{enemy.base_defense ?? enemy.defense ?? enemy.def ?? enemy.defesa ?? '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                  <span className="text-xs text-muted-foreground">EXP</span>
                  <span className="font-bold">{enemy.exp_reward ?? '-'}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                  <span className="text-xs text-muted-foreground">Bits</span>
                  <span className="font-bold">{enemy.bits_reward ?? '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">Página {page} de {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
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
