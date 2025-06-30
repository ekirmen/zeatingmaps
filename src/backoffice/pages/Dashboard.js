import React, { useEffect } from 'react';
import SidebarMenu from '../components/SidebarMenu';
import TopBar from '../components/TopBar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (role && role !== 'administrador') {
      navigate('/store');
    }
  }, [role, navigate]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

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
