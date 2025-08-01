import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faCalendar,
  faFileAlt,
  faTicketAlt,
  faChevronDown,
  faChevronUp,
  faShoppingCart,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

const SidebarMenu = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();

  // Oculta el sidebar en rutas específicas
  if (location.pathname.startsWith('/dashboard/Boleteria')||
      location.pathname.startsWith('/dashboard/crear-mapa')) {
    return null;
  }

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-6">Tickera</h2>
      <ul className="space-y-2">
        <li>
          <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded hover:bg-gray-700">
            <FontAwesomeIcon icon={faHome} />
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Actividad */}
        <li>
          <div onClick={() => toggleMenu('actividad')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} />
              Actividad
            </span>
            <FontAwesomeIcon icon={openMenu === 'actividad' ? faChevronUp : faChevronDown} />
          </div>
          {openMenu === 'actividad' && (
            <ul className="ml-4 mt-1 space-y-1">
              <li>
                <Link to="/dashboard/Actividad" className="block p-2 rounded hover:bg-gray-700">Detalles</Link>
              </li>
            </ul>
          )}
        </li>

        {/* Administración */}
        <li>
          <div onClick={() => toggleMenu('admin')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} />
              Administración
            </span>
            <FontAwesomeIcon icon={openMenu === 'admin' ? faChevronUp : faChevronDown} />
          </div>
          {openMenu === 'admin' && (
            <ul className="ml-4 mt-1 space-y-1">
              <li><Link to="/dashboard/Recinto" className="block p-2 rounded hover:bg-gray-700">Recinto</Link></li>
              <li><Link to="/dashboard/Plano" className="block p-2 rounded hover:bg-gray-700">Plano</Link></li>
              <li><Link to="/dashboard/Usuarios" className="block p-2 rounded hover:bg-gray-700">Usuarios</Link></li>
              <li><Link to="/dashboard/Referidos" className="block p-2 rounded hover:bg-gray-700">Referidos</Link></li>
            </ul>
          )}
        </li>

        {/* Programación */}
        <li>
          <div onClick={() => toggleMenu('programacion')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTicketAlt} />
              Programación
            </span>
            <FontAwesomeIcon icon={openMenu === 'programacion' ? faChevronUp : faChevronDown} />
          </div>
          {openMenu === 'programacion' && (
            <ul className="ml-4 mt-1 space-y-1">
              <li><Link to="/dashboard/Entrada" className="block p-2 rounded hover:bg-gray-700">Entrada</Link></li>
              <li><Link to="/dashboard/Evento" className="block p-2 rounded hover:bg-gray-700">Evento</Link></li>
              <li><Link to="/dashboard/crear-iva" className="block p-2 rounded hover:bg-gray-700">Crear IVA</Link></li>
              <li><Link to="/dashboard/plantillaPrecios" className="block p-2 rounded hover:bg-gray-700">Plantillas de Precios</Link></li>
              <li><Link to="/dashboard/descuentos" className="block p-2 rounded hover:bg-gray-700">Descuentos</Link></li>
              <li><Link to="/dashboard/funciones" className="block p-2 rounded hover:bg-gray-700">Funciones</Link></li>
              <li><Link to="/dashboard/abonos" className="block p-2 rounded hover:bg-gray-700">Abonos</Link></li>
            </ul>
          )}
        </li>

        {/* CRM */}
        <li>
          <div onClick={() => toggleMenu('crm')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} />
              CRM
            </span>
            <FontAwesomeIcon icon={openMenu === 'crm' ? faChevronUp : faChevronDown} />
          </div>
                      {openMenu === 'crm' && (
              <ul className="ml-4 mt-1 space-y-1">
                <li><Link to="/dashboard/crm" className="block p-2 rounded hover:bg-gray-700">Campaña Email</Link></li>
                <li><Link to="/dashboard/email-campaigns" className="block p-2 rounded hover:bg-gray-700">Campañas de Mailing</Link></li>
              </ul>
            )}
        </li>

        {/* Personalización */}
        <li>
          <div onClick={() => toggleMenu('personalizacion')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFileAlt} />
              Personalización
            </span>
            <FontAwesomeIcon icon={openMenu === 'personalizacion' ? faChevronUp : faChevronDown} />
          </div>
          {openMenu === 'personalizacion' && (
            <ul className="ml-4 mt-1 space-y-1">
              <li><Link to="/dashboard/tags" className="block p-2 rounded hover:bg-gray-700">Tags</Link></li>
              <li><Link to="/dashboard/galeria" className="block p-2 rounded hover:bg-gray-700">Galeria</Link></li>
              <li><Link to="/dashboard/formato-entrada" className="block p-2 rounded hover:bg-gray-700">Formato de Entrada</Link></li>
              <li><Link to="/dashboard/correo" className="block p-2 rounded hover:bg-gray-700">Correo</Link></li>
              <li><Link to="/dashboard/web-studio" className="block p-2 rounded hover:bg-gray-700">Web Studio</Link></li>
              <li><Link to="/dashboard/colores-web" className="block p-2 rounded hover:bg-gray-700">Colores Web</Link></li>
              <li><Link to="/dashboard/cabecera" className="block p-2 rounded hover:bg-gray-700">Cabecera</Link></li>
              <li><Link to="/dashboard/sitio-web" className="block p-2 rounded hover:bg-gray-700">Sitio web</Link></li>
              <li><Link to="/dashboard/firebase-config" className="block p-2 rounded hover:bg-gray-700">Firebase configuración</Link></li>
            </ul>
          )}
        </li>

        {/* Boleteria */}
        <li>
          <div onClick={() => toggleMenu('boleteria')} className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingCart} />
              Boleteria
            </span>
            <FontAwesomeIcon icon={openMenu === 'boleteria' ? faChevronUp : faChevronDown} />
          </div>
          {openMenu === 'boleteria' && (
            <ul className="ml-4 mt-1 space-y-1">
              <li><Link to="/dashboard/Boleteria" className="block p-2 rounded hover:bg-gray-700">Venta de Tickets</Link></li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
