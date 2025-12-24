import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from '../../utils/antdComponents';
import { useRole } from './RoleBasedAccess';

const ProtectedRoute = ({ children, permission, requiredRole = null }) => {
  const { hasPermission, canAccess, getRole, isStoreUser, loading } = useRole();
  const location = useLocation();

  // Mostrar loading mientras se cargan los permisos
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando permisos...</div>
      </div>
    );
  }

  // Verificar si es usuario de store (no debe acceder al dashboard)
  if (isStoreUser()) {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="Los usuarios registrados desde la tienda no tienen acceso al dashboard administrativo."
        extra={
          <Button type="primary" href="/store">
            Ir a la Tienda
          </Button>
        }
      />
    );
  }

  // Verificar rol específico si se requiere
  if (requiredRole && getRole() !== requiredRole) {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle={`No puedes acceder a esta página. Se requiere el rol "${requiredRole}" (nivel insuficiente).`}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Volver
          </Button>
        }
      />
    );
  }

  // Verificar permiso específico
  if (permission && !hasPermission(permission)) {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="No puedes acceder a esta página. Tu nivel de usuario no tiene este permiso."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Volver
          </Button>
        }
      />
    );
  }

  // Verificar acceso por ruta
  if (!canAccess(location.pathname)) {
    return (
      <Result
        status="403"
        title="Acceso Denegado"
        subTitle="No puedes acceder a esta página. Tu nivel de usuario no lo permite."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Volver
          </Button>
        }
      />
    );
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return children;
};

export default ProtectedRoute;


