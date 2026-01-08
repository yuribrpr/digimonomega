import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Lock } from 'lucide-react';

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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      
      {/* Minimal Header */}
      <div className="z-10 mb-8 text-center animate-in fade-in zoom-in duration-700">
        <h1 className="text-3xl font-bold tracking-tighter">
          DIGIMON OMEGA
        </h1>
        <p className="mt-2 text-muted-foreground text-sm tracking-wide uppercase">Acesso ao Sistema</p>
      </div>

      <Card className="z-10 w-full max-w-sm border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-xl text-center">Bem-vindo</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais
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
                    className="pl-9 bg-secondary/50 border-border focus:bg-background transition-colors"
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
                    className="pl-9 bg-secondary/50 border-border focus:bg-background transition-colors"
                    placeholder="••••••••"
                  />
              </div>
            </div>
            
            {error && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs text-center border border-destructive/20">
                    {error}
                </div>
            )}

            <Button className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 border-t border-border/40 pt-6 pb-6">
            <Link to="/register" className="w-full">
                <Button variant="outline" className="w-full text-muted-foreground hover:text-foreground">
                    Criar Conta
                </Button>
            </Link>
        </CardFooter>
      </Card>
      
      <div className="z-10 mt-8 text-[10px] text-muted-foreground uppercase tracking-widest">
        v1.3.2 Alpha
      </div>
    </div>
  );
}
