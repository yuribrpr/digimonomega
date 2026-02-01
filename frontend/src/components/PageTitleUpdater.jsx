import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Digimon Omega';

    if (path === '/') {
        title = 'Digimon Omega | Início';
    } else if (path === '/login') {
        title = 'Digimon Omega | Login';
    } else if (path === '/register') {
        title = 'Digimon Omega | Cadastro';
    } else if (path.startsWith('/profile/')) {
        title = 'Digimon Omega | Perfil';
    } else if (path === '/digidex') {
        title = 'Digimon Omega | Digidex';
    } else if (path === '/battle') {
        title = 'Digimon Omega | Batalha';
    } else if (path === '/meus-digimons') {
        title = 'Digimon Omega | Meus Digimons';
    } else if (path === '/adoption') {
        title = 'Digimon Omega | Adoção';
    } else if (path === '/exploration') {
        title = 'Digimon Omega | Exploração';
    } else if (path === '/inventory') {
        title = 'Digimon Omega | Inventário';
    } else if (path === '/menu') {
        title = 'Digimon Omega | Menu';
    } else if (path === '/evolution-center') {
        title = 'Digimon Omega | Centro de Evolução';
    } else if (path.startsWith('/admin')) {
        if (path === '/admin/digidex') title = 'Digimon Omega | Admin Digidex';
        else if (path === '/admin/enemydex') title = 'Digimon Omega | Admin Enemydex';
        else if (path === '/admin/maps') title = 'Digimon Omega | Admin Mapas';
        else if (path === '/admin/settings') title = 'Digimon Omega | Admin Configurações';
        else if (path === '/admin/items') title = 'Digimon Omega | Admin Itens';
        else if (path === '/admin/news') title = 'Digimon Omega | Admin Notícias';
        else if (path === '/admin/users') title = 'Digimon Omega | Admin Usuários';
        else if (path === '/admin/roles') title = 'Digimon Omega | Admin Cargos';
        else title = 'Digimon Omega | Admin';
    }

    document.title = title;
  }, [location]);

  return null;
};

export default PageTitleUpdater;
