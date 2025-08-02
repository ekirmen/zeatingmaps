import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  faHome,
  faTicketAlt,
  faCalendarAlt,
  faUsers,
  faCreditCard,
  faChartBar,
  faUndo,
  faCog,
  faPalette,
  faEnvelope,
  faGlobe,
  faTags,
  faImage,
  faFileAlt,
  faPercent,
  faMap,
  faBuilding,
  faUserPlus,
  faHandshake,
  faDatabase,
  faChartLine,
  faCogs,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SidebarMenu = ({ collapsed }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: faHome
    },
    {
      title: 'Boletería',
      path: '/dashboard/boleteria',
      icon: faTicketAlt
    },
    {
      title: 'Eventos',
      path: '/dashboard/eventos',
      icon: faCalendarAlt
    },
    {
      title: 'Clientes',
      path: '/dashboard/clientes',
      icon: faUsers
    },
    {
      title: 'Pasarelas',
      path: '/dashboard/pasarelas',
      icon: faCreditCard
    },
    {
      title: 'Análisis',
      path: '/dashboard/analytics',
      icon: faChartBar
    },
    {
      title: 'Reportes',
      path: '/dashboard/reports',
      icon: faChartLine
    },
    {
      title: 'Reembolsos',
      path: '/dashboard/reembolsos',
      icon: faUndo
    }
  ];

  const configItems = [
    {
      title: 'Configuración',
      path: '/dashboard/settings',
      icon: faCogs
    },
    {
      title: 'Logs de Auditoría',
      path: '/dashboard/logs',
      icon: faClipboardList
    }
  ];

  return (
    <div className={`bg-gray-800 text-white ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      <div className="p-4">
        <h2 className={`text-xl font-bold ${collapsed ? 'hidden' : 'block'}`}>
          Admin Panel
        </h2>
      </div>
      
      <nav className="mt-8">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4 mr-3" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sección de Configuración */}
      {!collapsed && (
        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sistema
          </h3>
          <ul className="mt-2 space-y-1">
            {configItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-2 py-1 text-sm rounded hover:bg-gray-700 ${
                    isActive(item.path) ? 'bg-gray-700 text-white' : 'text-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-3 h-3 mr-2" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SidebarMenu;
