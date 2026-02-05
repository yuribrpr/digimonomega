import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '../services/api';
import { io } from 'socket.io-client';
import { 
  Pencil, 
  Trash2, 
  Search, 
  User,
  Backpack,
  Zap,
  Users,
  Shield,
  Clock,
  RefreshCcw,
  Eye
} from 'lucide-react';
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const SOCKET_URL = API_URL;
  const navigate = useNavigate();
  const sessionUser = JSON.parse(localStorage.getItem('user') || 'null');
  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [digimonOpen, setDigimonOpen] = useState(false);
  // Form states
  const [editForm, setEditForm] = useState({ username: '', email: '', level: 1, bits: 0, role: 'user' });
  const [itemForm, setItemForm] = useState({ itemId: '', quantity: 1 });
  const [digimonForm, setDigimonForm] = useState({ digidexId: '', level: 1, nickname: '' });
  // Data for selects
  const [items, setItems] = useState([]);
  const [digidex, setDigidex] = useState([]);
  const [userDigimons, setUserDigimons] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('recent');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchItems();
    fetchDigidex();
  }, []);
  useEffect(() => {
    if (!sessionUser?.id || !SOCKET_URL) return;
    const socket = io(SOCKET_URL);
    socket.on('connect', () => {
      socket.emit('join_user_room', sessionUser.id);
    });
    socket.on('online_users_update', (usersOnline) => {
      setOnlineUsers(new Set(usersOnline));
    });
    return () => socket.close();
  }, [sessionUser?.id, SOCKET_URL]);
  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/admin/all');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchRoles = async () => {
    try {
        const res = await api.get('/api/roles', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRoles(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchItems = async () => {
    try {
        const res = await api.get('/api/items');
        setItems(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchDigidex = async () => {
    try {
        const res = await api.get('/api/digimons');
        setDigidex(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchUserDigimons = async (userId) => {
      try {
          const res = await api.get(`/api/users/${userId}/digimons`);
          setUserDigimons(res.data);
      } catch (e) { console.error(e); }
  };
  const handleEdit = (user) => {
      setCurrentUser(user);
      setEditForm({ 
          username: user.username, 
          email: user.email, 
          level: user.level || 1, 
          bits: user.bits || 0, 
          role: user.role || 'user' 
      });
      setEditOpen(true);
  };
  const handleUpdateUser = async () => {
      try {
          await api.put(`/api/users/admin/${currentUser.id}`, editForm);
          setEditOpen(false);
          fetchUsers();
      } catch (e) { console.error(e); alert('Erro ao atualizar'); }
  };
  const handleDeleteUser = async (user) => {
      if (!confirm(`Tem certeza que deseja excluir o usuário ${user.username}? Isso é irreversível.`)) return;
      try {
          await api.delete(`/api/users/admin/${user.id}`);
          fetchUsers();
      } catch (e) { console.error(e); alert('Erro ao excluir'); }
  };
  const handleGiveItem = async () => {
      try {
          await api.post('/api/users/admin/give-item', {
              userId: currentUser.id,
              ...itemForm
          });
          setInventoryOpen(false);
          alert('Item enviado!');
      } catch (e) { console.error(e); alert('Erro ao enviar item'); }
  };
  const handleGiveDigimon = async () => {
      try {
          await api.post('/api/users/admin/give-digimon', {
              userId: currentUser.id,
              ...digimonForm
          });
          fetchUserDigimons(currentUser.id); // Refresh list
          alert('Digimon enviado!');
      } catch (e) { console.error(e); alert('Erro ao enviar digimon'); }
  };
  const handleRemoveDigimon = async (digimonId) => {
      if(!confirm('Remover este digimon do usuário?')) return;
      try {
          await api.delete(`/api/users/admin/digimon/${digimonId}`);
          fetchUserDigimons(currentUser.id);
      } catch (e) { console.error(e); alert('Erro ao remover digimon'); }
  };
  const openDigimonDialog = (user) => {
      setCurrentUser(user);
      fetchUserDigimons(user.id);
      setDigimonOpen(true);
  };
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    const isOnline = onlineUsers.has(u.id);
    const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'online' ? isOnline : !isOnline);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const getCreatedAt = (u) => u.created_at ? new Date(u.created_at).getTime() : 0;
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortKey === 'level') return (b.level || 0) - (a.level || 0);
    if (sortKey === 'bits') return (b.bits || 0) - (a.bits || 0);
    return getCreatedAt(b) - getCreatedAt(a);
  });
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const onlineCount = onlineUsers.size;
  const recentSince = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  })();
  const newUsers = users.filter(u => u.created_at && new Date(u.created_at) >= recentSince).length;
  const getLastSeenLabel = (user) => {
    if (onlineUsers.has(user.id)) return 'Online agora';
    if (!user.last_seen_at) return '—';
    return new Date(user.last_seen_at).toLocaleString();
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-sm text-muted-foreground">Visão geral, controle de contas e ações administrativas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => navigate('/admin/roles')} variant="outline">
            Gerenciar Permissões
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total de usuários</div>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Administradores</div>
              <div className="text-2xl font-bold">{adminUsers}</div>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Online agora</div>
              <div className="text-2xl font-bold">{onlineCount}</div>
            </div>
            <Users className="h-5 w-5 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Novos (7 dias)</div>
              <div className="text-2xl font-bold">{newUsers}</div>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar usuário..." 
                className="pl-8" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="level">Maior nível</SelectItem>
                <SelectItem value="bits">Mais bits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:block border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[260px_1.4fr_0.6fr_0.8fr_0.6fr_1fr_180px] gap-2 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide">
          <div>Usuário</div>
          <div>Email</div>
          <div>Nível</div>
          <div>Bits</div>
          <div>Role</div>
          <div>Visto por último</div>
          <div className="text-right">Ações</div>
        </div>
        {sortedUsers.map(user => (
          <div key={user.id} className="grid grid-cols-[260px_1.4fr_0.6fr_0.8fr_0.6fr_1fr_180px] gap-2 border-t px-4 py-3 items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold flex items-center gap-2">
                  <span className="truncate">{user.username}</span>
                  <Badge variant="outline">Lvl {user.level || 1}</Badge>
                  {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">ID {user.id}</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            <div className="text-sm font-medium">Lv {user.level || 1}</div>
            <div className="text-sm font-mono">{Number(user.bits || 0).toLocaleString()}</div>
            <div>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {onlineUsers.has(user.id) ? (
                <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Online agora</Badge>
              ) : (
                <span>{getLastSeenLabel(user)}</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${user.id}`)} title="Ver perfil">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} title="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setCurrentUser(user); setInventoryOpen(true); }} title="Enviar Item">
                <Backpack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openDigimonDialog(user)} title="Gerenciar Digimons">
                <Zap className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user)} title="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:hidden">
        {sortedUsers.map(user => (
          <Card key={user.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-2">
                    <span className="truncate">{user.username}</span>
                    <Badge variant="outline">Lvl {user.level || 1}</Badge>
                    {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                  <div className="text-xs text-muted-foreground">ID {user.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${user.id}`)} title="Ver perfil">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Bits</span>
                <span className="font-mono">{Number(user.bits || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Role</span>
                <Badge variant="outline">{user.role}</Badge>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Visto por último</span>
                {onlineUsers.has(user.id) ? (
                  <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Online agora</Badge>
                ) : (
                  <span>{getLastSeenLabel(user)}</span>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCurrentUser(user); setInventoryOpen(true); }}>
                <Backpack className="h-4 w-4 mr-2" />
                Enviar Item
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDigimonDialog(user)}>
                <Zap className="h-4 w-4 mr-2" />
                Digimons
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteUser(user)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Username</Label>
                    <Input className="col-span-3" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Email</Label>
                    <Input className="col-span-3" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Nível</Label>
                    <Input type="number" className="col-span-3" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Bits</Label>
                    <Input type="number" className="col-span-3" value={editForm.bits} onChange={e => setEditForm({...editForm, bits: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Role</Label>
                    <Select value={editForm.role} onValueChange={v => setEditForm({...editForm, role: v})}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleUpdateUser}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Give Item Dialog */}
      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enviar Item para {currentUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Item</Label>
                    <Select onValueChange={v => setItemForm({...itemForm, itemId: v})}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione um item" /></SelectTrigger>
                        <SelectContent>
                            {items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Quantidade</Label>
                    <Input type="number" className="col-span-3" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleGiveItem}>Enviar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
       {/* Digimon Manager Dialog */}
      <Dialog open={digimonOpen} onOpenChange={setDigimonOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Digimons de {currentUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {/* Give Digimon Form */}
                <div className="border p-4 rounded-md bg-secondary/20 space-y-4">
                    <h4 className="font-bold text-sm">Enviar Novo Digimon</h4>
                    <div className="flex gap-2">
                         <Select onValueChange={v => setDigimonForm({...digimonForm, digidexId: v})}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Digimon" /></SelectTrigger>
                            <SelectContent>
                                {digidex.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Nível" type="number" className="w-20" value={digimonForm.level} onChange={e => setDigimonForm({...digimonForm, level: e.target.value})} />
                        <Input placeholder="Apelido (opcional)" className="w-40" value={digimonForm.nickname} onChange={e => setDigimonForm({...digimonForm, nickname: e.target.value})} />
                        <Button onClick={handleGiveDigimon} size="sm"><Zap className="mr-2 h-4 w-4" /> Enviar</Button>
                    </div>
                </div>
                {/* List Digimons */}
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {userDigimons.map(ud => (
                        <div key={ud.user_digimon_id} className="flex justify-between items-center p-2 border rounded bg-background">
                            <div className="flex items-center gap-2">
                                <img src={`${API_URL}/${ud.sprite_path}`} className="h-8 w-8 object-contain" />
                                <div>
                                    <div className="font-bold text-sm">{ud.nickname || ud.species_name}</div>
                                    <div className="text-xs text-muted-foreground">Lvl {ud.level} • {ud.species_name}</div>
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveDigimon(ud.user_digimon_id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
