import React, { useState } from 'react';
import downloadTicket from '../utils/downloadTicket';

const DownloadTicketButton = ({ paymentId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  const testEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/payments/${paymentId}/test`);
      const data = await response.json();
      setTestResult({ success: true, data });
      console.log('✅ [TEST] Endpoint funcionando:', data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      console.error('❌ [TEST] Error en endpoint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostic = async () => {
    setIsLoading(true);
    setDiagnosticResult(null);
    
    try {
      const response = await fetch(`/api/payments/${paymentId}/diagnostic`);
      const data = await response.json();
      setDiagnosticResult({ success: true, data });
      console.log('🔍 [DIAGNOSTIC] Diagnóstico completado:', data);
    } catch (error) {
      setDiagnosticResult({ success: false, error: error.message });
      console.error('❌ [DIAGNOSTIC] Error en diagnóstico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleDownload = async () => {
    setIsLoading(true);
    try {
      // Probar descarga simple sin autenticación
      const response = await fetch(`/api/payments/${paymentId}/download-simple`);
      
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
      a.download = `ticket-prueba-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [SIMPLE-TEST] Descarga simple exitosa');
      alert('✅ Descarga simple funcionando correctamente');
      
    } catch (error) {
      console.error('❌ [SIMPLE-TEST] Error en descarga simple:', error);
      alert('❌ Error en descarga simple: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await downloadTicket(paymentId);
    } catch (error) {
      console.error('Error downloading ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleDownload}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Descargando...' : 'Descargar Ticket'}
      </button>
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={testEndpoint}
          disabled={isLoading}
          className="btn btn-secondary"
          style={{ marginRight: '5px' }}
        >
          Test Endpoint
        </button>
        
        <button 
          onClick={runDiagnostic}
          disabled={isLoading}
          className="btn btn-info"
          style={{ marginRight: '5px' }}
        >
          Diagnóstico
        </button>
        
        <button 
          onClick={testSimpleDownload}
          disabled={isLoading}
          className="btn btn-success"
        >
          Test Descarga Simple
        </button>
      </div>
      
      {testResult && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: testResult.success ? '#d4edda' : '#f8d7da', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <strong>Test Result:</strong>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}
      
      {diagnosticResult && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: diagnosticResult.success ? '#d4edda' : '#f8d7da', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <strong>Diagnóstico:</strong>
          <pre>{JSON.stringify(diagnosticResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DownloadTicketButton;