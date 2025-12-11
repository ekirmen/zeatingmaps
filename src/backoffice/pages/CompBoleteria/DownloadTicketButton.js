import React, { useState } from 'react';
import { message, Button, Space, Tooltip } from '../../../utils/antdComponents';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import downloadTicket from '../../../utils/downloadTicket';
import { buildRelativeApiUrl, checkApiConnectivity } from '../../../utils/apiConfig';

const DownloadTicketButton = ({ locator, showDebugButtons = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleDownload = async () => {
    setIsLoading(true);
    try {
      // Probar descarga simple sin autenticaci³n
      const url = buildRelativeApiUrl(`payments/${locator}/download?mode=simple`);
      // Verificar conectividad antes de la descarga
      const connectivityResult = await checkApiConnectivity();

      if (!connectivityResult.success) {
        console.error('Œ [TEST] Problema de conectividad detectado:', connectivityResult.error);

        return;
      }
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error(`Content-Type inv¡lido: ${contentType}`);
      }

      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `ticket-prueba-${locator}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      message.success('œ… Descarga simple funcionando correctamente');

    } catch (error) {
      console.error('Œ [SIMPLE-TEST] Error en descarga simple:', error);

      // Detectar tipos espec­ficos de errores
      if (error.message.includes('Failed to fetch')) {
        console.error('Œ [SIMPLE-TEST] Error de red detectado - posible problema de variables de entorno en Vercel');
        message.error('Œ Error de red - verificar variables de entorno en Vercel');
      } else if (error.message.includes('NetworkError')) {
        console.error('Œ [SIMPLE-TEST] Error de red - verificar conectividad');
        message.error('Œ Error de red - verificar conectividad');
      } else {
        message.error('Œ Error en descarga simple: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!locator) {
      message.error('ID de ticket no v¡lido');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar conectividad antes de la descarga
      const connectivityResult = await checkApiConnectivity();

      if (!connectivityResult.success) {
        console.error('Œ [DOWNLOAD] Problema de conectividad detectado:', connectivityResult.error);
        message.error('Problema de conectividad: ' + connectivityResult.error);
        return;
      }
      await downloadTicket(locator);
      message.success('Ticket descargado con ©xito');
    } catch (err) {
      console.error('Œ [DOWNLOAD] Error en descarga principal:', err);

      // Detectar tipos espec­ficos de errores
      if (err.message.includes('Failed to fetch')) {
        console.error('Œ [DOWNLOAD] Error de red detectado - posible problema de variables de entorno en Vercel');
        message.error('Œ Error de red - verificar variables de entorno en Vercel');
      } else if (err.message.includes('NetworkError')) {
        console.error('Œ [DOWNLOAD] Error de red - verificar conectividad');
        message.error('Œ Error de red - verificar conectividad');
      } else if (err.message.includes('Server returned HTML')) {
        console.error('Œ [DOWNLOAD] Servidor devuelve HTML - variables de entorno no configuradas en Vercel');
        message.error('Œ Variables de entorno no configuradas en Vercel');
      } else {
        message.error('Fallo en la descarga: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Bot³n principal de descarga */}
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

      {/* Bot³n de debug (solo se muestra si showDebugButtons es true) */}
      {showDebugButtons && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tooltip title="Probar descarga sin autenticaci³n">
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
            -¢ Descarga principal con autenticaci³n<br/>
            -¢ Descarga simple para testing<br/>
            -¢ Verificaci³n de conectividad autom¡tica<br/>
            -¢ Logs detallados en consola<br/>
            <br/>
            <strong>Debug:</strong> Abre la consola (F12) para ver logs detallados
          </div>
        </Space>
      )}
    </div>
  );
};

export default DownloadTicketButton;


