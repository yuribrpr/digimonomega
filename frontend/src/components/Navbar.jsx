import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-background mb-6">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
        <div className="flex items-center space-x-6">
           <h2 className="text-lg font-bold">Digimon Omega</h2>
           <div className="flex items-center space-x-2">
             <Link to="/"><Button variant="ghost">Navegar</Button></Link>
             {user.username === 'clovis' && (
                <div 
                  className="relative"
                  onMouseEnter={() => setAdminOpen(true)}
                  onMouseLeave={() => setAdminOpen(false)}
               >
                 <Button 
                   variant="ghost" 
                   aria-haspopup="menu" 
                   aria-expanded={adminOpen}
                   onClick={() => setAdminOpen(v => !v)}
                 >
                   Administração
                 </Button>
                 <div 
                   className={`absolute left-0 top-full min-w-[180px] rounded-md border bg-background shadow-md p-1 z-50 ${adminOpen ? 'block' : 'hidden'}`}
                   onMouseEnter={() => setAdminOpen(true)}
                   onMouseLeave={() => setAdminOpen(false)}
                 >
                   <Button
                     variant="ghost"
                     className="w-full justify-start"
                     onClick={() => navigate('/admin/digidex')}
                 >
                   Digidex
                 </Button>
                 <Button
                   variant="ghost"
                   className="w-full justify-start"
                   onClick={() => navigate('/admin/enemydex')}
                 >
                   Enemydex
                 </Button>
                 <Button
                   variant="ghost"
                   className="w-full justify-start"
                   onClick={() => navigate('/admin/items')}
                 >
                   Itens
                 </Button>
                 <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/maps')}
                >
                  Mapas
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/settings')}
                >
                  Configurações
                </Button>
              </div>
             </div>
           )}
           </div>
        </div>
        <div className="flex items-center space-x-4">
           <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
             {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
           </Button>
           <span className="text-sm text-muted-foreground">Olá, {user.username}</span>
           <Button variant="destructive" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </div>
    </nav>
  );
}
