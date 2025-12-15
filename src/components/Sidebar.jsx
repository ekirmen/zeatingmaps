import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  generateFilteredMenu, 
  hasPermission, 
  getReadableRole,
  isUserActive 
} from '../utils/roleBasedAccess';

// Componente de Sidebar con Control de Acceso Basado en Roles
const Sidebar = ({ user, isOpen, onToggle }) => {
  const location = useLocation();
  const [filteredMenu, setFilteredMenu] = useState([]);

  // Generar menú filtrado cuando cambie el usuario
  useEffect(() => {
    if (user) {
      const menu = generateFilteredMenu(user);
      setFilteredMenu(menu);
    }
  }, [user]);

  // Si no hay usuario o no está activo, no mostrar sidebar
  if (!user || !isUserActive(user)) {
    return null;
  }

  // Renderizar elemento del menú
  const renderMenuItem = (item) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.id} className="menu-section">
          <button className="menu-button w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              {item.icon && <i className={`fas fa-${item.icon} w-5 h-5 mr-3`}></i>}
              <span className="font-medium">{item.label}</span>
            </div>
          </button>
          <div className="submenu pl-4">
            {item.children.map(child => renderMenuItem(child))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={`menu-item flex items-center px-4 py-3 transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        {item.icon && <i className={`fas fa-${item.icon} w-5 h-5 mr-3`}></i>}
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className={`bg-white shadow-lg w-64 h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-blue-600">Panel Admin</div>
          <button 
            onClick={onToggle}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        {/* Información del usuario */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 truncate">
            {user.full_name || user.email}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {getReadableRole(user.role)}
          </div>
          <div className="text-xs text-gray-400 mt-1 truncate">
            {user.tenant?.company_name || 'Sin empresa asignada'}
          </div>
          <div className="mt-2 flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isUserActive(user) ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className="text-xs text-gray-500">
              {isUserActive(user) ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="py-4 overflow-y-auto h-[calc(100vh-200px)]">
        {filteredMenu.length > 0 ? (
          filteredMenu.map(renderMenuItem)
        ) : (
          <div className="px-4 py-3 text-gray-500 text-sm">
            No tienes permisos para ver ninguna sección.
          </div>
        )}
      </nav>

      {/* Footer con información del sistema */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Sistema SaaS v1.0
          <div className="mt-1 text-xs text-gray-400">
            {new Date().getFullYear()} © Todos los derechos reservados
          </div>
        </div>
      </div>
    </aside>
  );
};

// Componente de protección de ruta
export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  user 
}) => {
  // Verificar si hay usuario
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a esta página.
          </p>
          <Link 
            to="/login" 
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // Verificar si el usuario está activo
  if (!isUserActive(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cuenta Inactiva
          </h2>
          <p className="text-gray-600">
            Tu cuenta está inactiva. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  // Verificar rol requerido
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Rol Insuficiente
          </h2>
          <p className="text-gray-600">
            Necesitas el rol "{getReadableRole(requiredRole)}" para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tu rol actual: {getReadableRole(user.role)}
          </p>
        </div>
      </div>
    );
  }

  // Verificar permiso requerido
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Permisos Insuficientes
          </h2>
          <p className="text-gray-600">
            Necesitas el permiso "{requiredPermission}" para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Hook personalizado para verificar permisos
export const usePermissions = (user) => {
  const checkPermission = (permission) => {
    return hasPermission(user, permission);
  };

  const checkMultiplePermissions = (permissions) => {
    if (!user || !permissions) return false;
    return permissions.every(permission => hasPermission(user, permission));
  };

  const checkAnyPermission = (permissions) => {
    if (!user || !permissions) return false;
    return permissions.some(permission => hasPermission(user, permission));
  };

  const checkRole = (role) => {
    return user?.role === role;
  };

  const checkAnyRole = (roles) => {
    if (!user || !roles) return false;
    return roles.includes(user.role);
  };

  return {
    // Métodos de verificación
    checkPermission,
    checkMultiplePermissions,
    checkAnyPermission,
    checkRole,
    checkAnyRole,
    
    // Información del usuario
    isActive: isUserActive(user),
    role: user?.role,
    readableRole: getReadableRole(user?.role),
    user: user,
    
    // Atajos comunes
    isAdmin: checkRole('admin'),
    isManager: checkRole('manager'),
    isUser: checkRole('user'),
    isGuest: checkRole('guest'),
    
    // Permisos comunes
    canViewDashboard: checkPermission('dashboard.view'),
    canEditSettings: checkPermission('settings.edit'),
    canManageUsers: checkPermission('users.manage'),
    canViewReports: checkPermission('reports.view'),
  };
};

// Componente de protección de elemento de UI
export const ProtectedElement = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  user,
  fallback = null 
}) => {
  if (!user) return fallback;
  
  // Verificar rol requerido
  if (requiredRole && user.role !== requiredRole) {
    return fallback;
  }
  
  // Verificar permiso requerido
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return fallback;
  }
  
  return children;
};

// Componente para mostrar estado de permisos
export const PermissionStatus = ({ user }) => {
  const permissions = usePermissions(user);
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="font-bold text-lg mb-3">Estado de Permisos</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Rol:</span>
          <span className="font-medium">{permissions.readableRole}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Estado:</span>
          <span className={`font-medium ${permissions.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {permissions.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        {user?.tenant && (
          <div className="flex justify-between">
            <span className="text-gray-600">Empresa:</span>
            <span className="font-medium">{user.tenant.company_name}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium mb-2">Permisos Disponibles:</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className={`text-sm px-2 py-1 rounded ${permissions.canViewDashboard ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Dashboard: {permissions.canViewDashboard ? '✓' : '✗'}
          </div>
          <div className={`text-sm px-2 py-1 rounded ${permissions.canEditSettings ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Configuración: {permissions.canEditSettings ? '✓' : '✗'}
          </div>
          <div className={`text-sm px-2 py-1 rounded ${permissions.canManageUsers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Usuarios: {permissions.canManageUsers ? '✓' : '✗'}
          </div>
          <div className={`text-sm px-2 py-1 rounded ${permissions.canViewReports ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Reportes: {permissions.canViewReports ? '✓' : '✗'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;