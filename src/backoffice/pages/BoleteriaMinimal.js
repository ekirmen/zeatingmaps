import React from 'react';
import { Select, Button, Card, Row, Col, Statistic } from 'antd';
import { useBoleteria } from '../hooks/useBoleteria';

const BoleteriaMinimal = () => {
  // Hook para obtener datos básicos de boletería
  const {
    eventos,
    funciones,
    selectedEvent,
    selectedFuncion,
    loading,
    handleEventSelect,
    handleFunctionSelect,
    mapa,
    zonas,
    estadisticas
  } = useBoleteria();
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">🎫 Boletería</h2>
        <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Boletería Minimal</h3>
          <p className="text-gray-500 mb-4">
            Esta es una versión completamente simplificada para identificar problemas de dependencias circulares.
          </p>
          
          {/* Información básica */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Estado Actual:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Versión minimal funcionando ✅</p>
              <p>• Sin dependencias circulares ✅</p>
              <p>• Eventos disponibles: {eventos?.length || 0}</p>
              <p>• Funciones disponibles: {funciones?.length || 0}</p>
              <p>• Evento seleccionado: {selectedEvent ? selectedEvent.nombre || selectedEvent.name : 'Ninguno'}</p>
              <p>• Función seleccionada: {selectedFuncion ? selectedFuncion.nombre || selectedFuncion.name : 'Ninguna'}</p>
              <p>• Estado de carga: {loading ? 'Cargando...' : 'Completado'}</p>
            </div>
          </div>

          {/* Selectores */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
            <h4 className="font-medium text-gray-700 mb-3">Selección:</h4>
            
            {/* Selector de Eventos */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evento:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Selecciona un evento"
                value={selectedEvent?.id}
                onChange={handleEventSelect}
                loading={loading}
                options={eventos?.map(evento => ({
                  value: evento.id,
                  label: evento.nombre || evento.name || `Evento ${evento.id}`
                })) || []}
              />
            </div>

            {/* Selector de Funciones */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Función:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Selecciona una función"
                value={selectedFuncion?.id}
                onChange={handleFunctionSelect}
                loading={loading}
                disabled={!selectedEvent}
                options={funciones?.map(funcion => ({
                  value: funcion.id,
                  label: funcion.nombre || funcion.name || `Función ${funcion.id}`
                })) || []}
              />
            </div>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Estadísticas del Mapa:</h4>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Total Asientos" value={estadisticas.totalSeats} />
                </Col>
                <Col span={6}>
                  <Statistic title="Disponibles" value={estadisticas.availableSeats} valueStyle={{ color: '#3f8600' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="Vendidos" value={estadisticas.soldSeats} valueStyle={{ color: '#cf1322' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="Reservados" value={estadisticas.reservedSeats} valueStyle={{ color: '#faad14' }} />
                </Col>
              </Row>
            </div>
          )}

          {/* Información del Mapa */}
          {mapa && (
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Información del Mapa:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>ID del Mapa:</strong> {mapa.id}</p>
                <p>• <strong>Sala ID:</strong> {mapa.sala_id}</p>
                <p>• <strong>Elementos en el mapa:</strong> {mapa.contenido?.length || 0}</p>
                <p>• <strong>Última actualización:</strong> {new Date(mapa.updated_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Información de Zonas */}
          {zonas && zonas.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Zonas Disponibles:</h4>
              <div className="space-y-2">
                {zonas.map((zona, index) => (
                  <div key={zona.id || index} className="p-2 bg-gray-50 rounded border">
                    <p className="font-medium text-gray-700">Zona {index + 1}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• <strong>ID:</strong> {zona.id}</p>
                      <p>• <strong>Nombre:</strong> {zona.nombre || 'Sin nombre'}</p>
                      <p>• <strong>Sala:</strong> {zona.sala_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de prueba */}
          <div className="mt-4 space-x-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                console.log('Botón de prueba funcionando');
              }}
            >
              Probar Funcionalidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoleteriaMinimal;
