import React, { useState } from 'react';
import { Eye, Smartphone, Monitor } from 'lucide-react';

const EmailPreview = ({ widgets = [], config = {} }) => {
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [showPreview, setShowPreview] = useState(false);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Título':
        return (
          <div className="email-widget-title" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {widget.config?.texto || 'Título del email'}
          </div>
        );

      case 'Subtítulo':
        return (
          <div className="email-widget-subtitle" style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            {widget.config?.texto || 'Subtítulo del email'}
          </div>
        );

      case 'Paragraph':
        return (
          <div className="email-widget-paragraph" style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#333',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {widget.config?.texto || 'Contenido del párrafo...'}
          </div>
        );

      case 'Banner':
        return (
          <div className="email-widget-banner" style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {widget.config?.imagen && (
              <img
                src={widget.config.imagen}
                alt="Banner"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            )}
            <div style={{ display: 'none', padding: '40px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
              Imagen no disponible
            </div>
            {widget.config?.texto && (
              <div style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#666'
              }}>
                {widget.config.texto}
              </div>
            )}
          </div>
        );

      case 'Botón':
        const buttonStyle = {
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '600',
          marginTop: widget.config?.margin_top || 10,
          marginBottom: widget.config?.margin_bottom || 10,
          textAlign: 'center'
        };

        const getButtonText = () => {
          if (widget.config?.textButton) return widget.config.textButton;

          switch (widget.config?.buttonType) {
            case '0': return 'Comprar ahora';
            case '1': return 'Invitación';
            case '2': return 'Renovar abono';
            case '3': return 'Visitar sitio';
            default: return 'Hacer clic';
          }
        };

        return (
          <div className="email-widget-button" style={{ textAlign: 'center' }}>
            <a href="#" style={buttonStyle}>
              {getButtonText()}
            </a>
          </div>
        );

      case 'Información del evento':
        return (
          <div className="email-widget-event-info" style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Información del Evento</h4>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              ID del evento: {widget.config?.eventoId || 'No especificado'}
            </p>
          </div>
        );

      case 'Código HTML':
        return (
          <div className="email-widget-html"
            dangerouslySetInnerHTML={{
              __html: widget.config?.html || '<div>Contenido HTML personalizado</div>'
            }}
            style={{ marginBottom: '16px' }}
          />
        );

      default:
        return (
          <div className="email-widget-unknown" style={{
            padding: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#666'
          }}>
            Widget no reconocido: {widget.type}
          </div>
        );
    }
  };

  const containerStyle = {
    maxWidth: previewMode === 'mobile' ? '375px' : '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e0e0'
  };

  return (
    <div className="email-preview-container">
      {/* Preview Controls */}
      <div className="preview-controls" style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div className="preview-mode-toggle" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPreviewMode('desktop')}
            style={{
              padding: '8px 12px',
              backgroundColor: previewMode === 'desktop' ? '#007bff' : '#e9ecef',
              color: previewMode === 'desktop' ? 'white' : '#495057',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Monitor />
            Desktop
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            style={{
              padding: '8px 12px',
              backgroundColor: previewMode === 'mobile' ? '#007bff' : '#e9ecef',
              color: previewMode === 'mobile' ? 'white' : '#495057',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Smartphone />
            Mobile
          </button>
        </div>

        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            padding: '8px 16px',
            backgroundColor: showPreview ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Eye />
          {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
        </button>
      </div>

      {/* Email Preview */}
      {showPreview && (
        <div className="email-preview" style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          minHeight: '400px'
        }}>
          <div style={containerStyle}>
            {/* Email Header */}
            <div className="email-header" style={{
              textAlign: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ margin: '0', color: '#333' }}>📧 Email Preview</h2>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                Vista previa en tiempo real
              </p>
            </div>

            {/* Widgets Content */}
            <div className="email-content">
              {widgets.length > 0 ? (
                widgets.map((widget, index) => (
                  <div key={index} className="widget-container">
                    {renderWidget(widget)}
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  No hay widgets configurados. Agrega widgets para ver la vista previa.
                </div>
              )}
            </div>

            {/* Email Footer */}
            <div className="email-footer" style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
              fontSize: '12px',
              color: '#999'
            }}>
              <p>Este es un email generado automáticamente</p>
              <p>© 2024 Kreatickets. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPreview; 
