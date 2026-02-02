import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';

const Textarea = (props) => (
  <textarea
    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

export default function AdminQuests() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
      setCampaigns(res.data);
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

  const handleNewQuest = () => {
    resetQuestForm();
    setIsQuestModalOpen(true);
  };

  const resetQuestForm = () => {
    setQuestForm({
      campaign_id: '',
      title: '',
      description: '',
      npc_digimon_id: '',
      order: 0,
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

  if (loading) return <div className="p-8 text-white"><Loader2 className="animate-spin" /> Carregando...</div>;

  return (
    <div className="min-h-screen text-slate-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin: Missões e Campanhas</h1>
        <div className="flex gap-2">
            <Button onClick={handleNewCampaign} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                <Plus className="mr-2 h-4 w-4" /> Nova Campanha
            </Button>
            <Button onClick={handleNewQuest} variant="secondary">
                <Plus className="mr-2 h-4 w-4" /> Nova Missão
            </Button>
        </div>
      </div>

      <div className="space-y-6">
        {campaigns.map(campaign => (
          <Card key={campaign.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>{campaign.title} (Ordem: {campaign.order})</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCampaign(campaign)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Missões ({campaign.quests.length})</h4>
                    <div className="space-y-2 pl-2 border-l-2 border-slate-800">
                      {campaign.quests.map(quest => (
                        <div key={quest.id} className="flex justify-between items-center p-3 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors group">
                          <div>
                            <p className="font-bold">{quest.title}</p>
                            <p className="text-sm text-slate-400">{quest.description}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => handleEditQuest(quest.id)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteQuest(quest.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                      {campaign.quests.length === 0 && <p className="text-slate-500 text-sm italic">Nenhuma missão nesta campanha.</p>}
                    </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            <Button onClick={handleSaveCampaign}>{editingCampaign ? 'Salvar' : 'Criar'}</Button>
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
                    <Select value={questForm.campaign_id} onValueChange={val => setQuestForm({...questForm, campaign_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Selecione a Campanha" /></SelectTrigger>
                        <SelectContent>
                            {campaigns.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                    <Select value={questForm.npc_digimon_id} onValueChange={val => setQuestForm({...questForm, npc_digimon_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Selecione o NPC" /></SelectTrigger>
                        <SelectContent>
                            {digimons.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Ordem</Label>
                    <Input type="number" value={questForm.order} onChange={e => setQuestForm({...questForm, order: parseInt(e.target.value)})} />
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
                                <Select value={obj.target_item_id} onValueChange={v => updateObjective(idx, 'target_item_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o Item" /></SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Select value={obj.target_enemy_id} onValueChange={v => updateObjective(idx, 'target_enemy_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o Inimigo" /></SelectTrigger>
                                    <SelectContent>
                                        {enemies.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                                <Select value={rw.item_id} onValueChange={v => updateReward(idx, 'item_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            {rw.type === 'DIGIMON' && (
                                <Select value={rw.digimon_id} onValueChange={v => updateReward(idx, 'digimon_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Digimon" /></SelectTrigger>
                                    <SelectContent>
                                        {digimons.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveQuest}>{editingQuest ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
