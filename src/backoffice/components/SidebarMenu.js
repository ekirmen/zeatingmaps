import React, { useState } from 'react';
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
  faClipboardList,
  faPrint,
  faCrown,
  faGift,
  faQrcode,
  faClipboardCheck,
  faIdCard,
  faPoll,
  faBullhorn,
  faShieldAlt,
  faTruck,
  faBox,
  faTicketStar,
  faCalendar,
  faUsersCog,
  faCog as faSettings,
  faFileInvoice,
  faMoneyBillWave,
  faChartPie,
  faFileAlt as faReports,
  faPalette as faPersonalization,
  faAd,
  faCookie,
  faSparkles,
  faLegal,
  faGiftCard,
  faInvitation,
  faLoyalty,
  faGroup,
  faFanId,
  faSurvey,
  faCampaign,
  faTag,
  faVerified,
  faAccreditation,
  faQueue,
  faPackage,
  faMultipass,
  faSeasonTicket,
  faHeart,
  faShield,
  faTruck as faShipping,
  faCreditCard as faFee,
  faChartBar as faQuota,
  faFileAlt as faQuotaTemplate,
  faBox as faBundle,
  faTicketAlt as faMultiPass,
  faCalendarAlt as faSeasonTickets,
  faHandHoldingHeart,
  faShieldAlt as faInsurance,
  faTruck as faShippingIcon,
  faCreditCard as faFeeIcon,
  faChartBar as faQuotaIcon,
  faFileAlt as faQuotaTemplateIcon,
  faBox as faBundleIcon,
  faTicketAlt as faMultiPassIcon,
  faCalendarAlt as faSeasonTicketsIcon,
  faCheckCircle,
  faSearch,
  faBell,
  
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EventSearch from './EventSearch';

