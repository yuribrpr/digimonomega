import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, Plus, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Create Role State
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  // Edit Permissions State
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/roles', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        api.get('/api/roles/permissions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateRole = async () => {
    if (!newRole.name) return;
    try {
      await api.post('/api/roles', newRole, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCreateOpen(false);
      setNewRole({ name: '', description: '' });
      fetchData();
    } catch (error) {
      alert('Erro ao criar role');
    }
  };
  const openEditPermissions = (role) => {
    setSelectedRole(role);
    // Extract permission IDs from the role's permissions array
    const rolePermIds = role.permissions ? role.permissions.map(p => p.id) : [];
    setSelectedPermissions(rolePermIds);
    setEditOpen(true);
  };
  const togglePermission = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };
  const handleSavePermissions = async () => {
    try {
      await api.put(`/api/roles/${selectedRole.id}/permissions`, {
        permissions: selectedPermissions
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditOpen(false);
      fetchData();
      alert('Permissões atualizadas!');
    } catch (error) {
      alert('Erro ao salvar permissões');
    }
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
             </Button>
             <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8" /> Gerenciar Roles e Permissões
            </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Role
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <Card key={role.id} className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {role.name}
                {role.name === 'admin' && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">Sistema</span>}
              </CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Permissões ({role.permissions?.length || 0})</h4>
                <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 5).map(p => (
                        <span key={p.id} className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground">
                            {p.name}
                        </span>
                    ))}
                    {(role.permissions?.length || 0) > 5 && (
                        <span className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground">
                            +{(role.permissions?.length || 0) - 5}
                        </span>
                    )}
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => openEditPermissions(role)}>
                Editar Permissões
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Nova Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Nome (Identificador)</Label>
                    <Input 
                        placeholder="ex: moderator" 
                        value={newRole.name} 
                        onChange={e => setNewRole({...newRole, name: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input 
                        placeholder="Descrição da função" 
                        value={newRole.description} 
                        onChange={e => setNewRole({...newRole, description: e.target.value})} 
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleCreateRole}>Criar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Permissions Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Editar Permissões: {selectedRole?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {permissions.map(perm => (
                    <div key={perm.id} className="flex items-start space-x-2 border p-3 rounded hover:bg-secondary/20 transition-colors">
                        <Checkbox 
                            id={`perm-${perm.id}`} 
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor={`perm-${perm.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                {perm.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                                {perm.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button onClick={handleSavePermissions}>
                    <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
