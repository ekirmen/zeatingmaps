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
        style={{ marginBottom: '10px', width: '100%' }}
      >
        {isLoading ? 'Descargando...' : 'Descargar Ticket'}
      </button>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <button 
          onClick={testEndpoint} 
          disabled={isLoading}
          style={{ 
            fontSize: '12px', 
            padding: '5px 10px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          🧪 Probar
        </button>
        
        <button 
          onClick={runDiagnostic} 
          disabled={isLoading}
          style={{ 
            fontSize: '12px', 
            padding: '5px 10px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          🔍 Diagnóstico
        </button>
      </div>
      
      {testResult && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: testResult.success ? '#e8f5e8' : '#ffe8e8',
          border: `1px solid ${testResult.success ? '#4caf50' : '#f44336'}`,
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {testResult.success ? (
            <div>
              <strong>✅ Endpoint funcionando</strong>
              <div>Mensaje: {testResult.data.message}</div>
              <div>Timestamp: {testResult.data.timestamp}</div>
            </div>
          ) : (
            <div>
              <strong>❌ Error en endpoint</strong>
              <div>Error: {testResult.error}</div>
            </div>
          )}
        </div>
      )}
      
      {diagnosticResult && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: diagnosticResult.success ? '#e8f5e8' : '#ffe8e8',
          border: `1px solid ${diagnosticResult.success ? '#4caf50' : '#f44336'}`,
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {diagnosticResult.success ? (
            <div>
              <strong>🔍 Diagnóstico del Servidor</strong>
              <div><strong>Estado:</strong> {diagnosticResult.data.validation.isValid ? '✅ Válido' : '❌ Inválido'}</div>
              <div><strong>Variables faltantes:</strong> {diagnosticResult.data.validation.missingVariables.length > 0 ? diagnosticResult.data.validation.missingVariables.join(', ') : 'Ninguna'}</div>
              <div><strong>Supabase URL:</strong> {diagnosticResult.data.supabase.url}</div>
              <div><strong>Supabase Key:</strong> {diagnosticResult.data.supabase.serviceKey}</div>
              <div><strong>Recomendaciones:</strong></div>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {diagnosticResult.data.recommendations.map((rec, index) => (
                  <li key={index} style={{ fontSize: '11px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <strong>❌ Error en diagnóstico</strong>
              <div>Error: {diagnosticResult.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DownloadTicketButton;