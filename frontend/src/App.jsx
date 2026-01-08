import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdminDigidex from './pages/AdminDigidex';
import AdminEnemydex from './pages/AdminEnemydex';
import AdminMaps from './pages/AdminMaps';
import AdminGameSettings from './pages/AdminGameSettings';
import AdminItems from './pages/AdminItems';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import Digidex from './pages/Digidex';
import Battle from './pages/Battle';
import MeusDigimons from './pages/MeusDigimons';
import Adoption from './pages/Adoption';
import Exploration from './pages/Exploration';
import Inventory from './pages/Inventory';
import EvolutionCenter from './pages/EvolutionCenter';
import Navbar from './components/Navbar';
import ChatWidget from './components/chat/ChatWidget';
import { ChatProvider } from './context/ChatContext';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && (user.username === 'clovis' || user.role === 'admin') ? children : <Navigate to="/" />;
}

function App() {
  return (
    <ChatProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        <Route path="/" element={
            <PrivateRoute>
                <Home />
            </PrivateRoute>
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
        <Route path="/evolution-center" element={
            <PrivateRoute>
                <EvolutionCenter />
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
        <Route path="/admin/users" element={
            <PrivateRoute>
                <AdminRoute>
                    <AdminUsers />
                </AdminRoute>
            </PrivateRoute>
        } />
      </Routes>
        <ChatWidget />
      </Router>
    </ChatProvider>
  );
}

export default App;
