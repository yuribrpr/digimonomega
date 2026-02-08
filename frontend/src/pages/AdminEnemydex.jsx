import React, { useMemo, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Pencil, Trash2, Plus, Search, Layers, Filter, Copy, ChevronDown } from 'lucide-react';
import api from '../services/api';
export default function AdminEnemydex() {
  const [enemies, setEnemies] = useState([]);
  const [filteredEnemies, setFilteredEnemies] = useState([]);
  const [maps, setMaps] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [mapFilter, setMapFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('name-asc');
  const [name, setName] = useState('');
  const [type, setType] = useState('Vacina');
  const [difficulty, setDifficulty] = useState('Normal');
  const [hp, setHp] = useState('');
  const [atk, setAtk] = useState('');
  const [def, setDef] = useState('');
  const [atkSpeed, setAtkSpeed] = useState('');
  const [baseLevel, setBaseLevel] = useState('');
  const [stage, setStage] = useState('Rookie');
  const [file, setFile] = useState(null);
  const [spritePreview, setSpritePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [expReward, setExpReward] = useState('');
  const [bitsReward, setBitsReward] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [items, setItems] = useState([]);
  const [drops, setDrops] = useState([]);
  const [formTab, setFormTab] = useState('dados');
  const [selectedEnemyIds, setSelectedEnemyIds] = useState([]);
  const [bulkType, setBulkType] = useState('keep');
  const [bulkDifficulty, setBulkDifficulty] = useState('keep');
  const [bulkHp, setBulkHp] = useState('');
  const [bulkAtk, setBulkAtk] = useState('');
  const [bulkDef, setBulkDef] = useState('');
  const [bulkAtkSpeed, setBulkAtkSpeed] = useState('');
  const [bulkExpReward, setBulkExpReward] = useState('');
  const [bulkBitsReward, setBulkBitsReward] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkTab, setBulkTab] = useState('stats');
  const [bulkDropsMode, setBulkDropsMode] = useState('replace');
  const [bulkDrops, setBulkDrops] = useState([]);
  const [bulkDropsSaving, setBulkDropsSaving] = useState(false);
  const [dropsByEnemyId, setDropsByEnemyId] = useState({});
  const [expandedDropsByEnemyId, setExpandedDropsByEnemyId] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalConfirmLabel, setModalConfirmLabel] = useState('Confirmar');
  const [modalCancelLabel, setModalCancelLabel] = useState('Cancelar');
  const [modalShowCancel, setModalShowCancel] = useState(true);
  const [modalOnConfirm, setModalOnConfirm] = useState(null);
  useEffect(() => {
    fetchEnemies();
    fetchItems();
    fetchMaps();
  }, []);
  useEffect(() => {
    if (!file) {
      setSpritePreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setSpritePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const fetchItems = async () => {
    try {
      const response = await api.get('/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };
  const fetchDrops = async (enemyId) => {
    try {
      const response = await api.get(`/api/enemies/${enemyId}/drops`);
      setDrops(response.data);
    } catch (error) {
      console.error('Erro ao buscar drops:', error);
      setDrops([]);
    }
  };
  const fetchEnemyDrops = async (enemyId) => {
    try {
      const response = await api.get(`/api/enemies/${enemyId}/drops`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  };
  useEffect(() => {
    filterEnemies();
    setPage(1);
  }, [searchTerm, typeFilter, mapFilter, enemies, maps]);
  const fetchEnemies = async () => {
    try {
      const response = await api.get('/api/enemies');
      setEnemies(response.data);
      setDropsByEnemyId({});
    } catch (error) {
      console.error('Erro ao buscar inimigos:', error);
    }
  };
  const fetchMaps = async () => {
    try {
      const response = await api.get('/api/maps');
      setMaps(response.data);
    } catch (error) {
      console.error('Erro ao buscar mapas:', error);
      setMaps([]);
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
    if (mapFilter && mapFilter !== 'Todos') {
      if (mapFilter === 'Sem mapa') {
        const withMap = new Set();
        maps.forEach((map) => {
          (map.enemies || []).forEach((enemy) => withMap.add(enemy.id));
        });
        result = result.filter(d => !withMap.has(d.id));
      } else {
        const selectedMap = maps.find((map) => String(map.id) === String(mapFilter));
        const ids = new Set((selectedMap?.enemies || []).map((enemy) => enemy.id));
        result = result.filter(d => ids.has(d.id));
      }
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
    setAtkSpeed('2.0');
    setBaseLevel('1');
    setStage('Rookie');
    setFile(null);
    setEditingEnemy(null);
    setExpReward('');
    setBitsReward('');
    setDrops([]);
    setFormTab('dados');
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
    setAtkSpeed(enemy.attack_speed || '2.0');
    setBaseLevel(enemy.base_level ?? enemy.level ?? enemy.nivel ?? '');
    setStage(enemy.stage ?? 'Rookie');
    setExpReward(enemy.exp_reward ?? '');
    setBitsReward(enemy.bits_reward ?? '');
    fetchDrops(enemy.id);
    setIsOpen(true);
  };
  const openInfo = (title, description) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalConfirmLabel('Ok');
    setModalCancelLabel('Cancelar');
    setModalShowCancel(false);
    setModalOnConfirm(() => null);
    setModalOpen(true);
  };
  const openConfirm = ({ title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm }) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalConfirmLabel(confirmLabel);
    setModalCancelLabel(cancelLabel);
    setModalShowCancel(true);
    setModalOnConfirm(() => onConfirm);
    setModalOpen(true);
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
        if (atkSpeed && atkSpeed !== (editingEnemy.attack_speed || '2.0')) formData.append('attack_speed', atkSpeed);
        if (baseLevel !== '' && Number(baseLevel) !== Number(editingEnemy.base_level ?? editingEnemy.level ?? 0)) formData.append('base_level', baseLevel);
        if (expReward !== '' && Number(expReward) !== Number(originalExp || 0)) formData.append('exp_reward', expReward);
        if (bitsReward !== '' && Number(bitsReward) !== Number(originalBits || 0)) formData.append('bits_reward', bitsReward);
        if (file) formData.append('sprite', file);
        formData.append('drops', JSON.stringify(drops));
        if ([...formData.entries()].length === 0) {
          openInfo('Sem alterações', 'Nenhuma alteração detectada para salvar.');
          setSaving(false);
          return;
        }
        await api.put(`/api/enemies/${editingEnemy.id}`,
          formData
        );
      } else {
        if (!name || !type || !hp || !atk || !def) {
          openInfo('Campos obrigatórios', 'Preencha Nome, Tipo, HP, Ataque e Defesa.');
          setSaving(false);
          return;
        }
        formData.append('name', name);
        formData.append('type', type);
        formData.append('difficulty', difficulty);
        formData.append('base_hp', hp);
        formData.append('base_attack', atk);
        formData.append('base_defense', def);
        formData.append('attack_speed', atkSpeed || '2.0');
        formData.append('base_level', baseLevel);
        formData.append('stage', stage || 'Rookie');
        formData.append('exp_reward', expReward);
        formData.append('bits_reward', bitsReward);
        if (file) {
          formData.append('sprite', file);
        }
        await api.post('/api/enemies',
          formData
        );
      }
      setIsOpen(false);
      fetchEnemies();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar inimigo:', error);
      const backendMsg = error?.response?.data?.error || error?.message || '';
      openInfo('Erro ao salvar', `${backendMsg ? 'Detalhe: ' + backendMsg : 'Verifique os campos e tente novamente.'}`);
    } finally {
      setSaving(false);
    }
  };
  const removeEnemyFromMaps = async (enemyId) => {
    let mapList = maps;
    if (mapList.length === 0) {
      try {
        const response = await api.get('/api/maps');
        mapList = response.data || [];
      } catch (error) {
        return;
      }
    }
    const affectedMaps = mapList.filter((map) => (map.enemies || []).some((enemy) => Number(enemy.id) === Number(enemyId)));
    if (affectedMaps.length === 0) return;
    await Promise.allSettled(
      affectedMaps.map((map) => {
        const enemyIds = (map.enemies || [])
          .map((enemy) => enemy.id)
          .filter((id) => Number(id) !== Number(enemyId));
        const formData = new FormData();
        formData.append('name', map.name || '');
        formData.append('min_level', map.min_level ?? 1);
        formData.append('description', map.description || '');
        formData.append('type', map.type || 'Campanha');
        formData.append('is_active', map.is_active ?? 1);
        if (map.require_item !== undefined && map.require_item !== null) {
          formData.append('require_item', map.require_item);
        }
        if (map.required_item_id !== undefined && map.required_item_id !== null) {
          formData.append('required_item_id', map.required_item_id);
        }
        if (map.consume_on_enter !== undefined && map.consume_on_enter !== null) {
          formData.append('consume_on_enter', map.consume_on_enter);
        }
        if (map.difficulty !== undefined && map.difficulty !== null) {
          formData.append('difficulty', map.difficulty);
        }
        formData.append('enemies', JSON.stringify(enemyIds));
        return api.put(`/api/maps/${map.id}`, formData);
      })
    );
  };
  const handleDelete = async (id) => {
    openConfirm({
      title: 'Excluir inimigo',
      description: 'Tem certeza que deseja excluir este inimigo? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        try {
          await removeEnemyFromMaps(id);
          await api.delete(`/api/enemies/${id}`);
          fetchMaps();
          fetchEnemies();
        } catch (error) {
          const message = error?.response?.data?.message || 'Não foi possível excluir o inimigo.';
          openInfo('Erro ao excluir', message);
        }
      }
    });
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
  const stageToLevel = (stageName) => {
    const s = String(stageName).toLowerCase();
    if (s === 'rookie') return 1;
    if (s === 'champion') return 2;
    if (s === 'ultimate') return 3;
    if (s === 'mega') return 4;
    if (s === 'burst mode' || s === 'burst_mode') return 5;
    return 1;
  };

  const generateStats = (stageVal, diffOverride) => {
    const level = stageToLevel(stageVal);
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

  const handleStageChange = (val) => {
    setStage(val);
    setBaseLevel(stageToLevel(val));
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
  const addBulkDrop = () => {
    setBulkDrops([...bulkDrops, { item_id: '', drop_rate: '' }]);
  };
  const removeBulkDrop = (index) => {
    setBulkDrops(bulkDrops.filter((_, i) => i !== index));
  };
  const updateBulkDrop = (index, field, value) => {
    const next = [...bulkDrops];
    next[index][field] = value;
    setBulkDrops(next);
  };
  const toggleEnemySelection = (id) => {
    setSelectedEnemyIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };
  const clearSelection = () => {
    setSelectedEnemyIds([]);
  };
  const buildBulkFormData = () => {
    const formData = new FormData();
    if (bulkType !== 'keep') formData.append('type', bulkType);
    if (bulkDifficulty !== 'keep') formData.append('difficulty', bulkDifficulty);
    if (bulkHp !== '') formData.append('base_hp', bulkHp);
    if (bulkAtk !== '') formData.append('base_attack', bulkAtk);
    if (bulkDef !== '') formData.append('base_defense', bulkDef);
    if (bulkAtkSpeed !== '') formData.append('attack_speed', bulkAtkSpeed);
    if (bulkExpReward !== '') formData.append('exp_reward', bulkExpReward);
    if (bulkBitsReward !== '') formData.append('bits_reward', bulkBitsReward);
    if ([...formData.entries()].length === 0) return null;
    return formData;
  };
  const applyBulkUpdate = async () => {
    if (selectedEnemyIds.length === 0) {
      openInfo('Seleção necessária', 'Selecione pelo menos um inimigo.');
      return;
    }
    const baseFormData = buildBulkFormData();
    if (!baseFormData) {
      openInfo('Campos vazios', 'Preencha ao menos um campo para aplicar em lote.');
      return;
    }
    setBulkSaving(true);
    const results = await Promise.allSettled(
      selectedEnemyIds.map((id) => {
        const formData = new FormData();
        for (const [key, value] of baseFormData.entries()) {
          formData.append(key, value);
        }
        return api.put(`/api/enemies/${id}`, formData);
      })
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    setBulkSaving(false);
    fetchEnemies();
    if (failed > 0) {
      openInfo('Atualização em lote', `Concluída com ${failed} falhas.`);
    }
  };
  const bulkDelete = async () => {
    if (selectedEnemyIds.length === 0) {
      openInfo('Seleção necessária', 'Selecione pelo menos um inimigo.');
      return;
    }
    openConfirm({
      title: 'Excluir inimigos',
      description: `Excluir ${selectedEnemyIds.length} inimigos selecionados? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        await Promise.allSettled(selectedEnemyIds.map((id) => removeEnemyFromMaps(id)));
        const results = await Promise.allSettled(
          selectedEnemyIds.map((id) => api.delete(`/api/enemies/${id}`))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        fetchMaps();
        fetchEnemies();
        clearSelection();
        if (failed > 0) {
          const firstError = results.find(r => r.status === 'rejected')?.reason;
          const message = firstError?.response?.data?.message || `Concluída com ${failed} falhas.`;
          openInfo('Exclusão em lote', message);
        }
      }
    });
  };
  const applyBulkDrops = async () => {
    if (selectedEnemyIds.length === 0) {
      openInfo('Seleção necessária', 'Selecione pelo menos um inimigo.');
      return;
    }
    let payloadDrops = [];
    if (bulkDropsMode === 'replace') {
      const invalid = bulkDrops.some((drop) => !drop.item_id || drop.drop_rate === '');
      if (bulkDrops.length === 0 || invalid) {
        openInfo('Drops incompletos', 'Preencha ao menos um drop completo (item e rate).');
        return;
      }
      payloadDrops = bulkDrops.map((drop) => ({
        item_id: Number(drop.item_id),
        drop_rate: Number(drop.drop_rate)
      }));
    }
    setBulkDropsSaving(true);
    const results = await Promise.allSettled(
      selectedEnemyIds.map((id) => {
        const formData = new FormData();
        formData.append('drops', JSON.stringify(payloadDrops));
        return api.put(`/api/enemies/${id}`, formData);
      })
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    setBulkDropsSaving(false);
    fetchEnemies();
    if (failed > 0) {
      openInfo('Drops em lote', `Concluída com ${failed} falhas.`);
    }
  };
  const buildDuplicateFormData = (enemy, drops, suffix) => {
    const formData = new FormData();
    const originalName = enemy.name || 'Inimigo';
    formData.append('name', `${originalName} ${suffix}`);
    formData.append('type', enemy.type || 'Vacina');
    const diff = enemy.difficulty === 'Boss' || enemy.difficulty === 'boss' || enemy.difficulty === 1 ? 'Boss' : 'Normal';
    formData.append('difficulty', diff);
    formData.append('base_hp', enemy.base_hp ?? enemy.hp ?? enemy.vida ?? 0);
    formData.append('base_attack', enemy.base_attack ?? enemy.attack ?? enemy.atk ?? enemy.ataque ?? 0);
    formData.append('base_defense', enemy.base_defense ?? enemy.defense ?? enemy.def ?? enemy.defesa ?? 0);
    formData.append('attack_speed', enemy.attack_speed ?? 2.0);
    const exp = enemy.exp_reward ?? Math.round(((enemy.base_attack ?? enemy.attack ?? 0) + (enemy.base_defense ?? enemy.defense ?? 0)) / 2);
    const bits = enemy.bits_reward ?? Math.round(Number(exp) * 0.5);
    formData.append('exp_reward', exp);
    formData.append('bits_reward', bits);
    if (drops.length > 0) {
      const normalized = drops.map((drop) => ({
        item_id: drop.item_id,
        drop_rate: drop.drop_rate
      }));
      formData.append('drops', JSON.stringify(normalized));
    }
    return formData;
  };
  const buildMapPayload = (map, enemyIds) => ({
    name: map.name ?? '',
    min_level: map.min_level ?? map.minLevel ?? 1,
    description: map.description ?? '',
    type: map.type ?? 'Campanha',
    is_active: map.is_active ?? map.isActive ?? 0,
    require_item: map.require_item ?? map.requireItem ?? 0,
    required_item_id: map.required_item_id ?? map.requiredItemId ?? null,
    consume_on_enter: map.consume_on_enter ?? map.consumeOnEnter ?? 0,
    difficulty: map.difficulty ?? 1.0,
    enemies: enemyIds
  });
  const attachEnemyToMaps = async (originalId, newEnemyId) => {
    const mapsToUpdate = maps.filter((map) => (map.enemies || []).some((enemy) => enemy.id === originalId));
    if (mapsToUpdate.length === 0) return;
    await Promise.allSettled(
      mapsToUpdate.map((map) => {
        const enemyIds = Array.from(new Set([...(map.enemies || []).map((enemy) => enemy.id), newEnemyId]));
        return api.put(`/api/maps/${map.id}`, buildMapPayload(map, enemyIds));
      })
    );
    fetchMaps();
  };
  const handleDuplicate = async (enemy) => {
    const dropsList = await fetchEnemyDrops(enemy.id);
    const formData = buildDuplicateFormData(enemy, dropsList, '(Cópia)');
    try {
      const response = await api.post('/api/enemies', formData);
      const newEnemyId = response?.data?.id;
      if (newEnemyId) {
        await attachEnemyToMaps(enemy.id, newEnemyId);
      }
      fetchEnemies();
    } catch (error) {
      openInfo('Erro ao duplicar', 'Não foi possível duplicar o inimigo.');
    }
  };
  const duplicateSelected = async () => {
    if (selectedEnemyIds.length === 0) {
      openInfo('Seleção necessária', 'Selecione pelo menos um inimigo.');
      return;
    }
    openConfirm({
      title: 'Duplicar inimigos',
      description: `Criar cópias de ${selectedEnemyIds.length} inimigos selecionados?`,
      confirmLabel: 'Duplicar',
      onConfirm: async () => {
        const byId = new Map(enemies.map((enemy) => [enemy.id, enemy]));
        const results = await Promise.allSettled(
          selectedEnemyIds.map(async (id, index) => {
            const enemy = byId.get(id);
            if (!enemy) return null;
            const dropsList = await fetchEnemyDrops(id);
            const suffix = `(Cópia ${index + 1})`;
            const formData = buildDuplicateFormData(enemy, dropsList, suffix);
            const response = await api.post('/api/enemies', formData);
            const newEnemyId = response?.data?.id;
            if (newEnemyId) {
              await attachEnemyToMaps(enemy.id, newEnemyId);
            }
            return response;
          })
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        fetchEnemies();
        if (failed > 0) {
          openInfo('Duplicação em lote', `Concluída com ${failed} falhas.`);
        }
      }
    });
  };
  const mapIndex = useMemo(() => {
    const index = new Map();
    maps.forEach((map) => {
      (map.enemies || []).forEach((enemy) => {
        if (!index.has(enemy.id)) index.set(enemy.id, []);
        index.get(enemy.id).push(map.name);
      });
    });
    return index;
  }, [maps]);
  const sortedEnemies = useMemo(() => {
    const base = [...filteredEnemies];
    if (sortBy === 'name-asc') return base.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sortBy === 'name-desc') return base.sort((a, b) => String(b.name).localeCompare(String(a.name)));
    if (sortBy === 'level-asc') return base.sort((a, b) => Number(a.base_level ?? a.level ?? 0) - Number(b.base_level ?? b.level ?? 0));
    if (sortBy === 'level-desc') return base.sort((a, b) => Number(b.base_level ?? b.level ?? 0) - Number(a.base_level ?? a.level ?? 0));
    return base;
  }, [filteredEnemies, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sortedEnemies.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const currentPageItems = sortedEnemies.slice(startIndex, startIndex + pageSize);
  useEffect(() => {
    const idsToLoad = currentPageItems
      .map((enemy) => enemy.id)
      .filter((id) => dropsByEnemyId[id] === undefined);
    if (idsToLoad.length === 0) return;
    let active = true;
    Promise.all(idsToLoad.map(async (id) => [id, await fetchEnemyDrops(id)]))
      .then((entries) => {
        if (!active) return;
        setDropsByEnemyId((prev) => {
          const next = { ...prev };
          entries.forEach(([id, drops]) => {
            next[id] = drops;
          });
          return next;
        });
      });
    return () => {
      active = false;
    };
  }, [currentPageItems, dropsByEnemyId]);
  const allPageSelected = currentPageItems.length > 0 && currentPageItems.every((enemy) => selectedEnemyIds.includes(enemy.id));
  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedEnemyIds((prev) => prev.filter((id) => !currentPageItems.some((enemy) => enemy.id === id)));
    } else {
      const pageIds = currentPageItems.map((enemy) => enemy.id);
      setSelectedEnemyIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };
  const selectFiltered = () => {
    const ids = sortedEnemies.map((enemy) => enemy.id);
    setSelectedEnemyIds(Array.from(new Set([...selectedEnemyIds, ...ids])));
  };
  const handleModalConfirm = async () => {
    const action = modalOnConfirm;
    setModalOpen(false);
    if (action) {
      await action();
    }
  };
  const FilterSelect = ({ value, onValueChange, placeholder, options, searchPlaceholder }) => {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((option) => option.label.toLowerCase().includes(q));
    }, [options, query]);
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                placeholder={searchPlaceholder || 'Filtrar...'}
                className="h-9 pl-9"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          ) : (
            <div className="px-3 pb-2 text-xs text-muted-foreground">Nenhum resultado</div>
          )}
        </SelectContent>
      </Select>
    );
  };
  const ItemSelect = ({ value, onValueChange, placeholder }) => {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return items;
      return items.filter((item) => item.name.toLowerCase().includes(q));
    }, [items, query]);
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                placeholder="Buscar item..."
                className="h-9 pl-9"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                <div className="flex items-center gap-2">
                  {item.icon && (
                    <img 
                      src={item.icon.startsWith('http') ? item.icon : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${item.icon}`} 
                      alt="" 
                      className="w-4 h-4 object-contain"
                      onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                    />
                  )}
                  {item.name}
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="px-3 pb-2 text-xs text-muted-foreground">Nenhum resultado</div>
          )}
        </SelectContent>
      </Select>
    );
  };
  const itemIndex = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const previewUrl = spritePreview || (editingEnemy?.sprite_path ? (editingEnemy.sprite_path.startsWith('http') ? editingEnemy.sprite_path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${editingEnemy.sprite_path}`) : '');
  const typeOptions = [
    { value: 'Vacina', label: 'Vacina' },
    { value: 'Vírus', label: 'Vírus' },
    { value: 'Data', label: 'Data' },
    { value: 'Unknown', label: 'Unknown' }
  ];
  const difficultyOptions = [
    { value: 'Normal', label: 'Normal' },
    { value: 'Boss', label: 'Boss' }
  ];
  const stageOptions = [
    { value: 'Rookie', label: 'Rookie' },
    { value: 'Champion', label: 'Champion' },
    { value: 'Ultimate', label: 'Ultimate' },
    { value: 'Mega', label: 'Mega' },
    { value: 'Burst Mode', label: 'Burst Mode' }
  ];
  const bulkTypeOptions = [{ value: 'keep', label: 'Sem alteração' }, ...typeOptions];
  const bulkDifficultyOptions = [{ value: 'keep', label: 'Sem alteração' }, ...difficultyOptions];
  const levelOptions = [
    { value: '1', label: 'Rookie' },
    { value: '2', label: 'Champion' },
    { value: '3', label: 'Ultimate' },
    { value: '4', label: 'Mega' },
    { value: '5', label: 'Burst Mode' }
  ];
  const renderDropsCell = (enemyId, dropsList) => {
    if (!dropsList || dropsList.length === 0) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    const expanded = expandedDropsByEnemyId[enemyId];
    const visible = expanded ? dropsList : dropsList.slice(0, 4);
    const isMeaningful = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'number' && value === 0) return false;
      const text = String(value).trim();
      if (!text) return false;
      if (text === '0') return false;
      if (text.toLowerCase() === 'none') return false;
      return true;
    };
    return (
      <div className="flex items-center gap-1">
        {visible.map((drop) => {
          const itemData = itemIndex.get(Number(drop.item_id));
          const itemName = itemData?.name || drop.item_name || `Item ${drop.item_id}`;
          const recoveryDisplay = itemData?.effect_target === 'hp'
            ? (itemData?.recovery_type === 'max'
              ? 'HP Máximo (permanente)'
              : itemData?.recovery_type === 'current'
                ? 'HP Atual (batalha)'
                : itemData?.recovery_type)
            : null;
          const detailRows = [
            { label: 'Tipo', value: itemData?.type },
            { label: 'Alvo', value: itemData?.effect_target },
            { label: 'Valor', value: itemData?.effect_value, isPercent: itemData?.is_percent },
            { label: 'Recuperação', value: recoveryDisplay }
          ].filter((row) => isMeaningful(row.value));
          return (
            <HoverCard key={`${drop.item_id}-${drop.drop_rate}`}>
              <HoverCardTrigger asChild>
                <div className="h-7 w-7 rounded-md border bg-muted/30 flex items-center justify-center">
                  {drop.item_icon ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${drop.item_icon}`}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">?</span>
                  )}
                </div>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md border bg-muted/40 flex items-center justify-center">
                      {drop.item_icon ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${drop.item_icon}`}
                          alt=""
                          className="h-7 w-7 object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">?</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{itemName}</div>
                      <div className="text-xs text-muted-foreground">ID {drop.item_id}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border bg-muted/30 px-2 py-1">
                      <div className="text-[10px] text-muted-foreground">Drop Rate</div>
                      <div className="font-medium">{Number(drop.drop_rate)}%</div>
                    </div>
                    {detailRows.map((row) => (
                      <div key={row.label} className="rounded-md border bg-muted/30 px-2 py-1">
                        <div className="text-[10px] text-muted-foreground">{row.label}</div>
                        <div className="font-medium">
                          {row.value}{row.isPercent ? '%' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isMeaningful(itemData?.description) && (
                    <div className="rounded-md border bg-muted/30 px-2 py-2 text-xs">
                      <div className="text-[10px] text-muted-foreground">Descrição</div>
                      <div className="text-xs">{itemData?.description}</div>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
        {dropsList.length > 4 && !expanded && (
          <button
            type="button"
            onClick={() => setExpandedDropsByEnemyId((prev) => ({ ...prev, [enemyId]: true }))}
          >
            <Badge variant="secondary" className="text-[10px]">+{dropsList.length - 4}</Badge>
          </button>
        )}
      </div>
    );
  };
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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEnemy ? 'Editar Inimigo' : 'Adicionar Novo Inimigo'}</DialogTitle>
                <DialogDescription>Preencha os dados do Inimigo abaixo.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs value={formTab} onValueChange={setFormTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dados">Dados</TabsTrigger>
                    <TabsTrigger value="drops">Drops</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dados" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                      <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">Identidade</div>
                            <Button type="button" variant="outline" size="sm" onClick={() => generateStats(baseLevel, difficulty)} disabled={!baseLevel}>
                              Gerar status
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="name">Nome</Label>
                              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="type">Tipo</Label>
                              <FilterSelect
                                value={type}
                                onValueChange={setType}
                                placeholder="Selecione o tipo"
                                searchPlaceholder="Filtrar tipo"
                                options={typeOptions}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="difficulty">Dificuldade</Label>
                              <FilterSelect
                                value={difficulty}
                                onValueChange={(val) => { setDifficulty(val); if (stage) generateStats(stage, val); }}
                                placeholder="Selecione a dificuldade"
                                searchPlaceholder="Filtrar dificuldade"
                                options={difficultyOptions}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="stage">Estágio</Label>
                              <FilterSelect
                                value={stage}
                                onValueChange={handleStageChange}
                                placeholder="Selecione o estágio"
                                searchPlaceholder="Filtrar estágio"
                                options={stageOptions}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                          <div className="text-sm font-semibold">Status base</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="hp">HP</Label>
                              <Input id="hp" type="number" value={hp} onChange={(e) => setHp(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="atk">Ataque</Label>
                              <Input id="atk" type="number" value={atk} onChange={(e) => setAtk(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="def">Defesa</Label>
                              <Input id="def" type="number" value={def} onChange={(e) => setDef(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="atkSpeed">Vel. Ataque (segundos)</Label>
                              <Input id="atkSpeed" type="number" step="0.1" value={atkSpeed} onChange={(e) => setAtkSpeed(e.target.value)} required />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                          <div className="text-sm font-semibold">Recompensas</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expReward">EXP</Label>
                              <Input id="expReward" type="number" value={expReward} onChange={(e) => setExpReward(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bitsReward">Bits</Label>
                              <Input id="bitsReward" type="number" value={bitsReward} onChange={(e) => setBitsReward(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                          <div className="text-sm font-semibold">Preview</div>
                          <div className="h-40 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                              <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem imagem</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sprite">Imagem (Sprite)</Label>
                            <Input id="sprite" type="file" onChange={(e) => setFile(e.target.files[0])} />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs uppercase">{type}</Badge>
                            <Badge variant="secondary" className="text-xs">{difficulty}</Badge>
                            {stage && <Badge variant="outline" className="text-xs">{stage}</Badge>}
                          </div>
                        </div>
                        <div className="rounded-lg border bg-muted/10 p-4 space-y-2">
                          <div className="text-sm font-semibold">Resumo rápido</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">HP</span>
                              <span className="font-semibold">{hp || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">ATK</span>
                              <span className="font-semibold">{atk || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">DEF</span>
                              <span className="font-semibold">{def || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">Vel</span>
                              <span className="font-semibold">{atkSpeed || '2.0'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">EXP</span>
                              <span className="font-semibold">{expReward || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                              <span className="text-muted-foreground">Bits</span>
                              <span className="font-semibold">{bitsReward || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="drops" className="space-y-4">
                    <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">Tabela de drops</div>
                          <div className="text-xs text-muted-foreground">Defina itens e taxa de drop.</div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addDrop}>
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Drop
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {drops.length === 0 && (
                          <div className="text-xs text-muted-foreground">Nenhum drop adicionado.</div>
                        )}
                        {drops.map((drop, index) => (
                          <div key={index} className="grid grid-cols-[1fr_110px_40px] gap-2 items-center">
                            <ItemSelect
                              value={drop.item_id ? String(drop.item_id) : ''}
                              onValueChange={(val) => updateDrop(index, 'item_id', val)}
                              placeholder="Selecione o item"
                            />
                            <Input
                              type="number"
                              placeholder="Rate %"
                              value={drop.drop_rate}
                              onChange={(e) => updateDrop(index, 'drop_rate', e.target.value)}
                              className="w-full"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDrop(index)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {drops.length > 0 && (
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDrops([])}>
                            Limpar drops
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Total de inimigos</div>
              <div className="text-2xl font-semibold">{enemies.length}</div>
            </div>
            <Badge variant="secondary">Base</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Filtrados</div>
              <div className="text-2xl font-semibold">{sortedEnemies.length}</div>
            </div>
            <Badge variant="outline">Filtro</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Selecionados</div>
              <div className="text-2xl font-semibold">{selectedEnemyIds.length}</div>
            </div>
            <Badge variant="outline">Lote</Badge>
          </CardContent>
        </Card>
      </div>
      <Card className="border-muted">
        <details className="group">
          <summary className="list-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Operações em lote</CardTitle>
                  <Badge variant={selectedEnemyIds.length ? 'secondary' : 'outline'} className="text-xs">
                    {selectedEnemyIds.length} selecionados
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{bulkTab === 'stats' ? 'Atributos' : 'Drops'}</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </div>
              </div>
            </CardHeader>
          </summary>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Aplique ajustes nos selecionados sem sair da lista.
            </div>
            <Tabs value={bulkTab} onValueChange={setBulkTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats">Atributos</TabsTrigger>
                <TabsTrigger value="drops">Drops</TabsTrigger>
              </TabsList>
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                  <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                    <div className="text-sm font-semibold">Atributos principais</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <FilterSelect
                          value={bulkType}
                          onValueChange={setBulkType}
                          placeholder="Sem alteração"
                          searchPlaceholder="Filtrar tipo"
                          options={bulkTypeOptions}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dificuldade</Label>
                        <FilterSelect
                          value={bulkDifficulty}
                          onValueChange={setBulkDifficulty}
                          placeholder="Sem alteração"
                          searchPlaceholder="Filtrar dificuldade"
                          options={bulkDifficultyOptions}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HP</Label>
                        <Input type="number" value={bulkHp} onChange={(e) => setBulkHp(e.target.value)} placeholder="Sem alteração" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ataque</Label>
                        <Input type="number" value={bulkAtk} onChange={(e) => setBulkAtk(e.target.value)} placeholder="Sem alteração" />
                      </div>
                      <div className="space-y-2">
                        <Label>Defesa</Label>
                        <Input type="number" value={bulkDef} onChange={(e) => setBulkDef(e.target.value)} placeholder="Sem alteração" />
                      </div>
                      <div className="space-y-2">
                        <Label>Vel. Ataque</Label>
                        <Input type="number" step="0.1" value={bulkAtkSpeed} onChange={(e) => setBulkAtkSpeed(e.target.value)} placeholder="Sem alteração" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                    <div className="text-sm font-semibold">Recompensas</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>EXP</Label>
                        <Input type="number" value={bulkExpReward} onChange={(e) => setBulkExpReward(e.target.value)} placeholder="Sem alteração" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bits</Label>
                        <Input type="number" value={bulkBitsReward} onChange={(e) => setBulkBitsReward(e.target.value)} placeholder="Sem alteração" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={applyBulkUpdate} disabled={bulkSaving}>
                    {bulkSaving ? 'Aplicando...' : 'Aplicar alterações'}
                  </Button>
                  <Button variant="outline" onClick={duplicateSelected}>
                    <Copy className="mr-2 h-4 w-4" /> Duplicar selecionados
                  </Button>
                  <Button variant="destructive" onClick={bulkDelete}>
                    Excluir selecionados
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="drops" className="space-y-4">
                <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Drops em lote</div>
                      <div className="text-xs text-muted-foreground">Substitua ou limpe os drops dos selecionados.</div>
                    </div>
                    <Select value={bulkDropsMode} onValueChange={setBulkDropsMode}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Substituir drops</SelectItem>
                        <SelectItem value="clear">Limpar drops</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bulkDropsMode === 'replace' ? (
                    <div className="space-y-2">
                      {bulkDrops.length === 0 && (
                        <div className="text-xs text-muted-foreground">Nenhum drop adicionado.</div>
                      )}
                      {bulkDrops.map((drop, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_110px_40px] gap-2 items-center">
                          <ItemSelect
                            value={drop.item_id ? String(drop.item_id) : ''}
                            onValueChange={(val) => updateBulkDrop(index, 'item_id', val)}
                            placeholder="Selecione o item"
                          />
                          <Input
                            type="number"
                            placeholder="Rate %"
                            value={drop.drop_rate}
                            onChange={(e) => updateBulkDrop(index, 'drop_rate', e.target.value)}
                            className="w-full"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeBulkDrop(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addBulkDrop}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Drop
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Todos os drops serão removidos.</div>
                  )}
                </div>
                <Button onClick={applyBulkDrops} disabled={bulkDropsSaving}>
                  {bulkDropsSaving ? 'Aplicando...' : 'Aplicar drops em selecionados'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </details>
      </Card>
      <Card className="border-muted">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
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
            <Select value={mapFilter} onValueChange={setMapFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Mapa" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Mapas</SelectItem>
                <SelectItem value="Sem mapa">Sem Mapa</SelectItem>
                {maps.map((map) => (
                  <SelectItem key={map.id} value={String(map.id)}>{map.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="level-asc">Nível (↑)</SelectItem>
                <SelectItem value="level-desc">Nível (↓)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Mostrando {currentPageItems.length} de {sortedEnemies.length} inimigos
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAllPage}>
                {allPageSelected ? 'Desmarcar página' : 'Selecionar página'}
              </Button>
              <Button variant="outline" size="sm" onClick={selectFiltered}>
                Selecionar filtrados
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Limpar seleção
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[40px_2.4fr_1fr_1fr_0.8fr_1.4fr_1.6fr_140px] gap-2 bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
          <div className="flex items-center justify-center">
            <Checkbox checked={allPageSelected} onCheckedChange={toggleSelectAllPage} />
          </div>
          <div>Inimigo</div>
          <div>Tipo</div>
          <div>Dificuldade</div>
          <div>Estágio</div>
          <div>Drops</div>
          <div>Mapas</div>
          <div className="text-right">Ações</div>
        </div>
        {currentPageItems.map((enemy) => {
          const mapNames = mapIndex.get(enemy.id) || [];
          const diffLabel = String(enemy.difficulty).toLowerCase() === 'boss' || enemy.difficulty === 1 ? 'Boss' : 'Normal';
          const dropsList = dropsByEnemyId[enemy.id];
          return (
            <div key={enemy.id} className="grid grid-cols-[40px_2.4fr_1fr_1fr_0.8fr_1.4fr_1.6fr_140px] gap-2 px-3 py-2 border-t items-center text-sm">
              <div className="flex items-center justify-center">
                <Checkbox checked={selectedEnemyIds.includes(enemy.id)} onCheckedChange={() => toggleEnemySelection(enemy.id)} />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
                  {enemy.sprite_path ? (
                    <img
                      src={enemy.sprite_path.startsWith('http') ? enemy.sprite_path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${enemy.sprite_path}`}
                      alt={enemy.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Sem img</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium leading-tight">{enemy.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {enemy.stage ?? 'Rookie'}
                  </span>
                </div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs uppercase">{enemy.type}</Badge>
              </div>
              <div>
                <Badge variant="secondary" className="text-xs">{diffLabel}</Badge>
              </div>
              <div className="text-xs font-medium">{enemy.stage ?? '-'}</div>
              <div className="text-xs">{renderDropsCell(enemy.id, dropsList)}</div>
              <div className="flex flex-wrap gap-1">
                {mapNames.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {mapNames.slice(0, 2).map((name) => (
                  <Badge key={name} variant="outline" className="text-[10px]">{name}</Badge>
                ))}
                {mapNames.length > 2 && (
                  <Badge variant="secondary" className="text-[10px]">+{mapNames.length - 2}</Badge>
                )}
              </div>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(enemy)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(enemy)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(enemy.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {currentPageItems.map((enemy) => {
          const diffLabel = String(enemy.difficulty).toLowerCase() === 'boss' || enemy.difficulty === 1 ? 'Boss' : 'Normal';
          const mapNames = mapIndex.get(enemy.id) || [];
          const dropsList = dropsByEnemyId[enemy.id];
          return (
            <Card key={enemy.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
                      {enemy.sprite_path ? (
                        <img
                          src={enemy.sprite_path.startsWith('http') ? enemy.sprite_path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${enemy.sprite_path}`}
                          alt={enemy.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem img</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{enemy.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {enemy.stage ?? 'Rookie'}
                      </div>
                    </div>
                  </div>
                  <Checkbox checked={selectedEnemyIds.includes(enemy.id)} onCheckedChange={() => toggleEnemySelection(enemy.id)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs uppercase">{enemy.type}</Badge>
                  <Badge variant="secondary" className="text-xs">{diffLabel}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Drops</span>
                  <div>{renderDropsCell(enemy.id, dropsList)}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mapNames.length === 0 && <span className="text-xs text-muted-foreground">Sem mapa</span>}
                  {mapNames.slice(0, 2).map((name) => (
                    <Badge key={name} variant="outline" className="text-[10px]">{name}</Badge>
                  ))}
                  {mapNames.length > 2 && (
                    <Badge variant="secondary" className="text-[10px]">+{mapNames.length - 2}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(enemy)}>
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicate(enemy)}>
                    Duplicar
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(enemy.id)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {modalShowCancel && (
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                {modalCancelLabel}
              </Button>
            )}
            <Button onClick={handleModalConfirm}>{modalConfirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
