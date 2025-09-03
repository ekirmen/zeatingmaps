import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Descriptions, Tag, Spin, message, Divider, Typography } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WifiOutlined, BugOutlined } from '@ant-design/icons';
import { buildRelativeApiUrl, checkApiConnectivity, diagnoseApiIssues } from '../../../utils/apiConfig';
import { useBoleteria } from '../../hooks/useBoleteria';
import { supabase } from '../../../../supabaseClient';

const { Title, Text } = Typography;

const ServerDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [connectivityResult, setConnectivityResult] = useState(null);
  const [boleteriaDebug, setBoleteriaDebug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingConnectivity, setLoadingConnectivity] = useState(false);
  const [loadingBoleteria, setLoadingBoleteria] = useState(false);

  // Hook de boletería para diagnóstico
  const boleteriaHook = useBoleteria();

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const url = buildRelativeApiUrl('payments/diagnostic');
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
      const url = buildRelativeApiUrl('payments/test');
      console.log('🧪 [TEST] Ejecutando prueba en:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setTestResult(data);
        message.success('Prueba completada');
      } else {
        message.error('Error ejecutando prueba: ' + data.error);
      }
    } catch (error) {
      console.error('❌ [TEST] Error:', error);
      message.error('Error de conexión: ' + error.message);
    } finally {
      setLoadingTest(false);
    }
  };

  const runConnectivityTest = async () => {
    setLoadingConnectivity(true);
    try {
      const result = await checkApiConnectivity();
      setConnectivityResult(result);
      message.success('Prueba de conectividad completada');
    } catch (error) {
      console.error('❌ [CONNECTIVITY] Error:', error);
      message.error('Error en prueba de conectividad: ' + error.message);
    } finally {
      setLoadingConnectivity(false);
    }
  };

  // Nuevo: Diagnóstico de boletería
  const runBoleteriaDiagnostic = async () => {
    setLoadingBoleteria(true);
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        hookState: {
          eventos: boleteriaHook.eventos?.length || 0,
          funciones: boleteriaHook.funciones?.length || 0,
          selectedEvent: boleteriaHook.selectedEvent ? {
            id: boleteriaHook.selectedEvent.id,
            nombre: boleteriaHook.selectedEvent.nombre,
            slug: boleteriaHook.selectedEvent.slug
          } : null,
          selectedFuncion: boleteriaHook.selectedFuncion ? {
            id: boleteriaHook.selectedFuncion.id,
            nombre: boleteriaHook.selectedFuncion.nombre,
            sala: boleteriaHook.selectedFuncion.sala,
            sala_id: boleteriaHook.selectedFuncion.sala_id
          } : null,
          selectedPlantilla: !!boleteriaHook.selectedPlantilla,
          mapa: !!boleteriaHook.mapa,
          zonas: boleteriaHook.zonas?.length || 0,
          loading: boleteriaHook.loading,
          error: boleteriaHook.error
        },
        debugInfo: boleteriaHook.debugInfo || {},
        localStorage: {
          boleteriaEventId: localStorage.getItem('boleteriaEventId'),
          boleteriaFunctionId: localStorage.getItem('boleteriaFunctionId'),
          lastSelectedEvent: localStorage.getItem('lastSelectedEvent'),
          lastSelectedFunction: localStorage.getItem('lastSelectedFunction')
        }
      };

      // Probar lockSeat del store
      try {
        const { useSeatLockStore } = await import('../../../components/seatLockStore');
        const lockSeat = useSeatLockStore.getState().lockSeat;
        debugInfo.storeTest = {
          lockSeat: !!lockSeat,
          lockSeatType: typeof lockSeat
        };
      } catch (error) {
        debugInfo.storeTest = {
          error: error.message
        };
      }

      // Probar fetchMapa si hay función seleccionada
      if (boleteriaHook.selectedFuncion) {
        try {
          const salaId = boleteriaHook.selectedFuncion.sala?.id || boleteriaHook.selectedFuncion.sala_id || boleteriaHook.selectedFuncion.sala;
          debugInfo.fetchMapaTest = {
            salaId,
            salaIdType: typeof salaId
          };
          
          if (salaId) {
            const { fetchMapa } = await import('../../services/apibackoffice');
            const mapData = await fetchMapa(salaId);
            debugInfo.fetchMapaTest.result = !!mapData;
            debugInfo.fetchMapaTest.dataType = typeof mapData;
          }
        } catch (error) {
          debugInfo.fetchMapaTest = {
            error: error.message
          };
        }
      }

      // Verificar autenticación
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        debugInfo.auth = {
          user: !!authData?.user,
          email: authData?.user?.email,
          error: authError?.message || null
        };
      } catch (error) {
        debugInfo.auth = {
          error: error.message
        };
      }

      setBoleteriaDebug(debugInfo);
      message.success('Diagnóstico de boletería completado');
    } catch (error) {
      console.error('❌ [BOLETERIA DIAGNOSTIC] Error:', error);
      message.error('Error en diagnóstico de boletería: ' + error.message);
    } finally {
      setLoadingBoleteria(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'warning': return <InfoCircleOutlined />;
      case 'error': return <CloseCircleOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Title level={2}>🔧 Diagnóstico del Servidor</Title>
        <Text type="secondary">
          Herramientas para diagnosticar problemas de conectividad y configuración del servidor
        </Text>
      </div>

      {/* Botones de acción */}
      <Card style={{ marginBottom: '20px' }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={runDiagnostic}
            loading={loading}
          >
            Ejecutar Diagnóstico Completo
          </Button>
          <Button
            icon={<WifiOutlined />}
            onClick={runConnectivityTest}
            loading={loadingConnectivity}
          >
            Probar Conectividad
          </Button>
          <Button
            icon={<BugOutlined />}
            onClick={runTest}
            loading={loadingTest}
          >
            Probar Servidor
          </Button>
          <Button
            type="dashed"
            icon={<BugOutlined />}
            onClick={runBoleteriaDiagnostic}
            loading={loadingBoleteria}
          >
            🎭 Diagnóstico de Boletería
          </Button>
        </Space>
      </Card>

      {/* Resultados del diagnóstico */}
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
              {diagnostic.environmentVariables && Object.entries(diagnostic.environmentVariables).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  <Tag color={value.present ? 'green' : 'red'}>
                    {value.present ? '✅ Presente' : '❌ Faltante'}
                  </Tag>
                  {value.length && <span className="ml-2">({value.length} chars)</span>}
                  {value.value && <span className="ml-2">{value.value}</span>}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>

          {/* Verificaciones */}
          {diagnostic.checks && (
            <Card title="Verificaciones del Sistema" size="small" style={{ marginBottom: '20px' }}>
              <Descriptions bordered column={1}>
                {Object.entries(diagnostic.checks).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    <Tag color={value ? 'green' : 'red'}>
                      {value ? '✅ Correcto' : '❌ Incorrecto'}
                    </Tag>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}

          {/* Recomendaciones */}
          {diagnostic.recommendations && diagnostic.recommendations.length > 0 && (
            <Card title="Recomendaciones" size="small" style={{ marginBottom: '20px' }}>
              <Alert
                message="Acciones recomendadas para resolver problemas"
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
        </div>
      ) : null}

      {/* Resultados de conectividad */}
      {connectivityResult && (
        <Card title="🌐 Prueba de Conectividad" size="small" style={{ marginBottom: '20px' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Estado">
              <Tag color={connectivityResult.success ? 'green' : 'red'}>
                {connectivityResult.success ? '✅ Conectado' : '❌ Sin conexión'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="URL Probada">
              {connectivityResult.url}
            </Descriptions.Item>
            <Descriptions.Item label="Tiempo de Respuesta">
              {connectivityResult.responseTime}ms
            </Descriptions.Item>
            {connectivityResult.error && (
              <Descriptions.Item label="Error">
                <Text type="danger">{connectivityResult.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Resultados de prueba del servidor */}
      {testResult && (
        <Card title="🧪 Prueba del Servidor" size="small" style={{ marginBottom: '20px' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Estado">
              <Tag color={testResult.success ? 'green' : 'red'}>
                {testResult.success ? '✅ Funcionando' : '❌ Error'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {testResult.healthCheck?.timestamp}
            </Descriptions.Item>
            <Descriptions.Item label="Entorno">
              {testResult.healthCheck?.environment}
            </Descriptions.Item>
            <Descriptions.Item label="Entorno Vercel">
              {testResult.healthCheck?.vercelEnvironment}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* NUEVO: Diagnóstico de Boletería */}
      {boleteriaDebug && (
        <Card title="🎭 Diagnóstico de Boletería" size="small" style={{ marginBottom: '20px' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Timestamp">
              {boleteriaDebug.timestamp}
            </Descriptions.Item>
            
            <Descriptions.Item label="Estado del Hook">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Eventos:</span>
                  <Tag color={boleteriaDebug.hookState.eventos > 0 ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.eventos}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Funciones:</span>
                  <Tag color={boleteriaDebug.hookState.funciones > 0 ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.funciones}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Evento Seleccionado:</span>
                  <Tag color={boleteriaDebug.hookState.selectedEvent ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.selectedEvent?.nombre || 'Ninguno'}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Función Seleccionada:</span>
                  <Tag color={boleteriaDebug.hookState.selectedFuncion ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.selectedFuncion?.nombre || 'Ninguna'}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Plantilla:</span>
                  <Tag color={boleteriaDebug.hookState.selectedPlantilla ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.selectedPlantilla ? '✅ Cargada' : '❌ No cargada'}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Mapa:</span>
                  <Tag color={boleteriaDebug.hookState.mapa ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.mapa ? '✅ Cargado' : '❌ No cargado'}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Zonas:</span>
                  <Tag color={boleteriaDebug.hookState.zonas > 0 ? 'green' : 'red'}>
                    {boleteriaDebug.hookState.zonas}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <span>Loading:</span>
                  <Tag color={boleteriaDebug.hookState.loading ? 'orange' : 'green'}>
                    {boleteriaDebug.hookState.loading ? '⏳ Cargando' : '✅ Listo'}
                  </Tag>
                </div>
                {boleteriaDebug.hookState.error && (
                  <div className="flex items-center gap-2">
                    <span>Error:</span>
                    <Tag color="red">{boleteriaDebug.hookState.error}</Tag>
                  </div>
                )}
              </div>
            </Descriptions.Item>

            {boleteriaDebug.storeTest && (
              <Descriptions.Item label="Store Test">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>lockSeat:</span>
                    <Tag color={boleteriaDebug.storeTest.lockSeat ? 'green' : 'red'}>
                      {boleteriaDebug.storeTest.lockSeat ? '✅ Disponible' : '❌ No disponible'}
                    </Tag>
                  </div>
                  {boleteriaDebug.storeTest.error && (
                    <div className="flex items-center gap-2">
                      <span>Error:</span>
                      <Tag color="red">{boleteriaDebug.storeTest.error}</Tag>
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            )}

            {boleteriaDebug.fetchMapaTest && (
              <Descriptions.Item label="Fetch Mapa Test">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Sala ID:</span>
                    <Tag color={boleteriaDebug.fetchMapaTest.salaId ? 'green' : 'red'}>
                      {boleteriaDebug.fetchMapaTest.salaId || 'No disponible'}
                    </Tag>
                  </div>
                  {boleteriaDebug.fetchMapaTest.result !== undefined && (
                    <div className="flex items-center gap-2">
                      <span>Resultado:</span>
                      <Tag color={boleteriaDebug.fetchMapaTest.result ? 'green' : 'red'}>
                        {boleteriaDebug.fetchMapaTest.result ? '✅ Éxito' : '❌ Falló'}
                      </Tag>
                    </div>
                  )}
                  {boleteriaDebug.fetchMapaTest.error && (
                    <div className="flex items-center gap-2">
                      <span>Error:</span>
                      <Tag color="red">{boleteriaDebug.fetchMapaTest.error}</Tag>
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            )}

            {boleteriaDebug.auth && (
              <Descriptions.Item label="Autenticación">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Usuario:</span>
                    <Tag color={boleteriaDebug.auth.user ? 'green' : 'red'}>
                      {boleteriaDebug.auth.user ? '✅ Autenticado' : '❌ No autenticado'}
                    </Tag>
                  </div>
                  {boleteriaDebug.auth.email && (
                    <div className="flex items-center gap-2">
                      <span>Email:</span>
                      <Tag color="blue">{boleteriaDebug.auth.email}</Tag>
                    </div>
                  )}
                  {boleteriaDebug.auth.error && (
                    <div className="flex items-center gap-2">
                      <span>Error:</span>
                      <Tag color="red">{boleteriaDebug.auth.error}</Tag>
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="LocalStorage">
              <div className="space-y-2">
                {Object.entries(boleteriaDebug.localStorage).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span>{key}:</span>
                    <Tag color={value ? 'blue' : 'gray'}>
                      {value || 'No definido'}
                    </Tag>
                  </div>
                ))}
              </div>
            </Descriptions.Item>

            {boleteriaDebug.debugInfo && Object.keys(boleteriaDebug.debugInfo).length > 0 && (
              <Descriptions.Item label="Debug Info">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(boleteriaDebug.debugInfo, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Información de Debug */}
      <Card title="🐛 Información de Debug" size="small" style={{ marginTop: '20px' }}>
        <Alert
          message="Logs de Consola"
          description={
            <div>
              <p>Para ver información detallada de debug, abre la consola del navegador (F12) y revisa los logs con estos prefijos:</p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li><code>🔧 [APICONFIG]</code> - Configuración de la API</li>
                <li><code>🔗 [APICONFIG]</code> - Construcción de URLs</li>
                <li><code>🔍 [APICONFIG]</code> - Diagnósticos y conectividad</li>
                <li><code>🚀 [DOWNLOAD]</code> - Proceso de descarga</li>
                <li><code>🧪 [TEST]</code> - Pruebas del servidor</li>
                <li><code>🎭 [BOLETERIA]</code> - Diagnóstico de boletería</li>
              </ul>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                <strong>Tip:</strong> Si ves errores de "Failed to fetch" o problemas de CORS, 
                verifica que las variables de entorno estén configuradas en Vercel.
              </p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
};

export default ServerDiagnostic;
