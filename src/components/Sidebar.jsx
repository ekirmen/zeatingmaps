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

    return null;
  }

  // Renderizar elemento del menú
  const renderMenuItem = (item) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.id} className="menu-section">
          <button className="menu-button">
            <div className="flex items-center">
              <i className={`fas fa-${item.icon} w-5 h-5 mr-3`}></i>
              <span>{item.label}</span>
            </div>
          </button>
          <div className="submenu">
            {item.children.map(child => renderMenuItem(child))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={`menu-item ${isActive ? 'active' : ''}`}
      >
        <i className={`fas fa-${item.icon} w-5 h-5 mr-3`}></i>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className={`bg-white shadow-lg w-64 transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <div className="text-xl font-bold text-blue-600">Panel Admin</div>
        </div>
        
        {/* Información del usuario */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700">
            {user.full_name || user.email}
          </div>
          <div className="text-xs text-gray-500">
            {getReadableRole(user.role)}
          </div>
          <div className="text-xs text-gray-400">
            {user.tenant?.company_name || 'Sin empresa asignada'}
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="py-4">
        {filteredMenu.map(renderMenuItem)}
      </nav>

      {/* Footer con información del sistema */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Sistema SaaS v1.0
        </div>
      </div>
    </div>
  );
};

// Componente de protección de ruta
export 
  }

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
export 
  };

  const checkMultiplePermissions = (permissions) => {
    return permissions.every(permission => hasPermission(user, permission));
  };

  const checkAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(user, permission));
  };

  return {
    checkPermission,
    checkMultiplePermissions,
    checkAnyPermission,
    isActive: isUserActive(user),
    role: user?.role,
    readableRole: getReadableRole(user?.role)
  };
};

export default Sidebar;
