import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Image as ImageIcon, Music, Plus, Save, Search, Trash2, X } from 'lucide-react';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function toAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  const s = String(pathOrUrl).replace(/\\/g, '/');
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${API_BASE}/${s.replace(/^\//, '')}`;
}

function isMp4(pathOrUrl) {
  if (!pathOrUrl) return false;
  return String(pathOrUrl).toLowerCase().endsWith('.mp4');
}

function clampToNumberString(value, fallback) {
  if (value === null || value === undefined) return fallback;
  const s = String(value);
  if (s.trim() === '') return fallback;
  return s;
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function compareMapsByLevel(a, b) {
  const levelDiff = toSafeNumber(a?.min_level) - toSafeNumber(b?.min_level);
  if (levelDiff !== 0) return levelDiff;

  const routeDiff = toSafeNumber(a?.route_order) - toSafeNumber(b?.route_order);
  if (routeDiff !== 0) return routeDiff;

  const nameDiff = String(a?.name || '').localeCompare(String(b?.name || ''));
  if (nameDiff !== 0) return nameDiff;

  return toSafeNumber(a?.id) - toSafeNumber(b?.id);
}

export default function AdminMaps() {
  const [maps, setMaps] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [items, setItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const [selectedKey, setSelectedKey] = useState('NONE');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [enemySearch, setEnemySearch] = useState('');

  const [draft, setDraft] = useState({
    id: null,
    name: '',
    type: 'Campanha',
    min_level: '1',
    difficulty: '1',
    campaign_id: 'NONE',
    description: '',
    is_active: true,
    require_item: false,
    required_item_id: '',
    consume_on_enter: false,
    enemies: [],
    image_file: null,
    soundtrack_mode: 'upload',
    soundtrack_file: null,
    soundtrack_url: '',
    clear_soundtrack: false,
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const selectedMap = useMemo(() => {
    if (!selectedKey || selectedKey === 'NONE' || selectedKey === 'NEW') return null;
    return maps.find(m => String(m.id) === String(selectedKey)) || null;
  }, [maps, selectedKey]);

  const selectedCampaign = useMemo(() => {
    const id = selectedMap?.campaign_id;
    if (!id) return null;
    return campaigns.find(c => String(c.id) === String(id)) || null;
  }, [campaigns, selectedMap?.campaign_id]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [mapsRes, enemiesRes, itemsRes, campaignsRes] = await Promise.all([
        api.get('/api/maps'),
        api.get('/api/enemies'),
        api.get('/api/items'),
        api.get('/api/quests/campaigns'),
      ]);
      const nextMaps = mapsRes.data || [];
      const nextEnemies = enemiesRes.data || [];
      const nextItems = itemsRes.data || [];
      const nextCampaigns = campaignsRes.data || [];
      setMaps(nextMaps);
      setEnemies(nextEnemies);
      setItems(nextItems);
      setCampaigns(nextCampaigns);
      return { maps: nextMaps, enemies: nextEnemies, items: nextItems, campaigns: nextCampaigns };
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      window.alert('Erro ao carregar dados do painel de mapas.');
      return { maps: [], enemies: [], items: [], campaigns: [] };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const loadDraftFromMap = (map) => {
    const mapEnemyIds = map?.enemies ? map.enemies.map(e => Number(e.id)) : [];
    setDraft({
      id: map?.id ?? null,
      name: map?.name || '',
      type: map?.type || 'Campanha',
      min_level: clampToNumberString(map?.min_level ?? '1', '1'),
      difficulty: clampToNumberString(map?.difficulty ?? '1', '1'),
      campaign_id: map?.campaign_id ? String(map.campaign_id) : 'NONE',
      description: map?.description || '',
      is_active: map?.is_active !== undefined ? Boolean(map.is_active) : true,
      require_item: Boolean(map?.require_item),
      required_item_id: map?.required_item_id ? String(map.required_item_id) : '',
      consume_on_enter: Boolean(map?.consume_on_enter),
      enemies: mapEnemyIds,
      image_file: null,
      soundtrack_mode: map?.soundtrack_path ? 'upload' : map?.soundtrack_url ? 'url' : 'none',
      soundtrack_file: null,
      soundtrack_url: map?.soundtrack_url || '',
      clear_soundtrack: false,
    });
    setEnemySearch('');
    setDirty(false);
  };

  useEffect(() => {
    if (selectedKey === 'NEW') {
      setDraft({
        id: null,
        name: '',
        type: 'Campanha',
        min_level: '1',
        difficulty: '1',
        campaign_id: 'NONE',
        description: '',
        is_active: true,
        require_item: false,
        required_item_id: '',
        consume_on_enter: false,
        enemies: [],
        image_file: null,
        soundtrack_mode: 'upload',
        soundtrack_file: null,
        soundtrack_url: '',
        clear_soundtrack: false,
      });
      setEnemySearch('');
      setDirty(false);
      return;
    }
    if (selectedMap) loadDraftFromMap(selectedMap);
  }, [selectedKey]);

  const campaignTitleById = useMemo(() => {
    const m = new Map();
    campaigns.forEach(c => m.set(String(c.id), c.title));
    return (id) => {
      if (!id) return 'Sem campanha';
      return m.get(String(id)) || 'Sem campanha';
    };
  }, [campaigns]);

  const filteredMaps = useMemo(() => {
    const term = filterSearch.trim().toLowerCase();
    return maps
      .filter(m => {
        if (filterType !== 'all' && (m.type || 'Campanha') !== filterType) return false;
        if (filterCampaign !== 'all') {
          if (filterCampaign === 'NONE') {
            if (m.campaign_id) return false;
          } else {
            if (String(m.campaign_id || '') !== String(filterCampaign)) return false;
          }
        }
        if (filterActive !== 'all') {
          const active = Boolean(m.is_active);
          if (filterActive === 'active' && !active) return false;
          if (filterActive === 'inactive' && active) return false;
        }
        if (!term) return true;
        return String(m.name || '').toLowerCase().includes(term);
      })
      .sort(compareMapsByLevel);
  }, [maps, filterSearch, filterType, filterCampaign, filterActive]);

  const groupedMaps = useMemo(() => {
    const groups = new Map();
    filteredMaps.forEach(m => {
      const key = m.campaign_id ? String(m.campaign_id) : 'NONE';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });
    const orderedKeys = [
      ...campaigns.map(c => String(c.id)).filter(k => groups.has(k)),
      ...(groups.has('NONE') ? ['NONE'] : []),
      ...Array.from(groups.keys()).filter(k => k !== 'NONE' && !campaigns.find(c => String(c.id) === String(k))),
    ];
    return orderedKeys.map(key => ({
      key,
      title: key === 'NONE' ? 'Sem campanha' : campaignTitleById(key),
      maps: groups.get(key) || [],
    }));
  }, [filteredMaps, campaigns, campaignTitleById]);

  const selectedEnemyCount = draft.enemies.length;

  const enemiesFiltered = useMemo(() => {
    const term = enemySearch.trim().toLowerCase();
    if (!term) return enemies;
    return enemies.filter(e => String(e.name || '').toLowerCase().includes(term));
  }, [enemies, enemySearch]);

  const updateDraft = (patch) => {
    setDraft(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const toggleEnemy = (enemyId) => {
    setDraft(prev => {
      const id = Number(enemyId);
      const exists = prev.enemies.includes(id);
      const nextEnemies = exists ? prev.enemies.filter(e => e !== id) : [...prev.enemies, id];
      return { ...prev, enemies: nextEnemies };
    });
    setDirty(true);
  };

  const selectAllFilteredEnemies = () => {
    setDraft(prev => {
      const set = new Set(prev.enemies);
      enemiesFiltered.forEach(e => set.add(Number(e.id)));
      return { ...prev, enemies: Array.from(set) };
    });
    setDirty(true);
  };

  const clearEnemies = () => {
    updateDraft({ enemies: [] });
  };

  const discardChanges = () => {
    if (selectedKey === 'NEW') {
      setSelectedKey('NONE');
      return;
    }
    if (selectedMap) loadDraftFromMap(selectedMap);
  };

  const startNew = () => {
    setSelectedKey('NEW');
  };

  const duplicateSelected = () => {
    const base = selectedMap;
    if (!base) return;
    setSelectedKey('NEW');
    setDraft(prev => ({
      ...prev,
      id: null,
      name: `${base.name || 'Mapa'} (cópia)`,
      type: base.type || 'Campanha',
      min_level: clampToNumberString(base.min_level ?? '1', '1'),
      difficulty: clampToNumberString(base.difficulty ?? '1', '1'),
      campaign_id: base.campaign_id ? String(base.campaign_id) : 'NONE',
      description: base.description || '',
      is_active: base.is_active !== undefined ? Boolean(base.is_active) : true,
      require_item: Boolean(base.require_item),
      required_item_id: base.required_item_id ? String(base.required_item_id) : '',
      consume_on_enter: Boolean(base.consume_on_enter),
      enemies: base.enemies ? base.enemies.map(e => Number(e.id)) : [],
      image_file: null,
      soundtrack_mode: base.soundtrack_path ? 'upload' : base.soundtrack_url ? 'url' : 'none',
      soundtrack_file: null,
      soundtrack_url: base.soundtrack_url || '',
      clear_soundtrack: false,
    }));
    setDirty(true);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      window.alert('Informe o nome do mapa.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', draft.name);
      formData.append('type', draft.type);
      formData.append('min_level', String(draft.min_level || '1'));
      formData.append('difficulty', String(draft.difficulty || '1'));
      formData.append('description', draft.description || '');
      formData.append('enemies', JSON.stringify(draft.enemies || []));
      formData.append('require_item', draft.require_item ? 'true' : 'false');
      formData.append('required_item_id', draft.required_item_id || '');
      formData.append('consume_on_enter', draft.consume_on_enter ? 'true' : 'false');
      formData.append('is_active', draft.is_active ? 'true' : 'false');
      if (draft.campaign_id === 'NONE') {
        formData.append('campaign_id', '');
      } else {
        formData.append('campaign_id', draft.campaign_id);
      }
      if (draft.image_file) formData.append('image', draft.image_file);

      if (draft.soundtrack_mode === 'upload') {
        if (draft.soundtrack_file) formData.append('soundtrack', draft.soundtrack_file);
      } else if (draft.soundtrack_mode === 'url') {
        if (draft.soundtrack_url) formData.append('soundtrack_url', draft.soundtrack_url);
      } else if (draft.soundtrack_mode === 'none') {
        formData.append('clear_soundtrack', 'true');
      }

      if (draft.id) {
        await api.put(`/api/maps/${draft.id}`, formData);
      } else {
        const res = await api.post('/api/maps', formData);
        const createdId = res?.data?.id ?? res?.data?.mapId ?? res?.data?.insertId ?? null;
        if (createdId) setSelectedKey(String(createdId));
      }

      const next = await refreshAll();
      if (draft.id) {
        const updated = next.maps.find(m => String(m.id) === String(draft.id));
        if (updated) loadDraftFromMap(updated);
      }
      setDirty(false);
    } catch (error) {
      console.error('Erro ao salvar mapa:', error);
      window.alert('Erro ao salvar mapa.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!draft.id) return;
    try {
      await api.delete(`/api/maps/${draft.id}`);
      setConfirmDeleteOpen(false);
      setSelectedKey('NONE');
      await refreshAll();
    } catch (error) {
      console.error('Erro ao deletar mapa:', error);
      window.alert('Erro ao deletar mapa.');
    }
  };

  const mediaPreviewUrl = useMemo(() => {
    if (draft.image_file) return URL.createObjectURL(draft.image_file);
    return selectedMap?.image_path ? toAssetUrl(selectedMap.image_path) : null;
  }, [draft.image_file, selectedMap?.image_path]);

  const mediaPreviewIsVideo = useMemo(() => {
    if (draft.image_file) return draft.image_file.type === 'video/mp4';
    return selectedMap?.image_path ? isMp4(selectedMap.image_path) : false;
  }, [draft.image_file, selectedMap?.image_path]);

  const soundtrackPreviewUrl = useMemo(() => {
    if (draft.soundtrack_file) return URL.createObjectURL(draft.soundtrack_file);
    if (draft.soundtrack_mode === 'url' && draft.soundtrack_url) return draft.soundtrack_url;
    if (selectedMap?.soundtrack_path) return toAssetUrl(selectedMap.soundtrack_path);
    if (selectedMap?.soundtrack_url) return selectedMap.soundtrack_url;
    return null;
  }, [draft.soundtrack_file, draft.soundtrack_mode, draft.soundtrack_url, selectedMap?.soundtrack_path, selectedMap?.soundtrack_url]);

  const campaignSelectValue = draft.campaign_id || 'NONE';

  const headerSubtitle = useMemo(() => {
    if (selectedKey === 'NEW') return 'Criando novo mapa';
    if (!selectedMap) return 'Selecione um mapa para editar';
    return `Editando: ${selectedMap.name}`;
  }, [selectedKey, selectedMap]);

  const selectedEnemiesPreview = useMemo(() => {
    const set = new Set(draft.enemies);
    return enemies
      .filter(e => set.has(Number(e.id)))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .slice(0, 18);
  }, [draft.enemies, enemies]);

  const scrollTopRef = useRef(null);

  useEffect(() => {
    if (!scrollTopRef.current) return;
    scrollTopRef.current.scrollTop = 0;
  }, [selectedKey]);

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Administração de Mapas</h1>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={startNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo mapa
          </Button>
          <Button onClick={save} disabled={saving || (!dirty && selectedKey !== 'NEW')}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          {dirty ? <Badge variant="destructive">Alterações pendentes</Badge> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-3 space-y-3">
            <CardTitle className="text-lg">Mapas</CardTitle>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Campanha">Campanha</SelectItem>
                    <SelectItem value="Raid">Raid</SelectItem>
                    <SelectItem value="Evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="NONE">Sem</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-290px)]">
              <div className="p-3 space-y-4" ref={scrollTopRef}>
                {loading ? (
                  <div className="text-sm text-muted-foreground p-3">Carregando...</div>
                ) : groupedMaps.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">Nenhum mapa encontrado.</div>
                ) : (
                  groupedMaps.map(group => (
                    <div key={group.key} className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.title}
                        </div>
                        <Badge variant="secondary">{group.maps.length}</Badge>
                      </div>
                      <div className="space-y-1">
                        {group.maps.map(map => {
                          const active = Boolean(map.is_active);
                          const selected = String(selectedKey) === String(map.id);
                          const thumbUrl = toAssetUrl(map.image_path);
                          return (
                            <button
                              key={map.id}
                              type="button"
                              onClick={() => setSelectedKey(String(map.id))}
                              className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${selected ? 'bg-accent border-primary/40' : 'hover:bg-accent/50 border-border'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                  {thumbUrl ? (
                                    isMp4(map.image_path) ? (
                                      <video
                                        className="h-full w-full object-cover"
                                        src={thumbUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                    ) : (
                                      <img className="h-full w-full object-cover" src={thumbUrl} alt={map.name} />
                                    )
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium truncate">{map.name}</div>
                                    <div className="flex items-center gap-1">
                                      <Badge variant={active ? "default" : "destructive"}>{active ? 'Ativo' : 'Off'}</Badge>
                                      <Badge variant="secondary">Lvl {map.min_level}+</Badge>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {(map.type || 'Campanha')} • {map.enemies?.length || 0} inimigos
                                    {(map.soundtrack_path || map.soundtrack_url) ? ' • música' : ''}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t bg-background flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {filteredMaps.length} de {maps.length}
            </div>
            <Button variant="ghost" onClick={refreshAll} disabled={loading}>
              Atualizar
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-2 flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {selectedKey === 'NEW' ? 'Novo mapa' : selectedMap ? selectedMap.name : 'Editor'}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{draft.type || 'Campanha'}</Badge>
                <Badge variant="secondary">Lvl {draft.min_level}+</Badge>
                {draft.campaign_id !== 'NONE' ? <Badge variant="secondary">{campaignTitleById(draft.campaign_id)}</Badge> : <Badge variant="outline">Sem campanha</Badge>}
                {draft.is_active ? <Badge>Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={duplicateSelected} disabled={!selectedMap}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
              <Button variant="outline" onClick={discardChanges} disabled={!dirty && selectedKey !== 'NEW'}>
                <X className="h-4 w-4 mr-2" />
                Descartar
              </Button>
              <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={!draft.id}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {!selectedMap && selectedKey !== 'NEW' ? (
              <div className="h-[calc(100vh-260px)] flex items-center justify-center text-center">
                <div className="space-y-3 max-w-md">
                  <div className="text-2xl font-semibold">Escolha um mapa</div>
                  <div className="text-sm text-muted-foreground">
                    Clique em um mapa na lista para editar, ou crie um novo com um clique.
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={startNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar mapa
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="media">Mídia</TabsTrigger>
                  <TabsTrigger value="access">Acesso</TabsTrigger>
                  <TabsTrigger value="enemies">Inimigos</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mapName">Nome</Label>
                      <Input
                        id="mapName"
                        value={draft.name}
                        onChange={(e) => updateDraft({ name: e.target.value })}
                        placeholder="Ex: Floresta do Início"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={draft.type} onValueChange={(v) => updateDraft({ type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Campanha">Campanha</SelectItem>
                          <SelectItem value="Raid">Raid</SelectItem>
                          <SelectItem value="Evento">Evento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Campanha</Label>
                      <Select value={campaignSelectValue} onValueChange={(v) => updateDraft({ campaign_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Sem campanha</SelectItem>
                          {campaigns.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCampaign?.description ? (
                        <div className="text-xs text-muted-foreground">{selectedCampaign.description}</div>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="minLevel">Nível mínimo</Label>
                        <Input
                          id="minLevel"
                          type="number"
                          min="1"
                          value={draft.min_level}
                          onChange={(e) => updateDraft({ min_level: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Dificuldade</Label>
                        <Input
                          id="difficulty"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={draft.difficulty}
                          onChange={(e) => updateDraft({ difficulty: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="description">Descrição</Label>
                      <textarea
                        id="description"
                        value={draft.description}
                        onChange={(e) => updateDraft({ description: e.target.value })}
                        className="flex min-h-[130px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Crie uma descrição imersiva para o jogador."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Preview</div>
                      <div className="rounded-lg overflow-hidden border bg-muted/30 aspect-video flex items-center justify-center">
                        {mediaPreviewUrl ? (
                          mediaPreviewIsVideo ? (
                            <video className="w-full h-full object-cover" src={mediaPreviewUrl} autoPlay loop muted playsInline preload="metadata" />
                          ) : (
                            <img className="w-full h-full object-cover" src={mediaPreviewUrl} alt="" />
                          )
                        ) : (
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Sem mídia
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageFile">Mídia do mapa (imagem ou mp4)</Label>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*,video/mp4"
                          onChange={(e) => updateDraft({ image_file: e.target.files?.[0] || null })}
                        />
                        {selectedMap?.image_path ? (
                          <div className="text-xs text-muted-foreground truncate">{String(selectedMap.image_path).replace(/\\/g, '/')}</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Trilha sonora</Label>
                        <Select value={draft.soundtrack_mode} onValueChange={(v) => updateDraft({ soundtrack_mode: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upload">Upload</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="none">Nenhuma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {draft.soundtrack_mode === 'upload' ? (
                        <div className="space-y-2">
                          <Label htmlFor="soundtrackFile">Arquivo de áudio</Label>
                          <Input
                            id="soundtrackFile"
                            type="file"
                            accept="audio/*"
                            onChange={(e) => updateDraft({ soundtrack_file: e.target.files?.[0] || null })}
                          />
                          {(selectedMap?.soundtrack_path && !draft.soundtrack_file) ? (
                            <div className="text-xs text-muted-foreground truncate">{String(selectedMap.soundtrack_path).replace(/\\/g, '/')}</div>
                          ) : null}
                        </div>
                      ) : null}
                      {draft.soundtrack_mode === 'url' ? (
                        <div className="space-y-2">
                          <Label htmlFor="soundtrackUrl">URL</Label>
                          <Input
                            id="soundtrackUrl"
                            value={draft.soundtrack_url}
                            onChange={(e) => updateDraft({ soundtrack_url: e.target.value })}
                            placeholder="https://exemplo.com/musica.mp3"
                          />
                        </div>
                      ) : null}
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Music className="h-4 w-4" />
                          Preview da trilha
                        </div>
                        {soundtrackPreviewUrl ? (
                          <audio className="w-full mt-2" controls src={soundtrackPreviewUrl} />
                        ) : (
                          <div className="text-xs text-muted-foreground mt-2">Nenhuma trilha configurada.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="access">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={draft.is_active} onCheckedChange={(v) => updateDraft({ is_active: Boolean(v) })} />
                        <div>
                          <div className="text-sm font-semibold">Mapa ativo</div>
                          <div className="text-xs text-muted-foreground">Aparece no Explorar.</div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold">Requisito de item</div>
                            <div className="text-xs text-muted-foreground">Bloqueia acesso sem o item.</div>
                          </div>
                          <Checkbox
                            checked={draft.require_item}
                            onCheckedChange={(v) => updateDraft({ require_item: Boolean(v) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Item necessário</Label>
                          <select
                            value={draft.required_item_id}
                            onChange={(e) => updateDraft({ required_item_id: e.target.value })}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                            disabled={!draft.require_item}
                          >
                            <option value="">Selecione um item...</option>
                            {items.map(item => (
                              <option key={item.id} value={String(item.id)}>{item.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={draft.consume_on_enter}
                            onCheckedChange={(v) => updateDraft({ consume_on_enter: Boolean(v) })}
                            disabled={!draft.require_item}
                          />
                          <div>
                            <div className="text-sm font-semibold">Consumir ao entrar</div>
                            <div className="text-xs text-muted-foreground">Remove 1 item do inventário.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border p-4 bg-muted/20">
                        <div className="text-sm font-semibold">Resumo rápido</div>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Nível mínimo</div>
                            <div className="font-semibold">Lvl {draft.min_level}+</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Inimigos possíveis</div>
                            <div className="font-semibold">{draft.enemies.length}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Trilha sonora</div>
                            <div className="font-semibold">
                              {draft.soundtrack_mode === 'none' ? 'Nenhuma' : draft.soundtrack_mode === 'url' ? 'URL' : 'Upload'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="enemies">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">Selecionar inimigos</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={selectAllFilteredEnemies}>
                            Selecionar exibidos
                          </Button>
                          <Button variant="outline" size="sm" onClick={clearEnemies} disabled={selectedEnemyCount === 0}>
                            Limpar
                          </Button>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar inimigos..."
                          value={enemySearch}
                          onChange={(e) => setEnemySearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <ScrollArea className="h-[calc(100vh-420px)] rounded-lg border">
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {enemiesFiltered.map(enemy => {
                            const checked = draft.enemies.includes(Number(enemy.id));
                            const spriteUrl = toAssetUrl(enemy.sprite_path);
                            return (
                              <button
                                key={enemy.id}
                                type="button"
                                onClick={() => toggleEnemy(enemy.id)}
                                className={`w-full text-left rounded-md border p-3 transition-colors ${checked ? 'bg-accent border-primary/40' : 'hover:bg-accent/50 border-border'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox checked={checked} onCheckedChange={() => toggleEnemy(enemy.id)} />
                                  <Avatar className="h-9 w-9 rounded-md">
                                    {spriteUrl ? <AvatarImage src={spriteUrl} alt={enemy.name} className="object-contain" /> : null}
                                    <AvatarFallback className="rounded-md">{String(enemy.name || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{enemy.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {enemy.stage || enemy.base_level || 'Rookie'}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Selecionados</div>
                        <Badge variant="secondary">{selectedEnemyCount}</Badge>
                      </div>
                      <div className="rounded-lg border p-3 bg-muted/20">
                        {selectedEnemyCount === 0 ? (
                          <div className="text-sm text-muted-foreground">Nenhum inimigo selecionado.</div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedEnemiesPreview.map(enemy => (
                              <button
                                key={enemy.id}
                                type="button"
                                onClick={() => toggleEnemy(enemy.id)}
                                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                              >
                                <span className="truncate max-w-[180px]">{enemy.name}</span>
                                <X className="h-3 w-3 opacity-70" />
                              </button>
                            ))}
                            {selectedEnemyCount > selectedEnemiesPreview.length ? (
                              <Badge variant="outline">+{selectedEnemyCount - selectedEnemiesPreview.length}</Badge>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deletar mapa</DialogTitle>
            <DialogDescription>
              Esta ação é permanente. O mapa será removido do jogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteSelected} disabled={!draft.id}>Deletar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
