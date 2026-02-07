import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '../services/api';
import { 
  Pencil, 
  Trash2, 
  Search, 
  User,
  Backpack,
  Zap
} from 'lucide-react';
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const navigate = useNavigate();
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
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchItems();
    fetchDigidex();
  }, []);
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
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/admin/roles')} variant="outline">
                Gerenciar Permissões
            </Button>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar usuário..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>
      <div className="grid gap-4">
        {filteredUsers.map(user => (
            <Card key={user.id} className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="font-bold flex items-center gap-2">
                            {user.username}
                            <Badge variant="outline">Lvl {user.level || 1}</Badge>
                            {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
