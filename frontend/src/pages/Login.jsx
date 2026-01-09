import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Lock, ArrowRight } from 'lucide-react';
import NewsList from '@/components/NewsList';
import api from '../services/api';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Left Section: Landing & News */}
      <div className="hidden lg:flex flex-1 flex-col p-10 relative border-r border-border/40">
        <div className="z-10 flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tighter mb-2 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                  DIGIMON OMEGA
                </h1>
                <p className="text-muted-foreground text-lg">Sua jornada digital começa aqui.</p>
            </div>
            {/* News Feed */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        Últimas Atualizações
                    </h2>
                    <div className="h-[1px] flex-1 bg-border/50 ml-4"></div>
                </div>
                {/* News Container */}
                <div className="flex-1 pr-2">
                    <NewsList limit={5} showHeader={false} compact={true} className="bg-transparent" />
                </div>
            </div>
            {/* Footer Text */}
            <div className="mt-8 text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Digimon Omega. Todos os direitos reservados.
            </div>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>
      {/* Right Section: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
        <div className="w-full max-w-sm space-y-6 relative z-10">
            {/* Mobile Header (Visible only on small screens) */}
            <div className="lg:hidden text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tighter">DIGIMON OMEGA</h1>
                <p className="text-sm text-muted-foreground">Acesso ao Sistema</p>
            </div>
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Bem-vindo de volta</CardTitle>
                <CardDescription className="text-center">
                    Entre com suas credenciais para acessar
                </CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="username" 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className="pl-9"
                            placeholder="Seu usuário..."
                        />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="pl-9"
                            placeholder="••••••••"
                        />
                    </div>
                    </div>
                    {error && (
                        <div className="p-3 rounded bg-destructive/10 text-destructive text-sm text-center border border-destructive/20 flex items-center justify-center gap-2">
                            <span>{error}</span>
                        </div>
                    )}
                    <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
                    </Button>
                </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-muted/20">
                    <p className="text-xs text-center text-muted-foreground">
                        Não tem uma conta?
                    </p>
                    <Link to="/register" className="w-full">
                        <Button variant="outline" className="w-full group">
                            Criar nova conta
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