const SidebarMenu = ({ collapsed }) => {
  const location = useLocation();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [temporaryExpanded, setTemporaryExpanded] = useState(false);

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  const toggleSubmenu = (submenuId) => {
    setActiveSubmenu(activeSubmenu === submenuId ? null : submenuId);
  };

  const mainMenuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: faHome,
      type: 'link'
    },
    {
      title: 'Actividad',
      path: '/dashboard/actividad',
      icon: faChartLine,
      type: 'link'
    },
    {
      title: 'Administración',
      icon: faCogs,
      type: 'submenu',
      submenuId: 'admin',
      items: [
        { title: 'Recintos', path: '/dashboard/recintos', icon: faBuilding },
        { title: 'Plano', path: '/dashboard/plano', icon: faMap },
        { title: 'Usuarios', path: '/dashboard/usuarios', icon: faUsers },
        { title: 'Liquidaciones', path: '/dashboard/liquidaciones', icon: faMoneyBillWave }
      ]
    },
    {
      title: 'Programación',
      icon: faCalendarAlt,
      type: 'submenu',
      submenuId: 'scheduling',
      items: [
        { title: 'Entradas', path: '/dashboard/entradas', icon: faTicketAlt },
        { title: 'Productos', path: '/dashboard/productos', icon: faBox },
        { title: 'Plantillas de Productos', path: '/dashboard/plantillas-productos', icon: faBox },
        // { title: 'Donaciones', path: '/dashboard/donaciones', icon: faHandHoldingHeart }, // OCULTO
        { title: 'Comisiones y tasas', path: '/dashboard/comisiones', icon: faCreditCard },
        // { title: 'Seguros', path: '/dashboard/seguros', icon: faShieldAlt }, // OCULTO
        // { title: 'Envío a domicilio', path: '/dashboard/envio', icon: faTruck }, // OCULTO
        { title: 'Eventos', path: '/dashboard/eventos', icon: faTicketAlt },
        { title: 'Plantillas de precios', path: '/dashboard/plantillas-precios', icon: faPercent },
        { title: 'Funciones', path: '/dashboard/funciones', icon: faCalendar },
        // { title: 'Cupos', path: '/dashboard/cupos', icon: faChartBar }, // OCULTO
        // { title: 'Plantillas de cupos', path: '/dashboard/plantillas-cupos', icon: faFileAlt }, // OCULTO
        // { title: 'Filas virtuales', path: '/dashboard/filas-virtuales', icon: faUsers }, // OCULTO
        // { title: 'Paquetes', path: '/dashboard/paquetes', icon: faBox }, // OCULTO
        // { title: 'Multipase', path: '/dashboard/multipase', icon: faTicketAlt }, // OCULTO
        { title: 'Abonos', path: '/dashboard/abonos', icon: faCalendarAlt }
      ]
    },
    {
      title: 'CRM',
      icon: faUsersCog,
      type: 'submenu',
      submenuId: 'crm',
      items: [
        { title: 'Clientes', path: '/dashboard/clientes', icon: faUsers },
        { title: 'Mailchimp', path: '/dashboard/mailchimp', icon: faEnvelope },
        { title: 'Formularios', path: '/dashboard/formularios', icon: faFileAlt },
        { title: 'Notificaciones', path: '/dashboard/notificaciones', icon: faBell },
        // { title: 'Fan ID', path: '/dashboard/fanid', icon: faIdCard }, // OCULTO
        { title: 'Encuestas', path: '/dashboard/encuestas', icon: faPoll },
        { title: 'Campañas de mailing', path: '/dashboard/email-campaigns', icon: faEnvelope },
        { title: 'Etiquetas', path: '/dashboard/tags', icon: faTag }
      ]
    },
    // {
    //   title: 'Acreditaciones',
    //   icon: faIdCard,
    //   type: 'submenu',
    //   submenuId: 'accreditations',
    //   items: [
    //     { title: 'Eventos de acreditación', path: '/dashboard/accreditation-management', icon: faClipboardCheck },
    //     { title: 'Acreditaciones', path: '/dashboard/accreditations', icon: faCheckCircle }
    //   ]
    // }, // OCULTO
    // {
    //   title: 'Promociones',
    //   icon: faGift,
    //   type: 'submenu',
    //   submenuId: 'promos',
    //   items: [
    //     { title: 'Códigos promocionales', path: '/dashboard/promos', icon: faTicketAlt },
    //     { title: 'Tarjetas regalo', path: '/dashboard/gift-cards', icon: faGift },
    //     { title: 'Invitaciones', path: '/dashboard/invitations', icon: faEnvelope },
    //     { title: 'Programas de fidelización', path: '/dashboard/loyalty-clubs', icon: faCrown },
    //     { title: 'Compra compartida', path: '/dashboard/group-promotions', icon: faUsers }
    //   ]
    // }, // OCULTO
    {
      title: 'Informes',
      path: '/dashboard/reports',
      icon: faFileAlt,
      type: 'link'
    },
    {
      title: 'Personalización',
      icon: faPalette,
      type: 'submenu',
      submenuId: 'personalization',
      items: [
        // { title: 'Sitios web', path: '/dashboard/sites', icon: faGlobe }, // OCULTO
        { title: 'Formatos de entrada', path: '/dashboard/formato-entrada', icon: faTicketAlt },
        // { title: 'Banners de publicidad', path: '/dashboard/banner-ads', icon: faImage }, // OCULTO
        { title: 'Textos legales', path: '/dashboard/legal-texts', icon: faFileAlt },
        { title: 'Web Studio', path: '/dashboard/webstudio', icon: faPalette },
        { title: 'Páginas', path: '/dashboard/pages', icon: faFileAlt }
        // { title: 'Repositorio de imágenes', path: '/dashboard/galeria', icon: faImage } // OCULTO
      ]
    },
    {
      title: 'Boletería',
      path: '/dashboard/boleteria',
      icon: faTicketAlt,
      type: 'link'
    },
    {
      title: 'Panel SaaS',
      icon: faGlobe,
      type: 'submenu',
      submenuId: 'saas',
      items: [
        { title: 'Dashboard SaaS', path: '/dashboard/saas', icon: faChartBar },
        { title: 'Configuración', path: '/dashboard/saas/settings', icon: faCog }
      ]
    }
  ];

  const renderMenuItem = (item) => {
    if (item.type === 'link') {
      return (
        <Link
          key={item.title}
          to={item.path}
          className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
            isActive(item.path) ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' : ''
          }`}
          onClick={() => {
            if (collapsed) {
              setTemporaryExpanded(true);
              setTimeout(() => setTemporaryExpanded(false), 3000);
            }
          }}
        >
          <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />
          {(!collapsed || temporaryExpanded) && <span>{item.title}</span>}
        </Link>
      );
    }

    if (item.type === 'submenu') {
      return (
        <div key={item.title}>
          <button
            onClick={() => {
              if (collapsed) {
                setTemporaryExpanded(true);
                setTimeout(() => setTemporaryExpanded(false), 3000);
              }
              toggleSubmenu(item.submenuId);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
              activeSubmenu === item.submenuId ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <div className="flex items-center">
              <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />
              {(!collapsed || temporaryExpanded) && <span>{item.title}</span>}
            </div>
            {(!collapsed || temporaryExpanded) && (
              <FontAwesomeIcon 
                icon={activeSubmenu === item.submenuId ? 'chevron-down' : 'chevron-right'} 
                className="w-4 h-4 transition-transform"
              />
            )}
          </button>
          
          {activeSubmenu === item.submenuId && (!collapsed || temporaryExpanded) && (
            <div className="bg-gray-50">
              {item.items.map((subItem) => (
                <Link
                  key={subItem.title}
                  to={subItem.path}
                  className={`flex items-center px-8 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    isActive(subItem.path) ? 'bg-blue-100 text-blue-600' : ''
                  }`}
                  onClick={() => {
                    if (collapsed) {
                      setTemporaryExpanded(true);
                      setTimeout(() => setTemporaryExpanded(false), 3000);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={subItem.icon} className="w-4 h-4 mr-3" />
                  <span>{subItem.title}</span>
                </Link>
              ))}
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
    <div className={`bg-white shadow-lg ${(collapsed && !temporaryExpanded) ? 'w-16' : 'w-64'} transition-all duration-300`}>
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
