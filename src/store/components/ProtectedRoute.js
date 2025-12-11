import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantAccess } from '../../hooks/useTenantAccess';

const ProtectedRoute = ({ children, redirectTo = '/store/login', requireTenantAccess = true }) => {
  const { user, loading } = useAuth();
  const { hasAccess, loading: tenantLoading, reason } = useTenantAccess();
  const location = useLocation();

  // Si está cargando la autenticación, mostrar loading

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si se requiere verificación de tenant y está cargando, mostrar loading
  if (requireTenantAccess && tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando acceso a la empresa...</p>
        </div>
      </div>
    );
  }

  // Si se requiere verificación de tenant y no tiene acceso, mostrar error
  if (requireTenantAccess && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">{reason || 'No tienes acceso a esta empresa'}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/store'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver al Store
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene acceso, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;
