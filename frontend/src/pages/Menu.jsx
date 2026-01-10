import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Shield
} from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isDarkMode, setIsDarkMode] = React.useState(true);

  React.useEffect(() => {
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

  const isAdmin = user.username === 'clovis' || user.role === 'admin' || (user.permissions && user.permissions.length > 0);

  return (
    <div className="container mx-auto px-4 py-8 pb-24 max-w-md animate-in fade-in slide-in-from-bottom-5">
      <h1 className="text-2xl font-bold mb-6">Menu</h1>
      
      <div className="space-y-4">
        {/* Profile Section */}
        <div 
            className="bg-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-lg">{user.username}</h3>
                <p className="text-sm text-muted-foreground">Ver perfil</p>
            </div>
            <User className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="h-px bg-border my-2" />

        {/* Settings */}
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Configurações</h3>
            
            <Button 
                variant="outline" 
                className="w-full justify-between h-12"
                onClick={() => setIsDarkMode(!isDarkMode)}
            >
                <span className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Tema {isDarkMode ? 'Escuro' : 'Claro'}
                </span>
            </Button>
        </div>

        {/* Admin Section (Mobile) */}
        {isAdmin && (
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">Administração</h3>
                
                <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 gap-3"
                    onClick={() => navigate('/admin/settings')}
                >
                    <Settings className="h-4 w-4" />
                    Painel Administrativo
                </Button>
            </div>
        )}

        <div className="h-px bg-border my-2" />

        <Button 
            variant="destructive" 
            className="w-full h-12 gap-2"
            onClick={handleLogout}
        >
            <LogOut className="h-4 w-4" />
            Sair
        </Button>
      </div>
    </div>
  );
}
