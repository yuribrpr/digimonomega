import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
import api from '../services/api';
  Trash2, 
  Heart, 
  Swords, 
  Shield, 
  Star, 
  Search, 
  Filter,
  Crown
} from "lucide-react";
export default function MeusDigimons() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  // Delete State
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fetchItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/users/${user.id}/digimons`);
      setItems(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar seus digimons:', error);
    }
    setLoading(false);
  }, [user?.id]);
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    let result = [...items];
    // Filter by name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        (d.species_name || d.name).toLowerCase().includes(term) ||
        (d.custom_name && d.custom_name.toLowerCase().includes(term))
      );
    }
    // Filter by type
    if (typeFilter && typeFilter !== 'Todos') {
      result = result.filter(d => d.type === typeFilter);
    }
    // Sort: Principal first, then Level DESC, then Name ASC
    result.sort((a, b) => {
      if (a.principal !== b.principal) return b.principal - a.principal; // 1 before 0
      if (a.level !== b.level) return b.level - a.level; // Higher level first
      const nameA = a.species_name || a.name;
      const nameB = b.species_name || b.name;
      return nameA.localeCompare(nameB);
    });
    setFilteredItems(result);
  }, [items, searchTerm, typeFilter]);
  const setPrincipal = async (digimonId) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await api.post(`/api/users/${user.id}/digimons/principal`, { digimon_id: digimonId });
      await fetchItems();
    } catch (error) {
      console.error('Erro ao definir principal:', error);
    }
    setLoading(false);
  };
  const handleOpenDelete = (digimon) => {
    setSelectedDigimon(digimon);
    setPassword('');
    setIsDeleteDialogOpen(true);
  };
  const handleDelete = async () => {
    if (!password) return;
    setDeleteLoading(true);
    try {
        await api.delete(`/api/users/${user.id}/digimons/${selectedDigimon.user_digimon_id}`, {
            data: { password }
        });
        setIsDeleteDialogOpen(false);
        fetchItems();
    } catch (error) {
        console.error("Erro ao deletar:", error);
        alert(error.response?.data?.message || 'Erro ao deletar digimon');
    }
    setDeleteLoading(false);
  };
  // Extract unique types for filter
  const uniqueTypes = ['Todos', ...new Set(items.map(i => i.type).filter(Boolean))];
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Meus Digimons</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua equipe e escolha seu parceiro principal.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
            Atualizar Lista
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg shadow-sm border">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((it) => (
          <Card 
            key={it.user_digimon_id || it.digimon_id} 
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${it.principal === 1 ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            {it.principal === 1 && (
                <div className="absolute top-0 right-0 z-20">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Crown className="h-3 w-3 fill-current" /> Principal
                    </div>
                </div>
            )}
            <CardHeader className="p-0">
                <div className="absolute top-3 left-3 z-10">
                    <Badge variant="secondary" className="text-xs font-semibold backdrop-blur-md bg-background/80 shadow-sm border-slate-200 dark:border-slate-700">
                        {it.type}
                    </Badge>
                </div>
            </CardHeader>
            <div className="relative w-full h-48 flex items-center justify-center p-6 bg-gradient-to-b from-muted/20 to-muted/50">
                {it.sprite_path ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${it.sprite_path}`}
                    alt={it.species_name || it.name}
                    className="h-full w-auto object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground h-full w-full bg-muted/20 rounded-lg">
                      <span className="text-xs">Sem Imagem</span>
                  </div>
                )}
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                            {it.species_name || it.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">Nível {it.level || it.base_level}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center p-1.5 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
                        <Heart className="h-3 w-3 text-red-500 mb-0.5" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(it.base_hp || 0) + (it.max_hp || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900/30">
                        <Swords className="h-3 w-3 text-blue-500 mb-0.5" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(it.base_attack || 0) + (it.attack || 0)}</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-100 dark:border-green-900/30">
                        <Shield className="h-3 w-3 text-green-500 mb-0.5" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(it.base_defense || 0) + (it.defense || 0)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-3 bg-muted/20 flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                {it.principal !== 1 && (
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => setPrincipal(it.digimon_id)} 
                        disabled={loading}
                        title="Definir como Principal"
                    >
                        <Star className="h-4 w-4" />
                    </Button>
                )}
                {it.principal === 1 && (
                     <div className="flex-1 flex items-center text-xs text-primary font-medium px-2">
                        <Crown className="h-3 w-3 mr-1.5 fill-current" /> Parceiro Principal
                     </div>
                )}
                <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => handleOpenDelete(it)}
                    disabled={loading || it.principal === 1}
                    title="Abandonar Digimon"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {filteredItems.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/30 p-6 rounded-full mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Nenhum Digimon Encontrado</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
                Tente ajustar seus filtros ou explore o mundo para capturar novos Digimons.
            </p>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Abandonar Digimon
            </DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja abandonar <strong>{selectedDigimon?.species_name || selectedDigimon?.name}</strong>? 
              <br/>
              Esta ação não pode ser desfeita e o Digimon será perdido para sempre.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Digite sua senha para confirmar</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!password || deleteLoading}>
              {deleteLoading ? 'Abandonando...' : 'Confirmar Abandono'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
