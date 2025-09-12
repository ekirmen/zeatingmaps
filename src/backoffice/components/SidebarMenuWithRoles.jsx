import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Layout, 
  Tooltip, 
  Badge,
  Typography,
  Space,
  Tag
} from 'antd';
import {
  faHome,
  faCogs,
  faBuilding,
  faMap,
  faUsers,
  faMoneyBillWave,
  faTicketAlt,
  faBox,
  faGift,
  faPercent,
  faShieldAlt,
  faTruck,
  faCalendarAlt,
  faChartLine,
  faTrophy,
  faLayerGroup,
  faFileInvoice,
  faCoins,
  faReceipt,
  faTags,
  faCog,
  faPrint,
  faEnvelope,
  faFileAlt,
  faUndo,
  faChartBar,
  faCreditCard,
  faCloud,
  faDatabase,
  faCode,
  faUserShield,
  faStore,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRole } from './RoleBasedAccess';

const { Sider } = Layout;
const { Text } = Typography;

const SidebarMenuWithRoles = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, getRole, isStoreUser } = useRole();
  const [temporaryExpanded, setTemporaryExpanded] = useState(false);
  const [temporaryExpandedTimeout, setTemporaryExpandedTimeout] = useState(null);

  const handleTemporaryExpansion = () => {
    if (collapsed) {
      setTemporaryExpanded(true);
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

  // Verificar si el usuario es de store (no debe ver el sidebar)
  if (isStoreUser()) {
    return null;
  }

  // Función para crear elementos de menú con verificación de permisos
  const createMenuItem = (item) => {
    // Verificar si el usuario tiene permisos para este elemento
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    // Si es un submenu, filtrar los elementos que el usuario puede ver
    if (item.type === 'submenu' && item.items) {
      const visibleItems = item.items.filter(subItem => 
        !subItem.permission || hasPermission(subItem.permission)
      );
      
      if (visibleItems.length === 0) {
        return null; // No mostrar el submenu si no hay elementos visibles
      }

      return {
        ...item,
        items: visibleItems.map(subItem => createMenuItem(subItem)).filter(Boolean)
      };
    }

    return item;
  };

  const mainMenuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: faHome,
      type: 'link',
      permission: 'dashboard'
    },
    {
      title: 'Administración',
      icon: faCogs,
      type: 'submenu',
      submenuId: 'admin',
      permission: 'usuarios', // Mostrar si tiene al menos uno de los permisos de admin
      items: [
        { 
          title: 'Recintos', 
          path: '/dashboard/recintos', 
          icon: faBuilding,
          permission: 'recintos'
        },
        { 
          title: 'Plano', 
          path: '/dashboard/plano', 
          icon: faMap,
          permission: 'recintos'
        },
        { 
          title: 'Usuarios', 
          path: '/dashboard/usuarios', 
          icon: faUsers,
          permission: 'usuarios'
        },
        { 
          title: 'Liquidaciones', 
          path: '/dashboard/liquidaciones', 
          icon: faMoneyBillWave,
          permission: 'liquidaciones'
        }
      ]
    },
    {
      title: 'Programación',
      icon: faCalendarAlt,
      type: 'submenu',
      submenuId: 'programming',
      permission: 'eventos', // Mostrar si tiene al menos uno de los permisos de programación
      items: [
        { 
          title: 'Entradas', 
          path: '/dashboard/entradas', 
          icon: faTicketAlt,
          permission: 'entradas'
        },
        { 
          title: 'Productos', 
          path: '/dashboard/productos', 
          icon: faBox,
          permission: 'productos'
        },
        { 
          title: 'Plantillas Productos', 
          path: '/dashboard/plantillas-productos', 
          icon: faGift,
          permission: 'plantillas_productos'
        },
        // { 
        //   title: 'Donaciones', 
        //   path: '/dashboard/donaciones', 
        //   icon: faGift,
        //   permission: 'entradas'
        // },
        { 
          title: 'Comisiones', 
          path: '/dashboard/comisiones', 
          icon: faPercent,
          permission: 'comisiones'
        },
        // { 
        //   title: 'Seguros', 
        //   path: '/dashboard/seguros', 
        //   icon: faShieldAlt,
        //   permission: 'seguros'
        // },
        // { 
        //   title: 'Envío', 
        //   path: '/dashboard/envio', 
        //   icon: faTruck,
        //   permission: 'envio'
        // },
        { 
          title: 'Eventos', 
          path: '/dashboard/eventos', 
          icon: faCalendarAlt,
          permission: 'eventos'
        },
        { 
          title: 'Plantillas Precios', 
          path: '/dashboard/plantillas-precios', 
          icon: faChartLine,
          permission: 'plantillas_precios'
        },
        { 
          title: 'Funciones', 
          path: '/dashboard/funciones', 
          icon: faTrophy,
          permission: 'funciones'
        },
        { 
          title: 'Cupos', 
          path: '/dashboard/cupos', 
          icon: faLayerGroup,
          permission: 'funciones'
        },
        { 
          title: 'Plantillas Cupos', 
          path: '/dashboard/plantillas-cupos', 
          icon: faChartLine,
          permission: 'plantillas_precios'
        },
        // { 
        //   title: 'Filas Virtuales', 
        //   path: '/dashboard/filas-virtuales', 
        //   icon: faLayerGroup,
        //   permission: 'funciones'
        // },
        { 
          title: 'Abonos', 
          path: '/dashboard/paquetes', 
          icon: faBox,
          permission: 'paquetes'
        },
        // { 
        //   title: 'Multipase', 
        //   path: '/dashboard/multipase', 
        //   icon: faTicketAlt,
        //   permission: 'multipase'
        // },
        { 
          title: 'Abonos', 
          path: '/dashboard/abonos', 
          icon: faFileInvoice,
          permission: 'abonos'
        },
        { 
          title: 'IVA', 
          path: '/dashboard/iva', 
          icon: faCoins,
          permission: 'iva'
        }
      ]
    },
    {
      title: 'Ventas',
      icon: faStore,
      type: 'submenu',
      submenuId: 'sales',
      permission: 'boleteria', // Mostrar si tiene al menos uno de los permisos de ventas
      items: [
        { 
          title: 'Boletería', 
          path: '/dashboard/boleteria', 
          icon: faTicketAlt,
          permission: 'boleteria'
        },
        { 
          title: 'Reportes', 
          path: '/dashboard/reportes', 
          icon: faChartPie,
          permission: 'reportes'
        },
        { 
          title: 'CRM', 
          path: '/dashboard/crm', 
          icon: faUsers,
          permission: 'crm'
        },
        { 
          title: 'Tags', 
          path: '/dashboard/tags', 
          icon: faTags,
          permission: 'tags'
        }
      ]
    },
    {
      title: 'Configuración',
      icon: faCog,
      type: 'submenu',
      submenuId: 'config',
      permission: 'settings', // Mostrar si tiene al menos uno de los permisos de configuración
      items: [
        { 
          title: 'Configuración', 
          path: '/dashboard/settings', 
          icon: faCog,
          permission: 'settings'
        },
        { 
          title: 'Configuración Asientos', 
          path: '/dashboard/seat-settings', 
          icon: faCog,
          permission: 'seat_settings'
        },
        { 
          title: 'Configuración Impresora', 
          path: '/dashboard/printer-settings', 
          icon: faPrint,
          permission: 'printer_settings'
        },
        { 
          title: 'Configuración Email', 
          path: '/dashboard/email-config', 
          icon: faEnvelope,
          permission: 'email_config'
        },
        { 
          title: 'Logs de Auditoría', 
          path: '/dashboard/audit-logs', 
          icon: faFileAlt,
          permission: 'audit_logs'
        },
        { 
          title: 'Gestión Reembolsos', 
          path: '/dashboard/refund-management', 
          icon: faUndo,
          permission: 'refund_management'
        },
        { 
          title: 'Analytics de Pagos', 
          path: '/dashboard/payment-analytics', 
          icon: faChartBar,
          permission: 'payment_analytics'
        },
        { 
          title: 'Pasarelas de Pago', 
          path: '/dashboard/payment-gateways', 
          icon: faCreditCard,
          permission: 'payment_gateways'
        }
      ]
    }
  ];

  // Agregar menú SaaS solo para usuarios del sistema
  if (hasPermission('saas')) {
    mainMenuItems.push({
      title: 'SaaS',
      icon: faCloud,
      type: 'submenu',
      submenuId: 'saas',
      permission: 'saas',
      items: [
        { 
          title: 'Dashboard SaaS', 
          path: '/dashboard/saas', 
          icon: faChartPie,
          permission: 'saas'
        },
        { 
          title: 'Usuarios del Sistema', 
          path: '/dashboard/saas/users', 
          icon: faUsers,
          permission: 'saas_roles'
        },
        { 
          title: 'Configuración', 
          path: '/dashboard/saas/settings', 
          icon: faCog,
          permission: 'saas_settings'
        },
        { 
          title: 'Facturación', 
          path: '/dashboard/saas/billing', 
          icon: faMoneyBillWave,
          permission: 'saas_billing'
        },
        { 
          title: 'Pasarelas de Pago', 
          path: '/dashboard/saas/payment-gateways', 
          icon: faCreditCard,
          permission: 'saas_payment_gateways'
        },
        { 
          title: 'Gestión de Roles', 
          path: '/dashboard/saas/roles', 
          icon: faUserShield,
          permission: 'saas_roles'
        },
        { 
          title: 'API Explorer', 
          path: '/dashboard/saas/api-explorer', 
          icon: faCode,
          permission: 'saas_api_explorer'
        }
      ]
    });
  }

  // Filtrar elementos del menú basado en permisos
  const filteredMenuItems = mainMenuItems
    .map(createMenuItem)
    .filter(Boolean);

  // Convertir a formato de menú de Ant Design
  const menuItems = filteredMenuItems.map(item => {
    if (item.type === 'submenu') {
      return {
        key: item.submenuId,
        icon: <FontAwesomeIcon icon={item.icon} />,
        label: item.title,
        children: item.items.map(subItem => ({
          key: subItem.path,
          icon: <FontAwesomeIcon icon={subItem.icon} />,
          label: subItem.title,
          onClick: () => navigate(subItem.path)
        }))
      };
    } else {
      return {
        key: item.path,
        icon: <FontAwesomeIcon icon={item.icon} />,
        label: item.title,
        onClick: () => navigate(item.path)
      };
    }
  });

  const isExpanded = !collapsed || temporaryExpanded;

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={!isExpanded}
      width={250}
      className="bg-white shadow-lg"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header del Sidebar */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faTicketAlt} className="text-white text-sm" />
          </div>
          {isExpanded && (
            <div>
              <div className="font-semibold text-gray-900">VeeEventos</div>
              <div className="text-xs text-gray-500">Dashboard</div>
            </div>
          )}
        </div>
      </div>

      {/* Información del Usuario */}
      {isExpanded && (
        <div className="p-4 border-b bg-gray-50">
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-white text-xs" />
              </div>
              <Text strong className="text-sm">Usuario Actual</Text>
            </div>
            <Tag color="blue" size="small">
              {getRole()?.toUpperCase() || 'USUARIO'}
            </Tag>
          </Space>
        </div>
      )}

      {/* Menú */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-0"
          style={{ border: 'none' }}
          onMouseEnter={handleTemporaryExpansion}
          onMouseLeave={keepExpanded}
        />
      </div>

      {/* Footer del Sidebar */}
      {isExpanded && (
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            <div>VeeEventos v1.0</div>
            <div>Sistema de Boletería</div>
          </div>
        </div>
      )}
    </Sider>
  );
};

export default SidebarMenuWithRoles;
