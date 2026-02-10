import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, Compass, Lock, Map as MapIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

function mapType(map) {
  return map?.type || 'Campanha';
}

function mapIsActive(map) {
  return map?.is_active === 1 || map?.is_active === true;
}

export default function Exploration() {
  const [maps, setMaps] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [userLevel, setUserLevel] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Campanha');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterLock, setFilterLock] = useState('all');

  const campaignScrollerRef = useRef(null);
  const campaignDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const fetchMaps = useCallback(async () => {
    try {
      const response = await api.get('/api/maps');
      setMaps(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar mapas:', error);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      if (!userId) return;
      const res = await api.get(`/api/items/user/${userId}`);
      setInventory(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
    }
  }, [userId]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/api/items');
      setItems(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.get('/api/quests/campaigns');
      setCampaigns(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    }
  }, []);

  const fetchUserLevel = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/api/users/${userId}/digimons`);
      const main = res.data.find(d => d.principal === 1 || d.is_main === 1 || d.principal === true || d.is_main === true) || res.data[0];
      if (main) {
        const level = main.level || main.base_level || 1;
        setUserLevel(level);
      }
    } catch (error) {
      console.error('Erro ao buscar nível do usuário:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchMaps();
    fetchUserLevel();
    fetchInventory();
    fetchItems();
    fetchCampaigns();
  }, [fetchCampaigns, fetchInventory, fetchItems, fetchMaps, fetchUserLevel]);

  const inventoryById = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach(inv => {
      m.set(Number(inv.id), Number(inv.quantity || 0));
    });
    return m;
  }, [inventory]);

  const itemsById = useMemo(() => {
    const m = new Map();
    (items || []).forEach(i => m.set(Number(i.id), i));
    return m;
  }, [items]);

  const getLockState = useCallback((map) => {
    const levelLocked = userLevel < Number(map.min_level || 0);
    let itemLocked = false;
    if (map.require_item && Number(map.required_item_id)) {
      const qty = inventoryById.get(Number(map.required_item_id)) || 0;
      itemLocked = qty <= 0;
    }
    return { levelLocked, itemLocked, isLocked: levelLocked || itemLocked };
  }, [inventoryById, userLevel]);

  const getRequiredItem = useCallback((map) => {
    const reqId = Number(map?.required_item_id);
    if (!reqId) return null;
    return itemsById.get(reqId) || null;
  }, [itemsById]);

  const handleEnterMap = (map) => {
    const lock = getLockState(map);
    if (lock.levelLocked) {
      alert(`Seu Digimon precisa ser nível ${map.min_level} para entrar aqui!`);
      return;
    }
    if (lock.itemLocked) {
      alert('Você não possui o item necessário para acessar este mapa.');
      return;
    }
    navigate(`/battle?mapId=${map.id}`);
  };

  const getNextPlayableMap = (mapsFor) => {
    return (mapsFor || [])
      .slice()
      .sort((a, b) => {
        const al = Number(a.min_level || 0);
        const bl = Number(b.min_level || 0);
        if (al !== bl) return al - bl;
        return String(a.name || '').localeCompare(String(b.name || ''));
      })
      .find(m => !getLockState(m).isLocked) || null;
  };

  const getGroupBackdrop = (mapsFor) => {
    const withMedia = (mapsFor || []).find(m => m?.image_path);
    if (!withMedia?.image_path) return null;
    return toAssetUrl(withMedia.image_path);
  };

  const filteredActiveMaps = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (maps || [])
      .filter(mapIsActive)
      .filter(m => {
        if (filterType !== 'all' && mapType(m) !== filterType) return false;
        if (filterCampaign !== 'all') {
          if (filterCampaign === 'NONE') {
            if (m.campaign_id) return false;
          } else if (String(m.campaign_id || '') !== String(filterCampaign)) {
            return false;
          }
        }
        if (term && !String(m.name || '').toLowerCase().includes(term)) return false;
        if (filterLock !== 'all') {
          const locked = getLockState(m).isLocked;
          if (filterLock === 'locked' && !locked) return false;
          if (filterLock === 'unlocked' && locked) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const al = Number(a.min_level || 0);
        const bl = Number(b.min_level || 0);
        if (al !== bl) return al - bl;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [maps, searchTerm, filterType, filterCampaign, filterLock, getLockState]);

  const campaignGroups = useMemo(() => {
    const byKey = new Map();
    filteredActiveMaps
      .filter(m => mapType(m) === 'Campanha')
      .forEach(m => {
        const key = m.campaign_id ? String(m.campaign_id) : 'NONE';
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push(m);
      });

    const ordered = [
      ...campaigns.map(c => String(c.id)).filter(k => byKey.has(k)),
      ...(byKey.has('NONE') ? ['NONE'] : []),
      ...Array.from(byKey.keys()).filter(k => k !== 'NONE' && !campaigns.find(c => String(c.id) === String(k))),
    ];

    return ordered.map(key => {
      const campaign = key === 'NONE' ? null : (campaigns.find(c => String(c.id) === String(key)) || null);
      const mapsFor = byKey.get(key) || [];
      const unlocked = mapsFor.filter(m => !getLockState(m).isLocked).length;
      const progress = mapsFor.length ? Math.round((unlocked / mapsFor.length) * 100) : 0;
      return {
        key,
        title: campaign?.title || 'Sem campanha',
        description: campaign?.description || '',
        maps: mapsFor,
        unlocked,
        total: mapsFor.length,
        progress,
      };
    });
  }, [filteredActiveMaps, campaigns, getLockState]);

  const raidMaps = useMemo(() => filteredActiveMaps.filter(m => mapType(m) === 'Raid'), [filteredActiveMaps]);
  const eventMaps = useMemo(() => filteredActiveMaps.filter(m => mapType(m) === 'Evento'), [filteredActiveMaps]);

  const scrollCampaignsBy = useCallback((direction) => {
    const el = campaignScrollerRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }, []);

  const MapRow = ({ map, index }) => {
    const lock = getLockState(map);
    const reqItem = getRequiredItem(map);
    const thumbUrl = toAssetUrl(map.image_path);
    return (
      <button
        type="button"
        disabled={lock.isLocked}
        className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${lock.isLocked ? '' : 'hover:bg-muted/40'}`}
        onClick={() => handleEnterMap(map)}
      >
        <div className="w-8 shrink-0 text-center text-xs font-semibold text-muted-foreground">
          {typeof index === 'number' ? String(index + 1).padStart(2, '0') : '—'}
        </div>

        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
          {thumbUrl ? (
            isMp4(map.image_path) ? (
              <video className="h-full w-full object-cover" src={thumbUrl} muted playsInline preload="metadata" />
            ) : (
              <img className="h-full w-full object-cover" src={thumbUrl} alt={map.name} loading="lazy" />
            )
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <MapIcon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="truncate text-sm font-semibold">{map.name}</div>
            {lock.isLocked ? <Lock className="h-4 w-4 text-muted-foreground shrink-0" /> : null}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {map.description || 'Uma área misteriosa do Digimundo.'}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>Lv {map.min_level}+</span>
            {map.difficulty && Number(map.difficulty) !== 1 ? <span>x{map.difficulty}</span> : null}
            {reqItem ? <span>Requer: {reqItem.name}{map.consume_on_enter ? ' (consome)' : ''}</span> : null}
          </div>
        </div>
      </button>
    );
  };

  const CampaignRoute = ({ mapsFor }) => {
    const sorted = (mapsFor || []).slice().sort((a, b) => {
      const al = Number(a.min_level || 0);
      const bl = Number(b.min_level || 0);
      if (al !== bl) return al - bl;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    const nextPlayable = getNextPlayableMap(sorted);
    const nextId = nextPlayable?.id ? Number(nextPlayable.id) : null;

    return (
      <div className="w-full overflow-x-hidden">
      <div className="grid w-full min-w-0 grid-cols-[36px_1fr] gap-x-3">
        {sorted.map((map, idx) => {
          const lock = getLockState(map);
          const reqItem = getRequiredItem(map);
          const isNext = nextId !== null && Number(map.id) === nextId;
          const thumbUrl = toAssetUrl(map.image_path);
          const isFirst = idx === 0;
          const isLast = idx === sorted.length - 1;

          const nodeTone = isNext
            ? 'border-primary/45 bg-primary/5'
            : (lock.isLocked ? 'border-border bg-background' : 'border-primary/20 bg-primary/5');

          const dotTone = isNext
            ? 'bg-primary text-primary-foreground outline outline-2 outline-primary/25'
            : (lock.isLocked ? 'bg-muted-foreground/70 text-background' : 'bg-primary/80 text-primary-foreground');

          return (
            <React.Fragment key={map.id}>
              <div className="relative flex justify-center">
                <div className={`absolute ${isFirst ? 'top-4' : 'top-0'} ${isLast ? 'bottom-4' : 'bottom-0'} w-px bg-border/70`} />
                <div className={`relative z-10 mt-2 h-8 w-8 rounded-full shadow-sm ring-2 ring-background flex items-center justify-center text-sm font-bold tabular-nums ${dotTone}`}>
                  {idx + 1}
                </div>
              </div>

              <div className="py-2">
                <button
                  type="button"
                  disabled={lock.isLocked}
                  className={`w-full min-w-0 overflow-hidden rounded-lg border p-2.5 text-left transition-colors disabled:opacity-80 disabled:cursor-not-allowed ${nodeTone} ${lock.isLocked ? '' : 'hover:bg-muted/40'}`}
                  onClick={() => handleEnterMap(map)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {thumbUrl ? (
                        isMp4(map.image_path) ? (
                          <video className="h-full w-full object-cover" src={thumbUrl} muted playsInline preload="metadata" />
                        ) : (
                          <img className="h-full w-full object-cover" src={thumbUrl} alt={map.name} loading="lazy" />
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <MapIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="truncate text-sm font-semibold">{map.name}</div>
                        {isNext ? <Badge variant="secondary" className="h-5 px-2 shrink-0">Próximo</Badge> : null}
                        {lock.isLocked ? <Lock className="h-4 w-4 text-muted-foreground shrink-0" /> : null}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {map.description || 'Uma área misteriosa do Digimundo.'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Lv {map.min_level}+</span>
                        {map.difficulty && Number(map.difficulty) !== 1 ? <span>x{map.difficulty}</span> : null}
                        {reqItem ? <span>Requer: {reqItem.name}{map.consume_on_enter ? ' (consome)' : ''}</span> : null}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {!isLast ? (
                <>
                  <div className="relative flex justify-center h-6">
                    <div className="absolute inset-y-0 w-px bg-border/70" />
                    <ArrowDown className="relative z-10 mt-1 h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="h-6" />
                </>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4 md:py-8 space-y-6 px-2 md:px-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Compass className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mapa-Múndi</h1>
            <p className="text-sm text-muted-foreground">Escolha onde viajar e continuar sua jornada.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">Nível {userLevel}</Badge>
          <Badge variant="outline">{filteredActiveMaps.length} áreas</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_240px_180px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
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
              <SelectItem value="all">Todas as campanhas</SelectItem>
              <SelectItem value="NONE">Sem campanha</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterLock} onValueChange={setFilterLock}>
            <SelectTrigger>
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Acesso (todos)</SelectItem>
              <SelectItem value="unlocked">Liberados</SelectItem>
              <SelectItem value="locked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-10">
          {(filterType === 'all' || filterType === 'Campanha') ? (
            <div className="space-y-6">
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => scrollCampaignsBy(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => scrollCampaignsBy(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div
                ref={campaignScrollerRef}
                className="overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none snap-x snap-mandatory"
                style={{ scrollbarWidth: 'thin' }}
                onMouseDown={(e) => {
                  const el = campaignScrollerRef.current;
                  if (!el) return;
                  campaignDragRef.current.isDown = true;
                  campaignDragRef.current.startX = e.pageX;
                  campaignDragRef.current.scrollLeft = el.scrollLeft;
                }}
                onMouseUp={() => {
                  campaignDragRef.current.isDown = false;
                }}
                onMouseLeave={() => {
                  campaignDragRef.current.isDown = false;
                }}
                onMouseMove={(e) => {
                  const el = campaignScrollerRef.current;
                  if (!el) return;
                  if (!campaignDragRef.current.isDown) return;
                  e.preventDefault();
                  const walk = (e.pageX - campaignDragRef.current.startX) * 1.15;
                  el.scrollLeft = campaignDragRef.current.scrollLeft - walk;
                }}
              >
                <div className="flex gap-6 min-w-max px-1">
                  {campaignGroups
                    .filter(g => filterCampaign === 'all' ? true : (filterCampaign === 'NONE' ? g.key === 'NONE' : String(g.key) === String(filterCampaign)))
                    .map(group => {
                      const backdrop = getGroupBackdrop(group.maps);
                      return (
                        <Card
                          key={group.key}
                          className="flex-none snap-start w-[92vw] sm:w-[520px] lg:w-[560px]"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                                {backdrop && !isMp4(backdrop) ? (
                                  <img className="h-full w-full object-cover" src={backdrop} alt={group.title} loading="lazy" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                    <MapIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg truncate">{group.title}</CardTitle>
                                {group.description ? (
                                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{group.description}</div>
                                ) : null}
                              </div>
                              <div className="shrink-0 text-sm text-muted-foreground tabular-nums">
                                {group.unlocked}/{group.total}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 space-y-4">
                            <div className="max-h-[520px] overflow-y-auto overflow-x-hidden pr-1">
                              <CampaignRoute mapsFor={group.maps} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>

              {campaignGroups.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nenhuma campanha disponível.</div>
              ) : null}
            </div>
          ) : null}

          {(filterType === 'all' || filterType === 'Raid') ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold tracking-tight">Raids</div>
                  <div className="text-sm text-muted-foreground">Enfrente chefes e conquiste recompensas.</div>
                </div>
                <Badge variant="outline">{raidMaps.length}</Badge>
              </div>

              {raidMaps.length === 0 ? (
                <div className="text-muted-foreground">Nenhum mapa de raid encontrado.</div>
              ) : (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    {raidMaps.map((m, idx) => <MapRow key={m.id} map={m} index={idx} />)}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {(filterType === 'all' || filterType === 'Evento') ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold tracking-tight">Eventos</div>
                  <div className="text-sm text-muted-foreground">Rotas temporárias e desafios especiais.</div>
                </div>
                <Badge variant="outline">{eventMaps.length}</Badge>
              </div>

              {eventMaps.length === 0 ? (
                <div className="text-muted-foreground">Nenhum mapa de evento encontrado.</div>
              ) : (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    {eventMaps.map((m, idx) => <MapRow key={m.id} map={m} index={idx} />)}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {filteredActiveMaps.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Nenhum mapa encontrado.</div>
          ) : null}
      </div>

    </div>
  );
}
