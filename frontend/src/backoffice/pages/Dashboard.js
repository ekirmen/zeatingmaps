import React from 'react';
import SidebarMenu from '../components/SidebarMenu';
import TopBar from '../components/TopBar';
import { Outlet, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const location = useLocation();

  // Verifica si estamos en la página de boletería
  const isBoleteriaPage = location.pathname === '/dashboard/Boleteria';

  return (
    <div className="flex min-h-screen">
      {/* Mostrar Sidebar solo si no estamos en Boleteria */}
      {!isBoleteriaPage && <SidebarMenu />}

      <div className={`${isBoleteriaPage ? 'w-full' : 'w-full'}`}>
        <TopBar />
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
