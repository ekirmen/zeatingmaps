import React, { useState } from 'react';
import { message, Button, Space, Tooltip } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import downloadTicket from '../../../utils/downloadTicket';
import { buildRelativeApiUrl, checkApiConnectivity } from '../../../utils/apiConfig';

const DownloadTicketButton = ({ locator, showDebugButtons = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const testSimpleDownload = async () => {
    setIsLoading(true);
    try {
      // Probar descarga simple sin autenticación
      const url = buildRelativeApiUrl(`payments/${locator}/download?mode=simple`);
      console.log('🧪 [TEST] Probando descarga simple en:', url);
      
      // Verificar conectividad antes de la descarga
      console.log('🔍 [TEST] Verificando conectividad antes de la descarga...');
      const connectivityResult = await checkApiConnectivity();
      
      if (!connectivityResult.success) {
        console.error('❌ [TEST] Problema de conectividad detectado:', connectivityResult.error);
        message.error('Problema de conectividad: ' + connectivityResult.error);
        return;
      }
      
      console.log('✅ [TEST] Conectividad verificada, procediendo con descarga...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('Content-Type');
      console.log('🧪 [TEST] Content-Type recibido:', contentType);
      
      if (!contentType?.includes('application/pdf')) {
        throw new Error(`Content-Type inválido: ${contentType}`);
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
      
      console.log('✅ [SIMPLE-TEST] Descarga simple exitosa');
      message.success('✅ Descarga simple funcionando correctamente');
      
    } catch (error) {
      console.error('❌ [SIMPLE-TEST] Error en descarga simple:', error);
      
      // Detectar tipos específicos de errores
      if (error.message.includes('Failed to fetch')) {
        console.error('❌ [SIMPLE-TEST] Error de red detectado - posible problema de variables de entorno en Vercel');
        message.error('❌ Error de red - verificar variables de entorno en Vercel');
      } else if (error.message.includes('NetworkError')) {
        console.error('❌ [SIMPLE-TEST] Error de red - verificar conectividad');
        message.error('❌ Error de red - verificar conectividad');
      } else {
        message.error('❌ Error en descarga simple: ' + error.message);
      }
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
      console.log('🚀 [DOWNLOAD] Iniciando descarga del ticket:', locator);
      
      // Verificar conectividad antes de la descarga
      console.log('🔍 [DOWNLOAD] Verificando conectividad antes de la descarga...');
      const connectivityResult = await checkApiConnectivity();
      
      if (!connectivityResult.success) {
        console.error('❌ [DOWNLOAD] Problema de conectividad detectado:', connectivityResult.error);
        message.error('Problema de conectividad: ' + connectivityResult.error);
        return;
      }
      
      console.log('✅ [DOWNLOAD] Conectividad verificada, procediendo con descarga...');
      
      await downloadTicket(locator);
      message.success('Ticket descargado con éxito');
    } catch (err) {
      console.error('❌ [DOWNLOAD] Error en descarga principal:', err);
      
      // Detectar tipos específicos de errores
      if (err.message.includes('Failed to fetch')) {
        console.error('❌ [DOWNLOAD] Error de red detectado - posible problema de variables de entorno en Vercel');
        message.error('❌ Error de red - verificar variables de entorno en Vercel');
      } else if (err.message.includes('NetworkError')) {
        console.error('❌ [DOWNLOAD] Error de red - verificar conectividad');
        message.error('❌ Error de red - verificar conectividad');
      } else if (err.message.includes('Server returned HTML')) {
        console.error('❌ [DOWNLOAD] Servidor devuelve HTML - variables de entorno no configuradas en Vercel');
        message.error('❌ Variables de entorno no configuradas en Vercel');
      } else {
        message.error('Fallo en la descarga: ' + err.message);
      }
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
            • Descarga simple para testing<br/>
            • Verificación de conectividad automática<br/>
            • Logs detallados en consola<br/>
            <br/>
            <strong>Debug:</strong> Abre la consola (F12) para ver logs detallados
          </div>
        </Space>
      )}
    </div>
  );
};

export default DownloadTicketButton;
