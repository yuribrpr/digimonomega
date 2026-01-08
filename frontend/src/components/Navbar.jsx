import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Sun, 
  Map as MapIcon, 
  Dna, 
  Home as HomeIcon, 
  BookOpen, 
  Backpack,
  Coins, 
  ShoppingBag, 
  LogOut,
  Settings,
  Search,
  User
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger, 
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userBits, setUserBits] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 0) {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`);
          setSearchResults(res.data);
          setShowResults(true);
        } catch (error) {
          console.error('Error searching users:', error);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchUserBits = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
      if (res.data) {
        setUserBits(res.data.bits || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar bits:', error);
    }
  };

  useEffect(() => {
    fetchUserBits();
    // Refresh bits every 30 seconds to keep it somewhat updated
    const interval = setInterval(fetchUserBits, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Don't show navbar on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  if (!user) return null;

  const navItems = [
    { icon: MapIcon, label: 'Explorar', path: '/exploration', color: 'text-green-500' },
    { icon: Dna, label: 'Digimons', path: '/meus-digimons', color: 'text-blue-500' },
    { icon: ShoppingBag, label: 'Loja de Digimons', path: '/adoption', color: 'text-purple-500' },
    { icon: BookOpen, label: 'Digidex', path: '/digidex', color: 'text-amber-500' },
    { icon: Backpack, label: 'Inventário', path: '/inventory', color: 'text-indigo-500' },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
        
        {/* Logo & Navigation */}
        <div className="flex items-center space-x-6">
           <Link to="/">
             <Button variant="ghost" className="font-bold text-md flex gap-2">
               <HomeIcon className="h-5 w-5" />
               Início
             </Button>
           </Link>
           
           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center space-x-1">
             <TooltipProvider>
               {navItems.map((item) => {
                 const isActive = location.pathname === item.path;
                 return (
                   <Tooltip key={item.path}>
                     <TooltipTrigger asChild>
                       <Link to={item.path}>
                         <Button 
                           variant={isActive ? "secondary" : "ghost"} 
                           size="icon" 
                           className={`relative ${isActive ? 'bg-secondary' : ''}`}
                         >
                           <item.icon className={`h-5 w-5 ${item.color}`} />
                         </Button>
                       </Link>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>{item.label}</p>
                     </TooltipContent>
                   </Tooltip>
                 );
               })}
             </TooltipProvider>

             {/* Search Bar - Removed from here */}

             {(user.username === 'clovis' || user.role === 'admin') && (
                <div 
                  className="relative ml-2"
                  onMouseEnter={() => setAdminOpen(true)}
                  onMouseLeave={() => setAdminOpen(false)}
               >
                 <Button 
                   variant="ghost" 
                   size="icon"
                   aria-haspopup="menu" 
                   aria-expanded={adminOpen}
                   onClick={() => setAdminOpen(v => !v)}
                 >
                   <Settings className="h-5 w-5" />
                 </Button>
                 <div 
                   className={`absolute left-0 top-full min-w-[180px] rounded-md border bg-background shadow-md p-1 z-50 ${adminOpen ? 'block' : 'hidden'}`}
                   onMouseEnter={() => setAdminOpen(true)}
                   onMouseLeave={() => setAdminOpen(false)}
                 >
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/users')}>Usuários</Button>
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/digidex')}>Digidex</Button>
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/enemydex')}>Enemydex</Button>
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/items')}>Itens</Button>
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/maps')}>Mapas</Button>
                   <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/settings')}>Configurações</Button>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Right Side: Bits, Theme, User */}
        <div className="flex items-center space-x-4">
           
           {/* Search Bar */}
           <div className="relative hidden md:block w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar jogadores..." 
                  className="pl-9 rounded-full bg-secondary/50 border-border/50 focus:bg-background transition-colors" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchResults.map(result => (
                    <div 
                      key={result.id}
                      className="p-3 hover:bg-accent cursor-pointer flex items-center gap-3 transition-colors"
                      onClick={() => {
                        navigate(`/profile/${result.id}`);
                        setSearchQuery('');
                        setShowResults(false);
                      }}
                    >
                       <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">{result.username}</span>
                          <span className="text-[10px] text-muted-foreground">Lvl {result.level || 1}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           {/* Bits Display */}
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/20 rounded-full border border-border/50">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-mono text-sm font-bold">{userBits.toLocaleString()}</span>
           </div>

           <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
             {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
           </Button>
           
           <Button variant="ghost" className="text-sm font-medium text-muted-foreground hidden sm:inline-flex gap-2" onClick={() => navigate(`/profile/${user.id}`)}>
             <User className="h-4 w-4" />
             {user.username}
           </Button>
           
           <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
             <LogOut className="h-5 w-5 text-destructive" />
           </Button>
        </div>
      </div>
    </nav>
  );
}
