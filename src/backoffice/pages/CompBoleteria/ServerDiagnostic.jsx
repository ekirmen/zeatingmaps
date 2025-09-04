import React, { useState } from 'react';
import { Button, Card, Typography, Space, Divider } from 'antd';
import { supabase } from '../../../supabaseClient';

const { Title, Text } = Typography;

const ServerDiagnostic = ({ selectedFuncion }) => {
  const [diagnosticInfo, setDiagnosticInfo] = useState({
    seatLocks: '',
    databaseStatus: '',
    sessionInfo: ''
  });

  // Función de diagnóstico de bloqueos
  const diagnoseSeatLocks = async () => {
    if (!selectedFuncion?.id) {
      setDiagnosticInfo(prev => ({
        ...prev,
        seatLocks: 'No hay función seleccionada'
      }));
      return;
    }

    try {
      const sessionId = localStorage.getItem('anonSessionId');
      
      // Obtener todos los bloqueos para esta función
      const { data: allLocks, error: allLocksError } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', selectedFuncion.id);

      if (allLocksError) {
        setDiagnosticInfo(prev => ({
          ...prev,
          seatLocks: `Error obteniendo bloqueos: ${allLocksError.message}`
        }));
        return;
      }

      // Obtener bloqueos del usuario actual
      const { data: myLocks, error: myLocksError } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', selectedFuncion.id)
        .eq('session_id', sessionId);

      if (myLocksError) {
        setDiagnosticInfo(prev => ({
          ...prev,
          seatLocks: `Error obteniendo mis bloqueos: ${myLocksError.message}`
        }));
        return;
      }

      const diagnosticData = {
        totalLocks: allLocks?.length || 0,
        myLocks: myLocks?.length || 0,
        otherLocks: (allLocks?.length || 0) - (myLocks?.length || 0),
        sessionId: sessionId || 'No encontrado',
        allLocksDetails: allLocks || [],
        myLocksDetails: myLocks || []
      };

      setDiagnosticInfo(prev => ({
        ...prev,
        seatLocks: JSON.stringify(diagnosticData, null, 2)
      }));

    } catch (error) {
      setDiagnosticInfo(prev => ({
        ...prev,
        seatLocks: `Error inesperado: ${error.message}`
      }));
    }
  };

  // Función para limpiar todos los bloqueos
  const clearAllLocks = async () => {
    if (!selectedFuncion?.id) {
      alert('No hay función seleccionada');
      return;
    }

    try {
      const sessionId = localStorage.getItem('anonSessionId');
      
      const { error } = await supabase
        .from('seat_locks')
        .delete()
        .eq('funcion_id', selectedFuncion.id)
        .eq('session_id', sessionId);

      if (error) {
        alert(`Error limpiando bloqueos: ${error.message}`);
      } else {
        alert('Bloqueos limpiados exitosamente');
        diagnoseSeatLocks(); // Actualizar diagnóstico
      }
    } catch (error) {
      alert(`Error inesperado: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <Title level={3}>🔧 Diagnóstico del Servidor</Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card title="🔍 Diagnóstico de Bloqueos de Asientos" className="mb-4">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Función ID:</Text> {selectedFuncion?.id || 'No seleccionada'}
            </div>
            <div>
              <Text strong>Session ID:</Text> {localStorage.getItem('anonSessionId') || 'No encontrado'}
            </div>
            
            <Space>
              <Button onClick={diagnoseSeatLocks} type="primary">
                Diagnosticar Bloqueos
              </Button>
              <Button onClick={clearAllLocks} danger>
                Limpiar Mis Bloqueos
              </Button>
            </Space>
            
            {diagnosticInfo.seatLocks && (
              <div className="mt-4">
                <Text strong>Resultado:</Text>
                <pre className="text-xs bg-gray-100 p-2 border rounded overflow-auto max-h-60 mt-2">
                  {diagnosticInfo.seatLocks}
                </pre>
              </div>
            )}
          </Space>
        </Card>

        <Card title="🧹 Limpieza de Cache" className="mb-4">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              onClick={() => {
                localStorage.removeItem('anonSessionId');
                alert('Cache limpiado. Recarga la página.');
                setTimeout(() => window.location.reload(), 1000);
              }}
              danger
            >
              Limpiar Cache y Recargar
            </Button>
            <Text type="secondary">
              Esto limpiará el session ID y recargará la página para forzar una nueva sesión.
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ServerDiagnostic;
