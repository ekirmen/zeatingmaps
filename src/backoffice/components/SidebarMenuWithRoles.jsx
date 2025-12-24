import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Layout,
  Typography,
  Space,
  Tag
} from '../../utils/antdComponents';
import {
  Home,
  Settings,
  Building,
  Map,
  Users,
  Banknote,
  Ticket,
  Package,
  Gift,
  Percent,
  Calendar,
  BarChart2,
  Trophy,
  Layers,
  FileText,
  Coins,
  Receipt,
  Tags,
  Printer,
  Mail,
  RotateCcw,
  CreditCard,
  Cloud,
  Code,
  ShieldCheck,
  Store,
  PieChart
} from 'lucide-react';
import { useRole } from './RoleBasedAccess';

const { Sider } = Layout;
const { Text } = Typography;

const SidebarMenuWithRoles = ({ collapsed, onMenuClick, asDrawer = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, getRole, isStoreUser } = useRole();

  // Handler para cuando se hace click en un item del menú
  const handleMenuClick = (path) => {
    navigate(path);
    if (onMenuClick) {
      onMenuClick();
    }
  };
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
      icon: Home,
      type: 'link',
      permission: 'dashboard'
    },
    {
      title: 'Administración',
      icon: Settings,
      type: 'submenu',
      submenuId: 'admin',
      permission: 'usuarios', // Mostrar si tiene al menos uno de los permisos de admin
      items: [
        {
          title: 'Recintos',
          path: '/dashboard/recintos',
          icon: Building,
          permission: 'recintos'
        },
        {
          title: 'Plano',
          path: '/dashboard/plano',
          icon: Map,
          permission: 'recintos'
        },
        {
          title: 'Usuarios',
          path: '/dashboard/usuarios',
          icon: Users,
          permission: 'usuarios'
        },
        {
          title: 'Liquidaciones',
          path: '/dashboard/liquidacion',
          icon: Banknote,
          permission: 'liquidaciones'
        }
      ]
    },
    {
      title: 'Programación',
      icon: Calendar,
      type: 'submenu',
      submenuId: 'programming',
      permission: 'eventos', // Mostrar si tiene al menos uno de los permisos de programación
      items: [
        {
          title: 'Entradas',
          path: '/dashboard/entradas',
          icon: Ticket,
          permission: 'entradas'
        },
        {
          title: 'Productos',
          path: '/dashboard/productos',
          icon: Package,
          permission: 'productos'
        },
        {
          title: 'Plantillas Productos',
          path: '/dashboard/plantillas-productos',
          icon: Gift,
          permission: 'plantillas_productos'
        },
        // { 
        //   title: 'Donaciones', 
        //   path: '/dashboard/donaciones', 
        //   icon: Gift,
        //   permission: 'entradas'
        // },
        {
          title: 'Comisiones',
          path: '/dashboard/comisiones',
          icon: Percent,
          permission: 'comisiones'
        },
        // { 
        //   title: 'Seguros', 
        //   path: '/dashboard/seguros', 
        //   icon: ShieldCheck,
        //   permission: 'seguros'
        // },
        // { 
        //   title: 'Envío', 
        //   path: '/dashboard/envio', 
        //   icon: Truck,
        //   permission: 'envio'
        // },
        {
          title: 'Eventos',
          path: '/dashboard/eventos',
          icon: Calendar,
          permission: 'eventos'
        },
        {
          title: 'Plantillas Precios',
          path: '/dashboard/plantillas-precios',
          icon: BarChart2,
          permission: 'plantillas_precios'
        },
        {
          title: 'Funciones',
          path: '/dashboard/funciones',
          icon: Trophy,
          permission: 'funciones'
        },
        {
          title: 'Cupos',
          path: '/dashboard/cupos',
          icon: Layers,
          permission: 'funciones'
        },
        {
          title: 'Plantillas Cupos',
          path: '/dashboard/plantillas-cupos',
          icon: BarChart2,
          permission: 'plantillas_precios'
        },
        {
          title: 'Paquetes',
          path: '/dashboard/paquetes',
          icon: Package,
          permission: 'paquetes'
        },
        // {
        //   title: 'Filas Virtuales',
        //   path: '/dashboard/filas-virtuales',
        //   icon: Layers,
        //   permission: 'funciones'
        // },
        // { 
        //   title: 'Paquetes', 
        //   path: '/dashboard/paquetes', 
        //   icon: Package,
        //   permission: 'paquetes'
        // },
        // { 
        //   title: 'Multipase', 
        //   path: '/dashboard/multipase', 
        //   icon: Ticket,
        //   permission: 'multipase'
        // },
        {
          title: 'Abonos',
          path: '/dashboard/abonos',
          icon: FileText,
          permission: 'abonos'
        },
        {
          title: 'Afiliados',
          path: '/dashboard/afiliados',
          icon: Users,
          permission: 'afiliados'
        },
        {
          title: 'IVA',
          path: '/dashboard/iva',
          icon: Coins,
          permission: 'iva'
        }
      ]
    },
    {
      title: 'Ventas',
      icon: Store,
      type: 'submenu',
      submenuId: 'sales',
      permission: 'boleteria', // Mostrar si tiene al menos uno de los permisos de ventas
      items: [
        {
          title: 'Transacciones',
          path: '/dashboard/transacciones',
          icon: CreditCard,
          permission: 'boleteria'
        },
        {
          title: 'Reportes',
          icon: PieChart,
          type: 'submenu',
          submenuId: 'reports-sales',
          permission: 'reportes',
          items: [
            {
              title: 'Reportes Detallados',
              path: '/dashboard/reportes',
              icon: PieChart,
              permission: 'reportes'
            },
            {
              title: 'Reportes Programados (acción rápida)',
              path: '/dashboard/scheduled-reports',
              icon: Mail,
              permission: 'reportes'
            }
          ]
        },
        {
          title: 'CRM',
          path: '/dashboard/crm',
          icon: Users,
          permission: 'crm'
        },
        {
          title: 'Tags',
          path: '/dashboard/tags',
          icon: Tags,
          permission: 'tags'
        },
        {
          title: 'Comunicación Masiva',
          path: '/dashboard/email-campaigns',
          icon: Mail,
          permission: 'email_campaigns'
        }
      ]
    },
    {
      title: 'Configuración',
      icon: Settings,
      type: 'submenu',
      submenuId: 'config',
      permission: 'settings', // Mostrar si tiene al menos uno de los permisos de configuración
      items: [
        {
          title: 'Configuración',
          path: '/dashboard/settings',
          icon: Settings,
          permission: 'settings'
        },
        {
          title: 'Web Studio',
          path: '/dashboard/webstudio',
          icon: Settings,
          permission: 'webstudio'
        },
        {
          title: 'Configuración Asientos',
          path: '/dashboard/seat-settings',
          icon: Settings,
          permission: 'seat_settings'
        },
        {
          title: 'Configuración Impresora',
          path: '/dashboard/printer-settings',
          icon: Printer,
          permission: 'printer_settings'
        },
        {
          title: 'Configuración Email',
          path: '/dashboard/email-config',
          icon: Mail,
          permission: 'email_config'
        },
        {
          title: 'Logs de Auditoría',
          path: '/dashboard/audit-logs',
          icon: FileText,
          permission: 'audit_logs'
        },
        {
          title: 'Gestión Reembolsos',
          path: '/dashboard/refund-management',
          icon: RotateCcw,
          permission: 'refund_management'
        },
        {
          title: 'Analytics de Pagos',
          path: '/dashboard/payment-analytics',
          icon: BarChart2,
          permission: 'payment_analytics'
        },
        {
          title: 'Pasarelas de Pago',
          path: '/dashboard/payment-gateways',
          icon: CreditCard,
          permission: 'payment_gateways'
        }
      ]
    },
    {
      title: 'Personalización',
      icon: Settings,
      type: 'submenu',
      submenuId: 'personalization',
      permission: 'personalizacion',
      items: [
        {
          title: 'Formatos de entrada',
          path: '/dashboard/formato-entrada',
          icon: Ticket,
          permission: 'formato_entrada'
        },
        {
          title: 'Textos legales',
          path: '/dashboard/legal-texts',
          icon: FileText,
          permission: 'legal_texts'
        },

        {
          title: 'Configuración de Asientos',
          path: '/dashboard/seat-settings',
          icon: Settings,
          permission: 'seat_settings'
        },
        {
          title: 'Configuración de Correo',
          path: '/dashboard/email-config',
          icon: Mail,
          permission: 'email_config'
        },
        {
          title: 'Páginas',
          path: '/dashboard/pages',
          icon: FileText,
          permission: 'pages'
        },
        {
          title: 'Colores Web',
          path: '/dashboard/webcolors',
          icon: Settings,
          permission: 'webcolors'
        }
      ]
    },
    {
      title: 'Boletería',
      path: '/dashboard/boleteria',
      icon: Ticket,
      type: 'link',
      permission: 'boleteria'
    }
  ];

  // Agregar menú SaaS solo para usuarios del sistema
  if (hasPermission('saas')) {
    mainMenuItems.push({
      title: 'SaaS',
      icon: Cloud,
      type: 'submenu',
      submenuId: 'saas',
      permission: 'saas',
      items: [
        {
          title: 'Dashboard SaaS',
          path: '/dashboard/saas',
          icon: PieChart,
          permission: 'saas'
        },
        {
          title: 'Usuarios del Sistema',
          path: '/dashboard/saas/users',
          icon: Users,
          permission: 'saas_roles'
        },
        {
          title: 'Configuración',
          path: '/dashboard/saas/settings',
          icon: Settings,
          permission: 'saas_settings'
        },
        {
          title: 'Facturación',
          path: '/dashboard/saas/billing',
          icon: Banknote,
          permission: 'saas_billing'
        },
        {
          title: 'Pasarelas de Pago',
          path: '/dashboard/saas/payment-gateways',
          icon: CreditCard,
          permission: 'saas_payment_gateways'
        },
        {
          title: 'Gestión de Roles',
          path: '/dashboard/saas/roles',
          icon: ShieldCheck,
          permission: 'saas_roles'
        },
        {
          title: 'API Explorer',
          path: '/dashboard/saas/api-explorer',
          icon: Code,
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
  const transformToMenuItems = (items) => items.map(item => {
    const Icon = item.icon;
    if (item.type === 'submenu') {
      return {
        key: item.submenuId,
        icon: <Icon size={16} />,
        label: item.title,
        children: transformToMenuItems(item.items || [])
      };
    }

    return {
      key: item.path,
      icon: <Icon size={16} />,
      label: item.title,
      onClick: () => handleMenuClick(item.path)
    };
  });

  const menuItems = transformToMenuItems(filteredMenuItems);

  // Handler para clicks en el menú (para Drawer)
  const findMenuItemByKey = (items, key) => {
    for (const item of items) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findMenuItemByKey(item.children, key);
        if (found) return found;
      }
    }

    return null;
  };

  const handleMenuClickWrapper = ({ key }) => {
    const item = findMenuItemByKey(menuItems, key);
    if (item?.onClick) {
      item.onClick();
    }
  };

  const isExpanded = !collapsed || temporaryExpanded || asDrawer;

  // Contenido del menú (reutilizable)
  const menuContent = (
    <>
      {/* Header del Sidebar */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Ticket className="text-white w-4 h-4" />
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
                <Users className="text-white w-3 h-3" />
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
          onMouseEnter={asDrawer ? undefined : handleTemporaryExpansion}
          onMouseLeave={asDrawer ? undefined : keepExpanded}
          onClick={handleMenuClickWrapper}
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
    </>
  );

  // Si es para Drawer, retornar solo el contenido
  if (asDrawer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {menuContent}
      </div>
    );
  }

  // Si no, retornar el Sider completo
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={!isExpanded}
      width={250}
      collapsedWidth={80}
      className="bg-white shadow-lg mobile-sidebar"
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
      {menuContent}
    </Sider>
  );
};

export default SidebarMenuWithRoles;


