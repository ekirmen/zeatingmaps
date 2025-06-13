import React from 'react';
import SidebarMenu from '../components/SidebarMenu';
import TopBar from '../components/TopBar';
import { Outlet, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const location = useLocation();

  // Verifica si estamos en páginas que usan toda la pantalla
  const isFullPage = location.pathname === '/dashboard/Boleteria' || location.pathname === '/dashboard/web-studio';

  return (
    <div className="flex min-h-screen">
      {/* Mostrar Sidebar solo si no estamos en páginas de pantalla completa */}
      {!isFullPage && <SidebarMenu />}

      <div className={`${isFullPage ? 'w-full' : 'w-full'}`}>
        <TopBar />
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
