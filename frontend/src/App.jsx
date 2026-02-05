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
import { AuthProvider, useAuth } from './context/AuthContext';
import PageTitleUpdater from './components/PageTitleUpdater';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }
    
    return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    const hasPermissions = user?.permissions && user.permissions.length > 0;
    return user && (user.username === 'clovis' || user.role === 'admin' || hasPermissions) ? children : <Navigate to="/" />;
}

function Layout({ children }) {
  const location = useLocation();
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === 'kubelabs.online' || hostname === 'www.kubelabs.online';
  
  // Is Landing if: explicitly on /kubelabs OR on landing domain at root
  const isLanding = location.pathname === '/kubelabs' || (isLandingDomain && location.pathname === '/');

  return (
    <>
      <PageTitleUpdater />
      {!isLanding && <Navbar />}

      <div className={!isLanding ? "md:pb-0 pb-20" : ""}>
        {children}
      </div>
      {!isLanding && <ChatWidget />}
    </>
  );
}

function App() {
  // Check domain for default routing
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === 'kubelabs.online' || hostname === 'www.kubelabs.online';

  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Layout>
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
    </AuthProvider>
  );
}

export default App;
