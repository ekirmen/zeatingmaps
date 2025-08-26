import React, { useState } from 'react';
import { message, Button, Space, Tooltip } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import downloadTicket from '../../../utils/downloadTicket';

const DownloadTicketButton = ({ locator, showDebugButtons = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleDownload = async () => {
    setIsLoading(true);
    try {
      // Probar descarga simple sin autenticación
      const response = await fetch(`/api/payments/${locator}/download-simple`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('Content-Type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error(`Content-Type inválido: ${contentType}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-prueba-${locator}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [SIMPLE-TEST] Descarga simple exitosa');
      message.success('✅ Descarga simple funcionando correctamente');
      
    } catch (error) {
      console.error('❌ [SIMPLE-TEST] Error en descarga simple:', error);
      message.error('❌ Error en descarga simple: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!locator) {
      message.error('ID de ticket no válido');
      return;
    }

    setIsLoading(true);
    try {
      await downloadTicket(locator);
      message.success('Ticket descargado con éxito');
    } catch (err) {
      console.error('Error:', err);
      message.error('Fallo en la descarga: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Botón principal de descarga */}
      <Button 
        type="primary" 
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        loading={isLoading}
        block
        style={{ marginBottom: showDebugButtons ? '10px' : '0' }}
      >
        Descargar Ticket
      </Button>
      
      {/* Botón de debug (solo se muestra si showDebugButtons es true) */}
      {showDebugButtons && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tooltip title="Probar descarga sin autenticación">
            <Button 
              icon={<FileTextOutlined />}
              onClick={testSimpleDownload}
              disabled={isLoading}
              size="small"
              block
            >
              Test Descarga Simple
            </Button>
          </Tooltip>
          
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            <strong>Funciones disponibles:</strong><br/>
            • Descarga principal con autenticación<br/>
            • Descarga simple para testing
          </div>
        </Space>
      )}
    </div>
  );
};

export default DownloadTicketButton;
