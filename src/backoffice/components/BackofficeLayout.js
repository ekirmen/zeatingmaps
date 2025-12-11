import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import AdminNotificationCenter from './AdminNotificationCenter';
import DashboardLogin from './DashboardLogin';
import { RecintoProvider } from '../contexts/RecintoContext';
import { RecintoSalaProvider } from '../contexts/RecintoSalaContext';
import { IvaProvider } from '../contexts/IvaContext';
import { TagProvider } from '../contexts/TagContext';

const BackofficeLayout = () => {
  const location = useLocation();
  const isBoleteriaRoute = location.pathname.includes('/dashboard/boleteria');

  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Verificar autenticación al montar el componente
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
        // Aquí podrías verificar el token con el backend si es necesario
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    
    checkAuth();
    
    // Escuchar cambios en el localStorage
    const handleStorageChange = () => {
      checkAuth();
    };
    

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Función para manejar el login exitoso
  const handleLogin = ({ token, user: userData }) => {
    setIsAuthenticated(true);
    setUser(userData);
  };
  
  // Función para manejar el logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };
  
  // Si no está autenticado, mostrar el login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <DashboardLogin onLogin={handleLogin} />
      </div>
    );
  }
  
  if (isBoleteriaRoute) {
    return (
      <RecintoProvider>
        <RecintoSalaProvider>
          <IvaProvider>
            <TagProvider>
              <div className="flex h-screen bg-gray-100">
                {showAdminPanel && (
                  <div className="w-64 bg-white shadow-lg">
                    <SidebarMenu collapsed={false} />
                  </div>
                )}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <main className="flex-1 overflow-auto">
                    <Outlet />
                  </main>
                </div>
              </div>
            </TagProvider>
          </IvaProvider>
        </RecintoSalaProvider>
      </RecintoProvider>
    );
  }

  return (
    <RecintoProvider>
      <RecintoSalaProvider>
        <IvaProvider>
          <TagProvider>
            <div className="flex h-screen bg-gray-100">
              <SidebarMenu collapsed={sidebarCollapsed} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                      <AdminNotificationCenter />
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-500">
                          Bienvenido, {user?.email || 'Administrador'}
                        </div>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        >
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
                  <Outlet />
                </main>
              </div>
            </div>
          </TagProvider>
        </IvaProvider>
      </RecintoSalaProvider>
    </RecintoProvider>
  );
};

export default BackofficeLayout; 
