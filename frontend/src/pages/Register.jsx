import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { cn } from "@/lib/utils"
import api from '../services/api';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const toStarterImage = (spritePath) => {
  if (!spritePath) return null;
  const clean = String(spritePath).replace(/\\/g, '/');
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `${API_BASE}/${clean.replace(/^\//, '')}`;
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStarters, setLoadingStarters] = useState(false);
  const [starters, setStarters] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    starterId: null,
    nickname: ''
  });

  useEffect(() => {
    const loadStarters = async () => {
      setLoadingStarters(true);
      try {
        const res = await api.get('/api/auth/starters');
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list.map((starter) => ({
          id: Number(starter.id),
          name: starter.name,
          type: starter.type || 'Unknown',
          description: starter.description || 'Parceiro inicial.',
          stats: {
            hp: Number(starter.base_hp || 0),
            atk: Number(starter.base_attack || 0),
            def: Number(starter.base_defense || 0),
          },
          image: toStarterImage(starter.sprite_path)
        }));
        setStarters(mapped);
      } catch (err) {
        console.error('Erro ao carregar starters:', err);
        setError('Não foi possível carregar os Digimons iniciais.');
      } finally {
        setLoadingStarters(false);
      }
    };
    loadStarters();
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
        if (!formData.username || !formData.email || !formData.password) {
            setError('Preencha todos os campos.');
            return;
        }
        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setError('');
        setStep(2);
    }
  };
  const handleBack = () => {
    setStep(1);
    setError('');
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.starterId) {
        setError('Escolha um parceiro.');
        return;
    }
    if (!formData.nickname) {
        setError('Defina um apelido.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        starterId: formData.starterId,
        nickname: formData.nickname
      });
      // Auto-login success
      if (res.data.token && res.data.user) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          // Redirect to Map 1 (Battle/Exploration)
          navigate('/battle?mapId=1');
      } else {
          // Fallback if no token returned (shouldn't happen with new backend)
          navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Falha no cadastro');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Minimal Progress Indicator */}
      <div className="z-10 mb-8 flex items-center gap-2">
        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 1 ? "bg-primary" : "bg-secondary")}></div>
        <div className={cn("h-1.5 w-8 rounded-full transition-all duration-500", step === 2 ? "bg-primary" : "bg-secondary")}></div>
      </div>
      <Card className="z-10 w-full max-w-2xl border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">
            {step === 1 ? 'Criar Conta' : 'Selecione o Parceiro'}
          </CardTitle>
          <CardDescription>
            {step === 1 ? 'Dados iniciais' : 'Escolha com sabedoria'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4 max-w-sm mx-auto py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Treinador</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="username" value={formData.username} onChange={handleChange} className="pl-9 bg-secondary/50 border-border focus:bg-background h-10 transition-colors" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} className="pl-9 bg-secondary/50 border-border focus:bg-background h-10 transition-colors" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" value={formData.password} onChange={handleChange} className="pl-9 bg-secondary/50 border-border focus:bg-background h-10 transition-colors" required />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">Mínimo de 6 caracteres</p>
              </div>
              <Button type="submit" className="w-full mt-6">
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
          {step === 2 && (
            <div className="space-y-8 py-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {starters.map((starter) => (
                      <div
                        key={starter.id}
                        className={`
                          cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-105
                          ${formData.starterId === starter.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50 bg-card'
                          }
                        `}
                        onClick={() => setFormData({ ...formData, starterId: starter.id })}
                      >
                        <div className="aspect-square relative mb-3 bg-muted/20 rounded-lg p-2">
                          {starter.image ? (
                            <img
                              src={starter.image}
                              alt={starter.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                              sem sprite
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-foreground">{starter.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{starter.description}</p>
                          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-muted-foreground bg-muted/50 p-1 rounded">
                            <span>HP:{starter.stats.hp}</span>
                            <span>ATK:{starter.stats.atk}</span>
                            <span>DEF:{starter.stats.def}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {!loadingStarters && starters.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Nenhum Digimon inicial disponível no momento.
                  </div>
                )}
                {loadingStarters && (
                  <div className="text-center text-sm text-muted-foreground">
                    Carregando iniciais...
                  </div>
                )}
                <div className="max-w-sm mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-center block text-xs uppercase tracking-wider text-muted-foreground">Apelido do Parceiro</Label>
                        <Input 
                            id="nickname" 
                            value={formData.nickname} 
                            onChange={handleChange} 
                            placeholder="Nome..." 
                            className="bg-secondary/50 border-border text-center h-10 placeholder:text-muted-foreground/50 focus:bg-background transition-colors" 
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={handleBack} className="flex-1 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <Button onClick={handleRegister} className="flex-1" disabled={loading || loadingStarters || starters.length === 0}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
        {error && (
            <div className="p-2 mx-6 mb-6 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center">
                {error}
            </div>
        )}
        <CardFooter className="flex justify-center border-t border-border/40 pt-6">
             {step === 1 && (
                <p className="text-xs text-muted-foreground">
                    Já possui conta? <Link to="/login" className="text-foreground hover:underline transition-colors">Entrar</Link>
                </p>
             )}
        </CardFooter>
      </Card>
    </div>
  );
}
