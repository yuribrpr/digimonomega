import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import KubelabsLanding from './pages/KubelabsLanding';
import Home from './pages/Home';
import AdminDigidex from './pages/AdminDigidex';
import AdminEnemydex from './pages/AdminEnemydex';
import AdminMaps from './pages/AdminMaps';
import AdminGameSettings from './pages/AdminGameSettings';
import AdminItems from './pages/AdminItems';
import AdminNews from './pages/AdminNews';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminRoles from './pages/admin/AdminRoles';
import AdminQuests from './pages/admin/AdminQuests';
import Digidex from './pages/Digidex';
import Battle from './pages/Battle';
import MeusDigimons from './pages/MeusDigimons';
import Adoption from './pages/Adoption';
import Exploration from './pages/Exploration';
import Inventory from './pages/Inventory';
import Menu from './pages/Menu';
import EvolutionCenter from './pages/EvolutionCenter';
import BlackTrade from './pages/BlackTrade';
import Quests from './pages/Quests';
import Navbar from './components/Navbar';
import ChatWidget from './components/chat/ChatWidget';
import { ChatProvider } from './context/ChatContext';
import PageTitleUpdater from './components/PageTitleUpdater';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const user = JSON.parse(localStorage.getItem('user'));
    const hasPermissions = user?.permissions && user.permissions.length > 0;
    return user && (user.username === 'clovis' || user.role === 'admin' || hasPermissions) ? children : <Navigate to="/" />;
}

function Layout({ children, isPlaying, toggleMusic, audioRef, BGM_URL, isAutoplayBlocked }) {
  const location = useLocation();
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === 'kubelabs.online' || hostname === 'www.kubelabs.online';
  
  // Is Landing if: explicitly on /kubelabs OR on landing domain at root
  const isLanding = location.pathname === '/kubelabs' || (isLandingDomain && location.pathname === '/');

  return (
    <>
      <PageTitleUpdater />
      {!isLanding && <audio ref={audioRef} src={BGM_URL} preload="auto" />}
      {!isLanding && <Navbar isPlaying={isPlaying} toggleMusic={toggleMusic} />}
      
      {!isLanding && isAutoplayBlocked && (
        <div className="fixed bottom-24 right-4 z-50 bg-black/80 text-white p-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-500 border border-yellow-500/50">
           <span className="text-xs">🔇 Autoplay bloqueado</span>
           <button 
               onClick={toggleMusic}
               className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-xs font-bold transition-colors"
           >
               Ativar Som
           </button>
        </div>
      )}

      <div className={!isLanding ? "md:pb-0 pb-20" : ""}>
        {children}
      </div>
      {!isLanding && <ChatWidget />}
    </>
  );
}

function App() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const audioRef = useRef(null);
  
  // Check domain for default routing
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === 'kubelabs.online' || hostname === 'www.kubelabs.online';
  
  // URL substituída por uma de teste confiável (SoundHelix) para evitar erro 403.
  // Você pode substituir por qualquer link direto (ex: arquivo no GitHub, S3, ou local na pasta public)
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) setIsAutoplayBlocked(false);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Volume aumentado para 30%
      audioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (!audioRef.current) return;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
            // Auto-play was prevented
            if (e.name === 'NotAllowedError' || e.name === 'AutoplayError') {
                console.log("Autoplay blocked by browser policy. Music paused.");
                setIsPlaying(false);
                setIsAutoplayBlocked(true);
            } else {
                console.error("Audio play failed:", e);
            }
        });
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <ChatProvider>
      <Router>
        <Layout isPlaying={isPlaying} toggleMusic={toggleMusic} audioRef={audioRef} BGM_URL={BGM_URL} isAutoplayBlocked={isAutoplayBlocked}>
        <Routes>
          <Route path="/kubelabs" element={<KubelabsLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        <Route path="/" element={
            isLandingDomain ? <KubelabsLanding /> : (
            <PrivateRoute>
                <Home />
            </PrivateRoute>
            )
        } />
        <Route path="/profile/:id" element={
            <PrivateRoute>
                <Profile />
            </PrivateRoute>
        } />
        <Route path="/digidex" element={
            <PrivateRoute>
                <Digidex />
            </PrivateRoute>
        } />
        <Route path="/battle" element={
            <PrivateRoute>
                <Battle />
            </PrivateRoute>
        } />
        <Route path="/meus-digimons" element={
            <PrivateRoute>
                <MeusDigimons />
            </PrivateRoute>
        } />
        <Route path="/adoption" element={
            <PrivateRoute>
                <Adoption />
            </PrivateRoute>
        } />
        <Route path="/exploration" element={
            <PrivateRoute>
                <Exploration />
            </PrivateRoute>
        } />
        <Route path="/inventory" element={
            <PrivateRoute>
                <Inventory />
            </PrivateRoute>
        } />
        <Route path="/menu" element={
            <PrivateRoute>
                <Menu />
            </PrivateRoute>
        } />
        <Route path="/evolution-center" element={
            <PrivateRoute>
                <EvolutionCenter />
            </PrivateRoute>
        } />
        <Route path="/black-trade" element={
            <PrivateRoute>
                <BlackTrade />
            </PrivateRoute>
        } />
        <Route path="/quests" element={
            <PrivateRoute>
                <Quests />
            </PrivateRoute>
        } />
        <Route path="/admin/digidex" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminDigidex />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/enemydex" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminEnemydex />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/maps" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminMaps />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminGameSettings />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/items" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminItems />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/news" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminNews />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/users" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminUsers />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/roles" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminRoles />
                </AdminRoute>
            </PrivateRoute>
        } />
        <Route path="/admin/quests" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminQuests />
                </AdminRoute>
            </PrivateRoute>
        } />
      </Routes>
        </Layout>
      </Router>
    </ChatProvider>
  );
}

export default App;
