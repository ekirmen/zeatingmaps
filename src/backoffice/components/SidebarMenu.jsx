import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Ticket,
  Calendar,
  Users,
  CreditCard,
  BarChart2,
  Settings,
  Palette,
  Mail,
  Globe,
  FileText,
  Percent,
  Map,
  Building,
  BarChart,
  Tag,
  Bell,
  Banknote,
  Package,
  CalendarRange,
  userCog,
  Code,
  ChevronRight,
  ChevronDown,
  UserCog
} from 'lucide-react';
import EventSearch from './EventSearch';

const SidebarMenu = ({ collapsed }) => {
  const location = useLocation();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [temporaryExpanded, setTemporaryExpanded] = useState(false);
  const [temporaryExpandedTimeout, setTemporaryExpandedTimeout] = useState(null);

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  const toggleSubmenu = (submenuId) => {
    setActiveSubmenu(activeSubmenu === submenuId ? null : submenuId);
  };

  // Función mejorada para manejar la expansión temporal
  const handleTemporaryExpansion = () => {
    if (collapsed) {
      // Limpiar timeout anterior si existe
      if (temporaryExpandedTimeout) {
        clearTimeout(temporaryExpandedTimeout);
      }

      setTemporaryExpanded(true);

      // Crear nuevo timeout
      const newTimeout = setTimeout(() => {
        setTemporaryExpanded(false);
        setTemporaryExpandedTimeout(null);
      }, 5000); // Aumentado a 5 segundos para más estabilidad

      setTemporaryExpandedTimeout(newTimeout);
    }
  };

  // Función para mantener el sidebar expandido cuando el usuario está interactuando
  const keepExpanded = () => {
    if (collapsed && temporaryExpanded) {
      // Limpiar timeout anterior si existe
      if (temporaryExpandedTimeout) {
        clearTimeout(temporaryExpandedTimeout);
      }

      // Crear nuevo timeout
      const newTimeout = setTimeout(() => {
        setTemporaryExpanded(false);
        setTemporaryExpandedTimeout(null);
      }, 5000);

      setTemporaryExpandedTimeout(newTimeout);
    }
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (temporaryExpandedTimeout) {
        clearTimeout(temporaryExpandedTimeout);
      }
    };
  }, [temporaryExpandedTimeout]);

  const mainMenuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      type: 'link'
    },
    {
      title: 'Administración',
      icon: Settings,
      type: 'submenu',
      submenuId: 'admin',
      items: [
        { title: 'Recintos', path: '/dashboard/recintos', icon: Building },
        { title: 'Plano', path: '/dashboard/plano', icon: Map },
        { title: 'Usuarios', path: '/dashboard/usuarios', icon: Users },
        { title: 'Liquidaciones', path: '/dashboard/liquidacion', icon: Banknote }
      ]
    },
    {
      title: 'Programación',
      icon: Calendar,
      type: 'submenu',
      submenuId: 'scheduling',
      items: [
        { title: 'Entradas', path: '/dashboard/entradas', icon: Ticket },
        { title: 'Plantillas de precios', path: '/dashboard/plantillas-precios', icon: Percent },
        { title: 'Productos', path: '/dashboard/productos', icon: Package },
        { title: 'Plantillas de Productos', path: '/dashboard/plantillas-productos', icon: Package },
        { title: 'Paquetes', path: '/dashboard/paquetes', icon: Package },
        { title: 'Comisiones y tasas', path: '/dashboard/comisiones', icon: Percent },
        { title: 'Pasarelas de Pago', path: '/dashboard/payment-gateways', icon: CreditCard },
        { title: 'IVA', path: '/dashboard/iva', icon: Percent },
        { title: 'Descuentos', path: '/dashboard/descuentos', icon: Percent },
        { title: 'Abonos', path: '/dashboard/abonos', icon: CalendarRange },
        { title: 'Afiliados', path: '/dashboard/afiliados', icon: Users },
        { title: 'Eventos', path: '/dashboard/eventos', icon: Ticket },
        { title: 'Funciones', path: '/dashboard/funciones', icon: Calendar }
      ]
    },
    {
      title: 'CRM',
      icon: UserCog,
      type: 'submenu',
      submenuId: 'crm',
      items: [
        { title: 'Mailchimp', path: '/dashboard/mailchimp', icon: Mail },
        { title: 'Formularios', path: '/dashboard/formularios', icon: FileText },
        { title: 'Notificaciones', path: '/dashboard/notificaciones', icon: Bell },
        { title: 'Encuestas', path: '/dashboard/encuestas', icon: BarChart },
        { title: 'Campañas de mailing', path: '/dashboard/email-campaigns', icon: Mail },
        { title: 'Etiquetas', path: '/dashboard/tags', icon: Tag }
      ]
    },
    {
      title: 'Informes',
      icon: FileText,
      type: 'submenu',
      submenuId: 'reports',
      items: [
        { title: 'Reportes Detallados', path: '/dashboard/reports', icon: BarChart2 },
        { title: 'Reportes Programados (acción rápida)', path: '/dashboard/scheduled-reports', icon: Mail },
        { title: 'Plantillas de Email', path: '/dashboard/email-templates', icon: Palette }
      ]
    },
    {
      title: 'Personalización',
      icon: Palette,
      type: 'submenu',
      submenuId: 'personalization',
      items: [
        { title: 'Formatos de entrada', path: '/dashboard/formato-entrada', icon: Ticket },
        { title: 'Textos legales', path: '/dashboard/legal-texts', icon: FileText },
        { title: 'Web Studio', path: '/dashboard/webstudio', icon: Palette },
        { title: 'Configuración de Asientos', path: '/dashboard/seat-settings', icon: Settings },
        { title: 'Configuración de Correo', path: '/dashboard/email-config', icon: Mail },
        { title: 'Páginas', path: '/dashboard/pages', icon: FileText },
        { title: 'Colores Web', path: '/dashboard/webcolors', icon: Palette }
      ]
    },
    {
      title: 'Boletería',
      path: '/dashboard/boleteria',
      icon: Ticket,
      type: 'link'
    },
    {
      title: 'Panel SaaS',
      icon: Globe,
      type: 'submenu',
      submenuId: 'saas',
      items: [
        { title: 'Dashboard SaaS', path: '/dashboard/saas', icon: BarChart2 },
        { title: 'Facturación', path: '/dashboard/saas/billing', icon: CreditCard },
        { title: 'Pasarelas de Pago', path: '/dashboard/saas/payment-gateways', icon: CreditCard },
        { title: 'Roles y Permisos', path: '/dashboard/saas/roles', icon: Users },
        { title: 'API Explorer', path: '/dashboard/saas/api-explorer', icon: Code },
        { title: 'Configuración', path: '/dashboard/saas/settings', icon: Settings }
      ]
    }
  ];

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    if (item.type === 'link') {
      return (
        <Link
          key={item.title}
          to={item.path}
          className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${isActive(item.path) ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' : ''
            }`}
          onClick={() => {
            handleTemporaryExpansion();
          }}
        >
          <Icon className="w-5 h-5 mr-3" />
          {(!collapsed || temporaryExpanded) && <span>{item.title}</span>}
        </Link>
      );
    }

    if (item.type === 'submenu') {
      return (
        <div key={item.title}>
          <button
            onClick={() => {
              handleTemporaryExpansion();
              toggleSubmenu(item.submenuId);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${activeSubmenu === item.submenuId ? 'bg-blue-100 text-blue-600' : ''
              }`}
          >
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-3" />
              {(!collapsed || temporaryExpanded) && <span>{item.title}</span>}
            </div>
            {(!collapsed || temporaryExpanded) && (
              activeSubmenu === item.submenuId ? (
                <ChevronDown className="w-4 h-4 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform" />
              )
            )}
          </button>

          {activeSubmenu === item.submenuId && (!collapsed || temporaryExpanded) && (
            <div className="bg-gray-50">
              {item.items.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.title}
                    to={subItem.path}
                    className={`flex items-center px-8 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${isActive(subItem.path) ? 'bg-blue-100 text-blue-600' : ''
                      }`}
                    onClick={() => {
                      handleTemporaryExpansion();
                    }}
                  >
                    <SubIcon className="w-4 h-4 mr-3" />
                    <span>{subItem.title}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Si estamos en boletería y el menú no está colapsado, mostrar el buscador
  const isBoleteriaActive = isActive('/dashboard/boleteria');

  return (
    <div
      className={`bg-white shadow-lg ${(collapsed && !temporaryExpanded) ? 'w-16' : 'w-64'} transition-all duration-300`}
      onMouseEnter={keepExpanded}
      onMouseMove={keepExpanded}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          {(!collapsed || temporaryExpanded) && (
            <div className="text-xl font-bold text-blue-600">
              Panel Admin
            </div>
          )}
        </div>
      </div>

      {/* Buscador de eventos (solo en boletería) */}
      {isBoleteriaActive && (!collapsed || temporaryExpanded) && (
        <div className="p-4 border-b border-gray-200">
          <EventSearch />
        </div>
      )}

      {/* Menu Items */}
      <nav className="py-4">
        {mainMenuItems.map(renderMenuItem)}
      </nav>
    </div>
  );
};

// Si estamos en boletería y el menú no está colapsado, mostrar el buscador
const isBoleteriaActive = isActive('/dashboard/boleteria');

return (
  <div
    className={`bg-white shadow-lg ${(collapsed && !temporaryExpanded) ? 'w-16' : 'w-64'} transition-all duration-300`}
    onMouseEnter={keepExpanded}
    onMouseMove={keepExpanded}
  >
    {/* Logo */}
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-center">
        {(!collapsed || temporaryExpanded) && (
          <div className="text-xl font-bold text-blue-600">
            Panel Admin
          </div>
        )}
      </div>
    </div>

    {/* Buscador de eventos (solo en boletería) */}
    {isBoleteriaActive && (!collapsed || temporaryExpanded) && (
      <div className="p-4 border-b border-gray-200">
        <EventSearch />
      </div>
    )}

    {/* Menu Items */}
    <nav className="py-4">
      {mainMenuItems.map(renderMenuItem)}
    </nav>
  </div>
);
};

export default SidebarMenu;
