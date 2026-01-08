import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha no cadastro');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>Crie uma nova conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid w-full items-center gap-4">
               <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input id="username" placeholder="Seu usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Seu email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button className="w-full mt-4" type="submit">Cadastrar</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
             <p className="text-sm text-muted-foreground">Já tem uma conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
