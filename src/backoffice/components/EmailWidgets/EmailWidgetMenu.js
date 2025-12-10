import React from 'react';

const EmailWidgetMenu = ({ onSelectWidget }) => {
  const widgetCategories = [
    {
      name: 'Elementos Básicos',
      icon: '📝',
      widgets: [
        { id: 'titulo', name: 'Título', description: 'Título principal para emails' },
        { id: 'subtitulo', name: 'Subtítulo', description: 'Subtítulo para emails' },
        { id: 'paragraph', name: 'Paragraph', description: 'Párrafo de texto para emails' }
      ]
    },
    {
      name: 'Elementos Visuales',
      icon: '🖼️',
      widgets: [
        { id: 'banner', name: 'Banner', description: 'Banner para emails con imagen' },
        { id: 'separador', name: 'Separador', description: 'Separador visual para emails' }
      ]
    },
    {
      name: 'Elementos de Eventos',
      icon: '🎫',
      widgets: [
        { id: 'informacion-evento', name: 'Información del evento', description: 'Información detallada del evento' },
        { id: 'banner-grande', name: 'Evento dinámico banner grande', description: 'Banner grande dinámico para eventos' },
        { id: 'banner-mediano', name: 'Evento dinámico banner mediano', description: 'Banner mediano dinámico para eventos' }
      ]
    },
    {
      name: 'Elementos de Navegación',
      icon: '🔘',
      widgets: [
        { id: 'boton', name: 'Botón', description: 'Botón para emails con múltiples tipos' }
      ]
    },
    {
      name: 'Elementos Estructurales',
      icon: '📧',
      widgets: [
        { id: 'cabecera-email', name: 'Cabecera email', description: 'Cabecera para emails' },
        { id: 'pie-email', name: 'Pie email', description: 'Pie de página para emails' },
        { id: 'pie-email-notificacion', name: 'Pie email notificación', description: 'Pie de página con notificaciones' }
      ]
    },
    {
      name: 'Elementos Personalizados',
      icon: '💻',
      widgets: [
        { id: 'codigo-html', name: 'Código HTML', description: 'Código HTML personalizado para emails' }
      ]
    }
  ];

  const getWidgetType = (widgetId) => {
    const widgetMap = {
      'titulo': 'Título',
      'subtitulo': 'Subtítulo',
      'paragraph': 'Paragraph',
      'banner': 'Banner',
      'separador': 'Separador',
      'informacion-evento': 'Información del evento',
      'banner-grande': 'Evento dinámico banner grande',
      'banner-mediano': 'Evento dinámico banner mediano',
      'boton': 'Botón',
      'cabecera-email': 'Cabecera email',
      'pie-email': 'Pie email',
      'pie-email-notificacion': 'Pie email notificación',
      'codigo-html': 'Código HTML'
    };
    return widgetMap[widgetId] || widgetId;
  };

  return (
    <div className="email-widget-menu">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Widgets de Email
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona un widget para agregarlo a tu plantilla de email
        </p>
      </div>

      <div className="space-y-6">
        {widgetCategories.map((category) => (
          <div key={category.name} className="widget-category">
            <div className="flex items-center mb-3">
              <span className="text-xl mr-2">{category.icon}</span>
              <h4 className="text-md font-medium text-gray-700">
                {category.name}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {category.widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => onSelectWidget(getWidgetType(widget.id))}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">
                    {widget.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {widget.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailWidgetMenu; 
