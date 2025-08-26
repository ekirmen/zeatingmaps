import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Descriptions, Tag, Spin, message } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { buildRelativeApiUrl } from '../../../utils/apiConfig';

const ServerDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const url = `/api/payments/diagnostic`;
      console.log('🔍 [DIAGNOSTIC] Ejecutando diagnóstico en:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setDiagnostic(data);
        message.success('Diagnóstico completado');
      } else {
        message.error('Error ejecutando diagnóstico: ' + data.error);
      }
    } catch (error) {
      console.error('❌ [DIAGNOSTIC] Error:', error);
      message.error('Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setLoadingTest(true);
    try {
      const url = `/api/payments/test`;
      console.log('🧪 [TEST] Ejecutando prueba en:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(data);
        message.success('Prueba completada');
      } else {
        message.error('Error en prueba: ' + data.error);
      }
    } catch (error) {
      console.error('❌ [TEST] Error:', error);
      message.error('Error de conexión: ' + error.message);
    } finally {
      setLoadingTest(false);
    }
  };

  useEffect(() => {
    // Ejecutar diagnóstico automáticamente al montar el componente
    runDiagnostic();
  }, []);

  const getStatusColor = (status) => {
    return status === 'healthy' ? 'success' : 'error';
  };

  const getStatusIcon = (status) => {
    return status === 'healthy' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title="🔍 Diagnóstico del Servidor" 
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={runDiagnostic} 
              loading={loading}
            >
              Actualizar Diagnóstico
            </Button>
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={runTest} 
              loading={loadingTest}
              type="default"
            >
              Probar Servidor
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Ejecutando diagnóstico...</div>
          </div>
        ) : diagnostic ? (
          <div>
            {/* Estado General */}
            <Alert
              message={`Estado del Servidor: ${diagnostic.status.toUpperCase()}`}
              description={diagnostic.status === 'healthy' 
                ? 'El servidor está configurado correctamente' 
                : 'Hay problemas de configuración que necesitan atención'
              }
              type={getStatusColor(diagnostic.status)}
              icon={getStatusIcon(diagnostic.status)}
              showIcon
              style={{ marginBottom: '20px' }}
            />

            {/* Variables de Entorno */}
            <Card title="Variables de Entorno" size="small" style={{ marginBottom: '20px' }}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="SUPABASE_URL">
                  <Tag color={diagnostic.environmentVariables.supabaseUrl.present ? 'success' : 'error'}>
                    {diagnostic.environmentVariables.supabaseUrl.present ? '✅ Presente' : '❌ Faltante'}
                  </Tag>
                  {diagnostic.environmentVariables.supabaseUrl.present && (
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                      {diagnostic.environmentVariables.supabaseUrl.value}
                    </span>
                  )}
                </Descriptions.Item>
                
                <Descriptions.Item label="SUPABASE_SERVICE_ROLE_KEY">
                  <Tag color={diagnostic.environmentVariables.supabaseServiceKey.present ? 'success' : 'error'}>
                    {diagnostic.environmentVariables.supabaseServiceKey.present ? '✅ Presente' : '❌ Faltante'}
                  </Tag>
                  {diagnostic.environmentVariables.supabaseServiceKey.present && (
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                      {diagnostic.environmentVariables.supabaseServiceKey.value}
                    </span>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Verificaciones */}
            <Card title="Verificaciones" size="small" style={{ marginBottom: '20px' }}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Configuración Válida">
                  <Tag color={diagnostic.checks.configValid ? 'success' : 'error'}>
                    {diagnostic.checks.configValid ? '✅ Válida' : '❌ Inválida'}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Formato de URL Supabase">
                  <Tag color={diagnostic.checks.supabaseUrlFormat ? 'success' : 'error'}>
                    {diagnostic.checks.supabaseUrlFormat ? '✅ Correcto' : '❌ Incorrecto'}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Variables Requeridas">
                  <Tag color={diagnostic.checks.hasRequiredVars ? 'success' : 'error'}>
                    {diagnostic.checks.hasRequiredVars ? '✅ Completas' : '❌ Incompletas'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Recomendaciones */}
            {diagnostic.recommendations.length > 0 && (
              <Card title="⚠️ Problemas Detectados" size="small" style={{ marginBottom: '20px' }}>
                <Alert
                  message="Se encontraron problemas de configuración"
                  description={
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {diagnostic.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
              </Card>
            )}

            {/* Próximos Pasos */}
            <Card title="📋 Próximos Pasos" size="small">
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {diagnostic.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </Card>

            {/* Información del Entorno */}
            <Card title="Información del Entorno" size="small" style={{ marginTop: '20px' }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Entorno">
                  {diagnostic.environment.nodeEnv || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Vercel Environment">
                  {diagnostic.environment.vercelEnv || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Timestamp">
                  {new Date(diagnostic.environment.timestamp).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : (
          <Alert
            message="No hay datos de diagnóstico"
            description="Ejecuta el diagnóstico para ver el estado del servidor"
            type="info"
            showIcon
          />
        )}

        {/* Resultado de la Prueba */}
        {testResult && (
          <Card title="🧪 Resultado de la Prueba" size="small" style={{ marginTop: '20px' }}>
            <Alert
              message={testResult.success ? 'Prueba Exitosa' : 'Prueba Fallida'}
              description={testResult.message}
              type={testResult.success ? 'success' : 'error'}
              showIcon
            />
            
            {testResult.serverInfo && (
              <div style={{ marginTop: '16px' }}>
                <strong>Información del Servidor:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Versión de Node: {testResult.serverInfo.nodeVersion}</li>
                  <li>Plataforma: {testResult.serverInfo.platform}</li>
                  <li>Arquitectura: {testResult.serverInfo.arch}</li>
                  <li>Uptime: {Math.round(testResult.serverInfo.uptime())}s</li>
                </ul>
              </div>
            )}
          </Card>
        )}
      </Card>
    </div>
  );
};

export default ServerDiagnostic;
