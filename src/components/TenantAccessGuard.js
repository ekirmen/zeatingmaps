import React from 'react';
import { useTenantAccess } from '../hooks/useTenantAccess';
import { Alert, Button, Result } from '../utils/antdComponents';
import { useNavigate } from 'react-router-dom';

const TenantAccessGuard = ({ children, fallback, showAlert = true }) => {
  const { hasAccess, loading, reason, isTenantUser } = useTenantAccess();
  const navigate = useNavigate();

  // Si está cargando, mostrar loading

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando acceso a la empresa...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, mostrar mensaje de error
  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Result
          status="error"
          title="Acceso Denegado"
          subTitle={reason || 'No tienes acceso a esta empresa'}
          extra={[
            <Button 
              type="primary" 
              key="home"
              onClick={() => navigate('/store')}
            >
              Volver al Store
            </Button>,
            <Button 
              key="logout"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
            >
              Cerrar Sesión
            </Button>
          ]}
        />
      </div>
    );
  }

  // Si tiene acceso, mostrar el contenido
  return (
    <>
      {showAlert && !isTenantUser && (
        <Alert
          message="Advertencia de Seguridad"
          description="Tu cuenta no está asociada a una empresa específica. Esto puede limitar tu acceso a ciertas funcionalidades."
          type="warning"
          showIcon
          className="mb-4"
          action={
            <Button size="small" type="link">
              Contactar Soporte
            </Button>
          }
        />
      )}
      {children}
    </>
  );
};

export default TenantAccessGuard;

