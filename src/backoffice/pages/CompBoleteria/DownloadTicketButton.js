import React, { useState } from 'react';
import { message, Button, Space, Tooltip } from 'antd';
import { DownloadOutlined, BugOutlined, TestOutlined, FileTextOutlined } from '@ant-design/icons';
import downloadTicket from '../../../utils/downloadTicket';

const DownloadTicketButton = ({ locator, showDebugButtons = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  const testEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/payments/${locator}/test`);
      const data = await response.json();
      setTestResult({ success: true, data });
      console.log('✅ [TEST] Endpoint funcionando:', data);
      message.success('Endpoint funcionando correctamente');
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      console.error('❌ [TEST] Error en endpoint:', error);
      message.error('Error en endpoint: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostic = async () => {
    setIsLoading(true);
    setDiagnosticResult(null);
    
    try {
      const response = await fetch(`/api/payments/${locator}/diagnostic`);
      const data = await response.json();
      setDiagnosticResult({ success: true, data });
      console.log('🔍 [DIAGNOSTIC] Diagnóstico completado:', data);
      message.success('Diagnóstico completado');
    } catch (error) {
      setDiagnosticResult({ success: false, error: error.message });
      console.error('❌ [DIAGNOSTIC] Error en diagnóstico:', error);
      message.error('Error en diagnóstico: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      {/* Botones de debug (solo se muestran si showDebugButtons es true) */}
      {showDebugButtons && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <Tooltip title="Probar endpoint de la API">
              <Button 
                icon={<TestOutlined />}
                onClick={testEndpoint}
                disabled={isLoading}
                size="small"
                style={{ flex: 1 }}
              >
                Test API
              </Button>
            </Tooltip>
            
            <Tooltip title="Ejecutar diagnóstico completo">
              <Button 
                icon={<BugOutlined />}
                onClick={runDiagnostic}
                disabled={isLoading}
                size="small"
                style={{ flex: 1 }}
              >
                Diagnóstico
              </Button>
            </Tooltip>
            
            <Tooltip title="Probar descarga sin autenticación">
              <Button 
                icon={<FileTextOutlined />}
                onClick={testSimpleDownload}
                disabled={isLoading}
                size="small"
                style={{ flex: 1 }}
              >
                Test Simple
              </Button>
            </Tooltip>
          </div>
          
          {/* Resultados de las pruebas */}
          {testResult && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: testResult.success ? '#f6ffed' : '#fff2f0', 
              border: `1px solid ${testResult.success ? '#b7eb8f' : '#ffccc7'}`, 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>Test Result:</strong>
              <pre style={{ margin: '5px 0', fontSize: '11px' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
          
          {diagnosticResult && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: diagnosticResult.success ? '#f6ffed' : '#fff2f0', 
              border: `1px solid ${diagnosticResult.success ? '#b7eb8f' : '#ffccc7'}`, 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>Diagnóstico:</strong>
              <pre style={{ margin: '5px 0', fontSize: '11px' }}>
                {JSON.stringify(diagnosticResult, null, 2)}
              </pre>
            </div>
          )}
        </Space>
      )}
    </div>
  );
};

export default DownloadTicketButton;
