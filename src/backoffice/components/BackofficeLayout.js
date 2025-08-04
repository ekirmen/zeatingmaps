import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';
import AdminNotificationCenter from './AdminNotificationCenter';
import { RecintoProvider } from '../contexts/RecintoContext';
import { RecintoSalaProvider } from '../contexts/RecintoSalaContext';
import { IvaProvider } from '../contexts/IvaContext';
import { TagProvider } from '../contexts/TagContext';

const BackofficeLayout = () => {
  const location = useLocation();
  const isBoleteriaRoute = location.pathname.includes('/dashboard/boleteria');
  const isCrearMapaRoute = location.pathname.includes('/dashboard/crear-mapa');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  if (isBoleteriaRoute || isCrearMapaRoute) {
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
                  <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setShowAdminPanel(!showAdminPanel)}
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
                            Bienvenido, Administrador
                          </div>
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            A
                          </div>
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
                          Bienvenido, Administrador
                        </div>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          A
                        </div>
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