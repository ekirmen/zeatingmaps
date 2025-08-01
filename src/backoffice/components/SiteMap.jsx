import React from 'react';
import { AiOutlineClose, AiOutlineFile, AiOutlineFolder } from 'react-icons/ai';

const SiteMap = ({ onClose }) => {
  const siteMapData = [
    {
      name: 'Páginas Principales',
      type: 'folder',
      children: [
        { name: 'Home', url: '/', type: 'page' },
        { name: 'Eventos', url: '/events', type: 'page' },
        { name: 'Búsqueda', url: '/search', type: 'page' },
        { name: 'Contacto', url: '/contact', type: 'page' },
        { name: 'Acerca de', url: '/about', type: 'page' }
      ]
    },
    {
      name: 'Sistema de Usuarios',
      type: 'folder',
      children: [
        { name: 'Registro', url: '/signup', type: 'page' },
        { name: 'Login', url: '/login', type: 'page' },
        { name: 'Panel de Usuario', url: '/user-panel', type: 'page' },
        { name: 'Editar Perfil', url: '/edit-profile', type: 'page' },
        { name: 'Mis Tickets', url: '/my-tickets', type: 'page' }
      ]
    },
    {
      name: 'Proceso de Compra',
      type: 'folder',
      children: [
        { name: 'Selección de Evento', url: '/event/:id', type: 'page' },
        { name: 'Selección de Asientos', url: '/seats/:eventId', type: 'page' },
        { name: 'Carrito', url: '/cart', type: 'page' },
        { name: 'Checkout', url: '/checkout', type: 'page' },
        { name: 'Confirmación', url: '/confirmation', type: 'page' },
        { name: 'Gracias', url: '/thank-you', type: 'page' }
      ]
    },
    {
      name: 'Información',
      type: 'folder',
      children: [
        { name: 'FAQ', url: '/faq', type: 'page' },
        { name: 'Términos y Condiciones', url: '/terms', type: 'page' },
        { name: 'Política de Privacidad', url: '/privacy', type: 'page' },
        { name: 'Ayuda', url: '/help', type: 'page' },
        { name: 'Mapa del Sitio', url: '/sitemap', type: 'page' }
      ]
    },
    {
      name: 'Eventos Específicos',
      type: 'folder',
      children: [
        { name: 'Landing de Evento', url: '/event-landing/:id', type: 'page' },
        { name: 'Calendario', url: '/calendar', type: 'page' },
        { name: 'Galería', url: '/gallery', type: 'page' },
        { name: 'Blog', url: '/blog', type: 'page' },
        { name: 'Newsletter', url: '/newsletter', type: 'page' }
      ]
    }
  ];

  const renderTreeItem = (item, level = 0) => {
    const paddingLeft = level * 20;
    
    if (item.type === 'folder') {
      return (
        <div key={item.name} style={{ paddingLeft }}>
          <div className="flex items-center gap-2 py-1 hover:bg-gray-100 rounded">
            <AiOutlineFolder className="text-blue-500" />
            <span className="font-medium text-gray-700">{item.name}</span>
          </div>
          {item.children && (
            <div className="ml-4">
              {item.children.map(child => renderTreeItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={item.name} style={{ paddingLeft }}>
          <div className="flex items-center gap-2 py-1 hover:bg-gray-100 rounded">
            <AiOutlineFile className="text-gray-500" />
            <span className="text-gray-600">{item.name}</span>
            <span className="text-xs text-gray-400 ml-auto">{item.url}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] mx-4 overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Mapa del Sitio
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <AiOutlineClose className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto h-full">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Esta es la estructura completa del sitio web. Aquí puedes ver todas las páginas organizadas por categorías.
            </p>
          </div>
          
          <div className="space-y-2">
            {siteMapData.map(item => renderTreeItem(item))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Estadísticas del Sitio</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Total de Páginas:</span>
                <span className="ml-2">25</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Categorías:</span>
                <span className="ml-2">5</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Páginas del Sistema:</span>
                <span className="ml-2">18</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Páginas de Usuario:</span>
                <span className="ml-2">14</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteMap; 