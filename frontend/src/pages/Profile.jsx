import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Calendar, Shield, Zap, Heart, Star, Upload, MessageCircle, Swords } from 'lucide-react';
import { Button } from "@/components/ui/button";
import api from '../services/api';
export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const fileInputRef = useRef(null);
  const handleImageClick = () => {
    if (currentUser && profile && currentUser.id === profile.user.id) {
        fileInputRef.current.click();
    }
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { // 1MB limit
        alert("A imagem deve ter no máximo 1MB.");
        return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }
        });
        // Update profile state with new image
        setProfile(prev => ({
            ...prev,
            user: {
                ...prev.user,
                profile_image: res.data.path
            }
        }));
    } catch (error) {
        console.error("Error uploading avatar", error);
        alert("Erro ao fazer upload da imagem.");
    }
  };
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/users/profile/${id}`);
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!profile) return <div className="text-center p-10 text-muted-foreground">Usuário não encontrado</div>;
  const { user, digimons } = profile;
  const isOwner = currentUser && currentUser.id === user.id;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* User Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div 
            className={`h-20 w-20 rounded-full flex items-center justify-center border-2 border-border overflow-hidden relative group ${isOwner ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
            onClick={handleImageClick}
          >
             {user.profile_image ? (
                 <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${user.profile_image}`} alt="Avatar" className="h-full w-full object-cover" />
             ) : (
                 <div className="h-full w-full bg-secondary flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                 </div>
             )}
             {isOwner && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Upload className="h-6 w-6 text-white" />
                 </div>
             )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                  <CardTitle className="text-2xl">{user.username}</CardTitle>
                  <CardDescription>Treinador desde {new Date(user.created_at).toLocaleDateString()}</CardDescription>
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> Nível {user.level || 1}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Entrou em {new Date(user.created_at).toLocaleDateString()}
                </span>
                {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
            </div>
            {/* User EXP Progress */}
            <div className="mt-3 max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span>EXP</span>
                    <span>{user.exp || 0} / {user.exp_m || 1000}</span>
                </div>
                <Progress value={Math.min(100, ((user.exp || 0) / (user.exp_m || 1000)) * 100)} className="h-1.5" />
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Digimons */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Digimons ({digimons.length})
        </h2>
        {digimons.length === 0 ? (
             <div className="text-center p-10 border-2 border-dashed rounded-lg text-muted-foreground">
                 Nenhum Digimon encontrado.
             </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {digimons.map(digi => (
                    <Card key={digi.user_digimon_id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{digi.nickname || digi.species_name}</h3>
                                    <p className="text-xs text-muted-foreground">{digi.species_name}</p>
                                </div>
                                <Badge variant={digi.type === 'virus' ? 'destructive' : digi.type === 'vaccine' ? 'default' : 'secondary'}>
                                    {digi.type}
                                </Badge>
                            </div>
                            <div className="flex justify-center my-4 bg-secondary/20 rounded-lg p-2 h-32 items-center">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${digi.sprite_path}`} 
                                    alt={digi.species_name} 
                                    className="h-24 w-24 object-contain pixelated"
                                    onError={(e) => { e.target.src = '/placeholder-digimon.png' }}
                                />
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nível</span>
                                    <span className="font-bold">{digi.level}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" /> HP</span>
                                    <span>{digi.current_hp}/{digi.max_hp}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Swords className="h-3 w-3" /> ATK</span>
                                    <span>{digi.attack}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> DEF</span>
                                    <span>{digi.defense}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> SPD</span>
                                    <span>{digi.attack_speed || 2.0}s</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
