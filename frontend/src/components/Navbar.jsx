import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  User,
  ArrowUpCircle,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ScrollText,
  Menu
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger, 
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import api from '../services/api';
export default function Navbar({ isPlaying, toggleMusic }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Define user-specific nav items including admin ones if applicable
  const getNavItems = () => {
    const items = [
      { icon: MapIcon, label: 'Explorar', path: '/exploration', color: 'text-green-500' },
      { icon: ArrowUpCircle, label: 'Centro de Digievolução', path: '/evolution-center', color: 'text-cyan-500' },
      { icon: Dna, label: 'Digimons', path: '/meus-digimons', color: 'text-blue-500' },
      { icon: ShoppingBag, label: 'Loja de Digimons', path: '/adoption', color: 'text-purple-500' },
      { icon: Coins, label: 'Black Trade', path: '/black-trade', color: 'text-yellow-500' },
      { icon: ScrollText, label: 'Quests', path: '/quests', color: 'text-orange-500' },
      { icon: BookOpen, label: 'Digidex', path: '/digidex', color: 'text-amber-500' },
      { icon: Backpack, label: 'Inventário', path: '/inventory', color: 'text-indigo-500' },
    ];
    return items;
  };

  const navItems = getNavItems();


  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userStats, setUserStats] = useState({
      bits: 0,
      level: 1,
      exp: 0,
      exp_m: 1000,
      profile_image: null
  });
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
          const res = await api.get(`/api/users/search?q=${searchQuery}`);
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
  const fetchUserStats = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/users/${user.id}`);
      if (res.data) {
        setUserStats({
            bits: res.data.bits || 0,
            level: res.data.level || 1,
            exp: res.data.exp || 0,
            exp_m: res.data.exp_m || 1000,
            profile_image: res.data.profile_image
        });
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    }
  };
  
  // URL base para imagens
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  useEffect(() => {
    fetchUserStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUserStats, 30000);
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


  return (
    <>
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6 sticky top-0 z-50">
      <div className="flex h-16 items-center px-6 w-full justify-between">
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
             {(user.username === 'clovis' || user.role === 'admin' || (user.permissions && user.permissions.length > 0)) && (
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
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_users')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/users')}>Usuários</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_news')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/news')}>Notícias</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_digidex')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/digidex')}>Digidex</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_digidex')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/quests')}>Quests</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_enemydex')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/enemydex')}>Enemydex</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_items')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/items')}>Itens</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_maps')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/maps')}>Mapas</Button>
                   )}
                   {(user.username === 'clovis' || user.role === 'admin' || user.permissions?.includes('manage_settings')) && (
                     <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin/settings')}>Configurações</Button>
                   )}
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
                       {result.profile_image ? (
                          <img src={`${API_URL}/${result.profile_image}`} alt={result.username} className="h-8 w-8 rounded-full object-cover" />
                       ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                             <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                       )}
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
              <span className="font-mono text-sm font-bold">{userStats.bits.toLocaleString()}</span>
           </div>
           {toggleMusic && (
             <Button variant="ghost" size="icon" onClick={toggleMusic}>
               {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
             </Button>
           )}
           <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
             {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
           </Button>
           <div className="flex items-center gap-3 pl-2" onClick={() => navigate(`/profile/${user.id}`)}>
             <div className="hidden sm:flex flex-col items-end cursor-pointer group">
                <span className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{user.username}</span>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono font-bold">Lv.{userStats.level}</span>
                    <Progress value={(userStats.exp / userStats.exp_m) * 100} className="w-20 h-1.5" />
                </div>
             </div>
             <Avatar className="h-9 w-9 cursor-pointer border-2 border-border hover:border-primary transition-colors">
                <AvatarImage 
                  src={userStats.profile_image 
                    ? `${API_URL}/${userStats.profile_image}` 
                    : "https://github.com/shadcn.png"
                  } 
                  className="object-cover" 
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
             </Avatar>
           </div>
           <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
             <LogOut className="h-5 w-5 text-destructive" />
           </Button>
        </div>
      </div>
    </nav>
    <MobileNav 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        navItems={navItems} 
        navigate={navigate} 
        location={location}
    />
    </>
  );
}

// MobileNav component extracted to avoid re-creation on every render
const MobileNav = ({ mobileMenuOpen, setMobileMenuOpen, navItems, navigate, location }) => (
    <>
      {/* Mobile Menu Popup */}
      {mobileMenuOpen && (
        <div className="fixed bottom-20 right-4 z-[100] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 min-w-[160px] animate-in fade-in slide-in-from-bottom-5">
           {navItems.slice(4).map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                 <item.icon className={`h-5 w-5 ${item.color}`} />
                 <span className="text-sm font-medium">{item.label}</span>
              </Link>
           ))}
           <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
           <div 
             className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
             onClick={() => {
               setMobileMenuOpen(false);
               navigate('/menu'); // Or open settings
             }}
           >
             <Settings className="h-5 w-5 text-muted-foreground" />
             <span className="text-sm font-medium text-muted-foreground">Configurações</span>
           </div>
        </div>
      )}
      
      {/* Mobile Menu Overlay for closing */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 md:hidden pb-safe safe-area-inset-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 4).map((item) => { 
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center w-full h-full py-1" onClick={() => setMobileMenuOpen(false)}>
                 <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10 scale-110' : ''}`}>
                   <item.icon className={`h-6 w-6 ${isActive ? item.color : 'text-slate-400 dark:text-slate-500'}`} />
                 </div>
                 <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-foreground' : 'text-slate-400 dark:text-slate-500'}`}>
                   {item.label.split(' ')[0]} 
                 </span>
              </Link>
            );
          })}
          
          {/* More Button */}
          <div 
              className="flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
               <div className={`p-1.5 rounded-xl transition-all duration-300 ${mobileMenuOpen ? 'bg-primary/10 scale-110' : ''}`}>
                  <MoreHorizontal className={`h-6 w-6 ${mobileMenuOpen ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
               </div>
               <span className={`text-[10px] mt-1 font-medium ${mobileMenuOpen ? 'text-foreground' : 'text-slate-400 dark:text-slate-500'}`}>Mais</span>
          </div>
        </div>
      </div>
    </>
);
