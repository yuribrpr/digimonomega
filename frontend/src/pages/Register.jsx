import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { cn } from "@/lib/utils"
import api from '../services/api';
// Hardcoded starter data for display - Minimal Style
const STARTERS = [
  {
    id: 1,
    name: 'Agumon',
    type: 'Vaccine',
    description: 'Alto potencial de ataque.',
    stats: { hp: 100, atk: 12, def: 8 },
    image: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/assets/sprites/695db86a2548c.gif',
  },
  {
    id: 5,
    name: 'Gaomon',
    type: 'Data',
    description: 'Leal e ágil.',
    stats: { hp: 90, atk: 11, def: 9 },
    image: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/assets/sprites/695dbb1f46cb2.gif',
  },
  {
    id: 13,
    name: 'Lalamon',
    type: 'Data',
    description: 'Suporte equilibrado.',
    stats: { hp: 110, atk: 8, def: 11 },
    image: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/assets/sprites/695dbfae99fad.gif',
  }
];
export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    starterId: null,
    nickname: ''
  });
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {STARTERS.map((digimon) => (
                        <div 
                            key={digimon.id}
                            onClick={() => setFormData({ ...formData, starterId: digimon.id })}
                            className={cn(
                                "cursor-pointer relative p-4 rounded-lg border transition-all duration-300 flex flex-col items-center gap-3 hover:bg-secondary/80",
                                formData.starterId === digimon.id 
                                    ? "border-primary bg-secondary shadow-md scale-105" 
                                    : "border-border bg-card/50 opacity-60 hover:opacity-100"
                            )}
                        >
                            <img src={digimon.image} alt={digimon.name} className="w-16 h-16 object-contain pixelated grayscale-[0.2] hover:grayscale-0 transition-all" />
                            <div className="text-center">
                                <h3 className={cn("font-medium text-sm", formData.starterId === digimon.id ? "text-foreground" : "text-muted-foreground")}>{digimon.name}</h3>
                                <p className="text-[10px] text-muted-foreground mt-1">{digimon.description}</p>
                            </div>
                            {/* Minimal Stats */}
                            <div className="w-full grid grid-cols-3 gap-1 text-center text-[10px] mt-2 border-t border-border pt-2">
                                <div><span className="text-muted-foreground">HP</span> <span className="text-foreground">{digimon.stats.hp}</span></div>
                                <div><span className="text-muted-foreground">ATK</span> <span className="text-foreground">{digimon.stats.atk}</span></div>
                                <div><span className="text-muted-foreground">DEF</span> <span className="text-foreground">{digimon.stats.def}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
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
                        <Button onClick={handleRegister} className="flex-1" disabled={loading}>
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
