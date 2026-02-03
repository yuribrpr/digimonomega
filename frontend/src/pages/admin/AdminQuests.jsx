import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react';

const Textarea = (props) => (
  <textarea
    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  options,
  contentPlaceholder = "Buscar...",
  disabled,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              placeholder={contentPlaceholder}
              className="h-9 pl-9"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filtered.length > 0 ? (
          filtered.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-3 pb-2 text-xs text-muted-foreground">Nenhum resultado</div>
        )}
      </SelectContent>
    </Select>
  );
}

export default function AdminQuests() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [campaignQuery, setCampaignQuery] = useState('');
  const [questQuery, setQuestQuery] = useState('');
  
  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  
  // Form States
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', order: 0 });
  const [editingCampaign, setEditingCampaign] = useState(null);

  const [editingQuest, setEditingQuest] = useState(null);
  const [questForm, setQuestForm] = useState({
    campaign_id: '',
    title: '',
    description: '',
    npc_digimon_id: '',
    order: 0,
    restartable: false,
    objectives: [],
    rewards: []
  });

  // Resources for dropdowns
  const [digimons, setDigimons] = useState([]);
  const [items, setItems] = useState([]);
  const [enemies, setEnemies] = useState([]);

  useEffect(() => {
    fetchData();
    fetchResources();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/quests/campaigns');
      const next = res.data || [];
      setCampaigns(next);
      setSelectedCampaignId((prev) => {
        if (prev && prev !== 'ALL') {
          const exists = next.some((c) => String(c.id) === String(prev));
          if (exists) return prev;
        }
        return next.length > 0 ? String(next[0].id) : 'ALL';
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const [digiRes, itemRes, enemyRes] = await Promise.all([
        api.get('/api/digimons'),
        api.get('/api/items'),
        api.get('/api/enemies')
      ]);
      setDigimons(digiRes.data);
      setItems(itemRes.data);
      setEnemies(enemyRes.data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  // --- Campaign Handlers ---

  const handleSaveCampaign = async () => {
    try {
      if (editingCampaign) {
        await api.put(`/api/quests/admin/campaign/${editingCampaign.id}`, newCampaign);
      } else {
        await api.post('/api/quests/admin/campaign', newCampaign);
      }
      setIsCampaignModalOpen(false);
      setNewCampaign({ title: '', description: '', order: 0 });
      setEditingCampaign(null);
      fetchData();
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert("Erro ao salvar campanha");
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Tem certeza? Isso excluirá todas as missões desta campanha.")) return;
    try {
        await api.delete(`/api/quests/admin/campaign/${id}`);
        fetchData();
    } catch (error) {
        console.error("Error deleting campaign:", error);
        alert("Erro ao excluir campanha");
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setNewCampaign({ 
        title: campaign.title, 
        description: campaign.description, 
        order: campaign.order 
    });
    setIsCampaignModalOpen(true);
  };

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setNewCampaign({ title: '', description: '', order: 0 });
    setIsCampaignModalOpen(true);
  };

  // --- Quest Handlers ---

  const handleSaveQuest = async () => {
    try {
      if (editingQuest) {
        await api.put(`/api/quests/admin/quest/${editingQuest.id}`, questForm);
      } else {
        await api.post('/api/quests/admin/quest', questForm);
      }
      setIsQuestModalOpen(false);
      resetQuestForm();
      fetchData();
    } catch (error) {
      console.error("Error saving quest:", error);
      alert("Erro ao salvar missão");
    }
  };

  const handleSaveQuestAndContinue = async () => {
    try {
      if (editingQuest) {
        await api.put(`/api/quests/admin/quest/${editingQuest.id}`, questForm);
        setIsQuestModalOpen(false);
        resetQuestForm();
        fetchData();
        return;
      }

      await api.post('/api/quests/admin/quest', questForm);
      fetchData();

      setQuestForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        order: Number.isFinite(Number(prev.order)) ? Number(prev.order) + 1 : 0,
        objectives: [],
        rewards: [],
      }));
    } catch (error) {
      console.error("Error saving quest:", error);
      alert("Erro ao salvar missão");
    }
  };

  const handleDeleteQuest = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta missão?")) return;
    try {
        await api.delete(`/api/quests/admin/quest/${id}`);
        fetchData();
    } catch (error) {
        console.error("Error deleting quest:", error);
        alert("Erro ao excluir missão");
    }
  };

  const handleEditQuest = async (questId) => {
    try {
        const res = await api.get(`/api/quests/${questId}`);
        const q = res.data;
        setEditingQuest(q);
        setQuestForm({
            campaign_id: q.campaign_id?.toString(),
            title: q.title,
            description: q.description,
            npc_digimon_id: q.npc_digimon_id ? q.npc_digimon_id.toString() : '',
            order: q.order,
            restartable: !!q.restartable,
            objectives: q.objectives.map(o => ({
                ...o, 
                target_item_id: o.target_item_id ? o.target_item_id.toString() : '', 
                target_enemy_id: o.target_enemy_id ? o.target_enemy_id.toString() : ''
            })),
            rewards: q.rewards.map(r => ({
                ...r, 
                item_id: r.item_id ? r.item_id.toString() : '', 
                digimon_id: r.digimon_id ? r.digimon_id.toString() : ''
            }))
        });
        setIsQuestModalOpen(true);
    } catch (error) {
        console.error("Error fetching quest details for edit:", error);
    }
  };

  const handleDuplicateQuest = async (questId) => {
    try {
      const res = await api.get(`/api/quests/${questId}`);
      const q = res.data;

      setEditingQuest(null);
      setQuestForm({
        campaign_id: q.campaign_id?.toString() || '',
        title: `${q.title} (Cópia)`,
        description: q.description,
        npc_digimon_id: q.npc_digimon_id ? q.npc_digimon_id.toString() : '',
        order: Number.isFinite(Number(q.order)) ? Number(q.order) + 1 : 0,
        restartable: !!q.restartable,
        objectives: (q.objectives || []).map((o) => ({
          ...o,
          id: undefined,
          quest_id: undefined,
          target_item_id: o.target_item_id ? o.target_item_id.toString() : '',
          target_enemy_id: o.target_enemy_id ? o.target_enemy_id.toString() : '',
        })),
        rewards: (q.rewards || []).map((r) => ({
          ...r,
          id: undefined,
          quest_id: undefined,
          item_id: r.item_id ? r.item_id.toString() : '',
          digimon_id: r.digimon_id ? r.digimon_id.toString() : '',
        })),
      });
      setIsQuestModalOpen(true);
    } catch (error) {
      console.error("Error duplicating quest:", error);
      alert("Erro ao duplicar missão");
    }
  };

  const handleNewQuest = () => {
    resetQuestForm();
    if (selectedCampaignId && selectedCampaignId !== 'ALL') {
      setQuestForm((prev) => ({ ...prev, campaign_id: String(selectedCampaignId) }));
    }
    setIsQuestModalOpen(true);
  };

  const resetQuestForm = () => {
    setQuestForm({
      campaign_id: '',
      title: '',
      description: '',
      npc_digimon_id: '',
      order: 0,
      restartable: false,
      objectives: [],
      rewards: []
    });
    setEditingQuest(null);
  };

  // --- Form Helpers ---

  const addObjective = () => {
    setQuestForm({
      ...questForm,
      objectives: [...questForm.objectives, { type: 'COLLECT_ITEM', target_item_id: '', target_enemy_id: '', quantity_required: 1, description: '' }]
    });
  };

  const removeObjective = (index) => {
    const newObjs = [...questForm.objectives];
    newObjs.splice(index, 1);
    setQuestForm({ ...questForm, objectives: newObjs });
  };

  const updateObjective = (index, field, value) => {
    const newObjs = [...questForm.objectives];
    newObjs[index][field] = value;
    setQuestForm({ ...questForm, objectives: newObjs });
  };

  const addReward = () => {
    setQuestForm({
      ...questForm,
      rewards: [...questForm.rewards, { type: 'BITS', item_id: '', digimon_id: '', quantity: 1 }]
    });
  };

  const removeReward = (index) => {
    const newRewards = [...questForm.rewards];
    newRewards.splice(index, 1);
    setQuestForm({ ...questForm, rewards: newRewards });
  };

  const updateReward = (index, field, value) => {
    const newRewards = [...questForm.rewards];
    newRewards[index][field] = value;
    setQuestForm({ ...questForm, rewards: newRewards });
  };

  const allQuests = useMemo(() => {
    const rows = [];
    for (const c of campaigns) {
      for (const q of c.quests || []) {
        rows.push({ ...q, campaign: { id: c.id, title: c.title, order: c.order } });
      }
    }
    rows.sort((a, b) => {
      const ao = Number(a.campaign?.order ?? 0) - Number(b.campaign?.order ?? 0);
      if (ao !== 0) return ao;
      const qo = Number(a.order ?? 0) - Number(b.order ?? 0);
      if (qo !== 0) return qo;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return rows;
  }, [campaigns]);

  const questsForView = useMemo(() => {
    const base = selectedCampaignId === 'ALL'
      ? allQuests
      : allQuests.filter((q) => String(q.campaign_id) === String(selectedCampaignId) || String(q.campaign?.id) === String(selectedCampaignId));
    const q = questQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((row) => {
      const title = String(row.title || '').toLowerCase();
      const desc = String(row.description || '').toLowerCase();
      const camp = String(row.campaign?.title || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || camp.includes(q);
    });
  }, [allQuests, questQuery, selectedCampaignId]);

  if (loading) return <div className="p-8 text-white"><Loader2 className="animate-spin" /> Carregando...</div>;

  const filteredCampaigns = campaigns.filter((c) => {
    const q = campaignQuery.trim().toLowerCase();
    if (!q) return true;
    return (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const selectedCampaign = campaigns.find((c) => String(c.id) === String(selectedCampaignId)) || null;

  const campaignOptions = campaigns.map((c) => ({ value: String(c.id), label: c.title }));
  const digimonOptions = digimons.map((d) => ({ value: String(d.id), label: d.name }));
  const itemOptions = items.map((i) => ({ value: String(i.id), label: i.name }));
  const enemyOptions = enemies.map((e) => ({ value: String(e.id), label: e.name }));

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin: Missões e Campanhas</h1>
          <p className="text-muted-foreground text-sm">Crie, edite e duplique missões com mais rapidez.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewCampaign} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
            <Plus className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
          <Button onClick={handleNewQuest} variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> Nova Missão
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[420px_1fr]">
        <Card className="border-border min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-3">
              <span>Campanhas</span>
              <Badge variant="secondary">{campaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={campaignQuery}
                onChange={(e) => setCampaignQuery(e.target.value)}
                placeholder="Buscar campanha..."
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedCampaignId === 'ALL' ? "secondary" : "outline"}
                className="flex-1 justify-start"
                onClick={() => setSelectedCampaignId('ALL')}
              >
                Todas
              </Button>
              {selectedCampaign ? (
                <Button type="button" variant="outline" onClick={() => handleEditCampaign(selectedCampaign)}>
                  <Edit className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-2 pr-3">
                {filteredCampaigns.map((c) => {
                  const isActive = String(selectedCampaignId) === String(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCampaignId(String(c.id))}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isActive ? "border-primary/50 bg-primary/10" : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{c.description || "—"}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {(c.quests || []).length}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ordem</span>
                        <span className="font-mono">{c.order ?? 0}</span>
                      </div>
                    </button>
                  );
                })}

                {filteredCampaigns.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma campanha encontrada.</div>
                ) : null}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-3">
              <span>
                {selectedCampaignId === 'ALL'
                  ? "Todas as Missões"
                  : (selectedCampaign?.title || "Missões")}
              </span>
              <Badge variant="secondary">{questsForView.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="sticky top-3 z-10 -mx-6 bg-card/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={questQuery}
                    onChange={(e) => setQuestQuery(e.target.value)}
                    placeholder="Buscar missão por título, descrição ou campanha..."
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleNewQuest} className="md:shrink-0">
                  <Plus className="mr-2 h-4 w-4" /> Nova Missão
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {questsForView.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold truncate">{q.title}</div>
                        <Badge variant="outline" className="font-mono">#{q.order ?? 0}</Badge>
                        {q.restartable ? <Badge variant="secondary">Refazível</Badge> : null}
                        {selectedCampaignId === 'ALL' ? (
                          <Badge variant="outline" className="max-w-[240px] truncate">
                            {q.campaign?.title || "Campanha"}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{q.description}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleEditQuest(q.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDuplicateQuest(q.id)} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuest(q.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {questsForView.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma missão encontrada.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Campaign Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Criar Campanha'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={newCampaign.order} onChange={e => setNewCampaign({...newCampaign, order: parseInt(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full gap-2">
              {editingCampaign ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => handleDeleteCampaign(editingCampaign.id)}
                >
                  Excluir
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setIsCampaignModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveCampaign}>{editingCampaign ? 'Salvar' : 'Criar'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Quest Modal */}
      <Dialog open={isQuestModalOpen} onOpenChange={setIsQuestModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingQuest ? 'Editar Missão' : 'Criar Missão'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-bold border-b pb-2">Informações Básicas</h3>
                <div>
                    <Label>Campanha</Label>
                    <SearchableSelect
                      value={questForm.campaign_id}
                      onValueChange={(val) => setQuestForm({ ...questForm, campaign_id: val })}
                      placeholder="Selecione a Campanha"
                      options={campaignOptions}
                    />
                </div>
                <div>
                    <Label>Título</Label>
                    <Input value={questForm.title} onChange={e => setQuestForm({...questForm, title: e.target.value})} />
                </div>
                <div>
                    <Label>Descrição</Label>
                    <Textarea value={questForm.description} onChange={e => setQuestForm({...questForm, description: e.target.value})} />
                </div>
                <div>
                    <Label>Digimon NPC (ID)</Label>
                    <SearchableSelect
                      value={questForm.npc_digimon_id}
                      onValueChange={(val) => setQuestForm({ ...questForm, npc_digimon_id: val })}
                      placeholder="Selecione o NPC"
                      options={digimonOptions}
                      contentPlaceholder="Buscar digimon..."
                    />
                </div>
                <div>
                    <Label>Ordem</Label>
                    <Input type="number" value={questForm.order} onChange={e => setQuestForm({...questForm, order: parseInt(e.target.value)})} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-sm font-semibold">Permitir refazer</div>
                    <div className="text-xs text-slate-300">Se habilitado, o jogador pode recomeçar após concluir.</div>
                  </div>
                  <Checkbox
                    checked={!!questForm.restartable}
                    onCheckedChange={(checked) => setQuestForm({ ...questForm, restartable: !!checked })}
                  />
                </div>
            </div>

            <div className="space-y-6">
                {/* Objectives */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold">Objetivos</h3>
                        <Button size="sm" onClick={addObjective} variant="outline"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {questForm.objectives.map((obj, idx) => (
                        <div key={idx} className="bg-slate-800 p-2 rounded space-y-2 text-sm">
                            <div className="flex gap-2">
                                <Select value={obj.type} onValueChange={v => updateObjective(idx, 'type', v)}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COLLECT_ITEM">Coletar</SelectItem>
                                        <SelectItem value="KILL_ENEMY">Matar</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input 
                                    type="number" 
                                    placeholder="Qtd" 
                                    className="w-20" 
                                    value={obj.quantity_required} 
                                    onChange={e => updateObjective(idx, 'quantity_required', parseInt(e.target.value))} 
                                />
                                <Button size="icon" variant="destructive" onClick={() => removeObjective(idx)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            {obj.type === 'COLLECT_ITEM' ? (
                                <SearchableSelect
                                  value={obj.target_item_id}
                                  onValueChange={(v) => updateObjective(idx, 'target_item_id', v)}
                                  placeholder="Selecione o Item"
                                  options={itemOptions}
                                  contentPlaceholder="Buscar item..."
                                />
                            ) : (
                                <SearchableSelect
                                  value={obj.target_enemy_id}
                                  onValueChange={(v) => updateObjective(idx, 'target_enemy_id', v)}
                                  placeholder="Selecione o Inimigo"
                                  options={enemyOptions}
                                  contentPlaceholder="Buscar inimigo..."
                                />
                            )}
                            <Input placeholder="Custom Description (Optional)" value={obj.description} onChange={e => updateObjective(idx, 'description', e.target.value)} />
                        </div>
                    ))}
                </div>

                {/* Rewards */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold">Recompensas</h3>
                        <Button size="sm" onClick={addReward} variant="outline"><Plus className="h-4 w-4" /></Button>
                    </div>
                    {questForm.rewards.map((rw, idx) => (
                        <div key={idx} className="bg-slate-800 p-2 rounded space-y-2 text-sm">
                            <div className="flex gap-2">
                                <Select value={rw.type} onValueChange={v => updateReward(idx, 'type', v)}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BITS">Bits</SelectItem>
                                        <SelectItem value="XP">XP</SelectItem>
                                        <SelectItem value="ITEM">Item</SelectItem>
                                        <SelectItem value="DIGIMON">Digimon</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input 
                                    type="number" 
                                    placeholder="Qtd" 
                                    className="w-20" 
                                    value={rw.quantity} 
                                    onChange={e => updateReward(idx, 'quantity', parseInt(e.target.value))} 
                                />
                                <Button size="icon" variant="destructive" onClick={() => removeReward(idx)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            {rw.type === 'ITEM' && (
                                <SearchableSelect
                                  value={rw.item_id}
                                  onValueChange={(v) => updateReward(idx, 'item_id', v)}
                                  placeholder="Selecione o Item"
                                  options={itemOptions}
                                  contentPlaceholder="Buscar item..."
                                />
                            )}
                            {rw.type === 'DIGIMON' && (
                                <SearchableSelect
                                  value={rw.digimon_id}
                                  onValueChange={(v) => updateReward(idx, 'digimon_id', v)}
                                  placeholder="Selecione o Digimon"
                                  options={digimonOptions}
                                  contentPlaceholder="Buscar digimon..."
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsQuestModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="secondary" onClick={handleSaveQuestAndContinue}>
                {editingQuest ? 'Salvar' : 'Criar e continuar'}
              </Button>
              <Button type="button" onClick={handleSaveQuest}>
                {editingQuest ? 'Salvar e fechar' : 'Criar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
