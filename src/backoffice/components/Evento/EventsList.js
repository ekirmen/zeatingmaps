import React from 'react';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import { Card, Tag, Button } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';

const EventsList = ({ 
  eventosFiltrados, 
  viewMode, 
  recintoSeleccionado,
  handleEdit,
  handleDelete,
  handleDuplicate,
  onToggleEventStatus
}) => {
  if (!eventosFiltrados || eventosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarOutlined className="text-3xl text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos configurados</h3>
        <p className="text-gray-500 mb-6">
          {!recintoSeleccionado 
            ? 'Selecciona un recinto y sala para ver los eventos'
            : 'Crea tu primer evento usando el botón "Crear Evento"'
          }
        </p>
        {recintoSeleccionado && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <EnvironmentOutlined className="text-blue-500" />
            <span className="text-sm font-medium">
              {recintoSeleccionado.nombre}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header de la lista */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Eventos Configurados</h2>
          <p className="text-sm text-gray-600 mt-1">
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} en {recintoSeleccionado?.nombre}
          </p>
          
          {/* Resumen del estado de los eventos */}
          {eventosFiltrados.length > 0 && (
            <div className="mt-2 flex items-center gap-4 text-xs">
              {(() => {
                const activeCount = eventosFiltrados.filter(e => 
                  (e.activo === true || e.activo === 'true') && 
                  !(e.desactivado === true || e.desactivado === 'true')
                ).length;
                const inactiveCount = eventosFiltrados.length - activeCount;
                
                return (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">{activeCount} activo{activeCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-600">{inactiveCount} inactivo{inactiveCount !== 1 ? 's' : ''}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Contador de eventos */}
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
          <CalendarOutlined className="text-blue-500" />
          <span className="text-sm font-medium">
            {eventosFiltrados.length}
          </span>
        </div>
      </div>

      {/* Lista de eventos */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {eventosFiltrados.map((evento) => (
          <Card
            key={evento.id}
            hoverable
            className={
              viewMode === 'grid'
                ? 'h-full flex flex-col transition-all duration-200 hover:shadow-lg'
                : 'flex-row transition-all duration-200 hover:shadow-lg'
            }
            cover={
              viewMode === 'grid' && (
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {evento.imagenes?.banner ? (
                    <img
                      src={resolveImageUrl(evento.imagenes.banner)}
                      alt={evento.nombre}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <CalendarOutlined className="text-4xl mb-2" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>
              )
            }
            actions={
              viewMode === 'grid' ? [
                <Button 
                  key="toggle-status"
                  type={(() => {
                    const isActive = evento.activo === true || evento.activo === 'true';
                    const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                    return (isActive && !isDisabled) ? 'default' : 'primary';
                  })()}
                  size="small"
                  onClick={() => onToggleEventStatus && onToggleEventStatus(evento.id, evento)}
                  className="w-full"
                >
                  {(() => {
                    const isActive = evento.activo === true || evento.activo === 'true';
                    const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                    return (isActive && !isDisabled) ? 'Desactivar' : 'Activar';
                  })()}
                </Button>,
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => handleEdit(evento.id)}
                  className="w-full"
                >
                  Editar
                </Button>,
                <Button 
                  type="default" 
                  icon={<CopyOutlined />} 
                  size="small"
                  onClick={() => handleDuplicate(evento.id)}
                  className="w-full"
                >
                  Duplicar
                </Button>,
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={() => handleDelete(evento.id)}
                  className="w-full"
                >
                  Eliminar
                </Button>
              ] : [
                <Button 
                  key="toggle-status"
                  type={(() => {
                    const isActive = evento.activo === true || evento.activo === 'true';
                    const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                    return (isActive && !isDisabled) ? 'default' : 'primary';
                  })()}
                  size="small"
                  onClick={() => onToggleEventStatus && onToggleEventStatus(evento.id, evento)}
                >
                  {(() => {
                    const isActive = evento.activo === true || evento.activo === 'true';
                    const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                    return (isActive && !isDisabled) ? 'Desactivar' : 'Activar';
                  })()}
                </Button>,
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => handleEdit(evento.id)}
                >
                  Editar
                </Button>,
                <Button 
                  type="default" 
                  icon={<CopyOutlined />} 
                  size="small"
                  onClick={() => handleDuplicate(evento.id)}
                >
                  Duplicar
                </Button>,
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={() => handleDelete(evento.id)}
                >
                  Eliminar
                </Button>
              ]
            }
          >
            <Card.Meta
              title={
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 truncate block">
                      {evento.nombre}
                    </span>
                    {/* Indicador de estado más visible */}
                    <div className="mt-1 flex items-center gap-2">
                      {(() => {
                        const isActive = evento.activo === true || evento.activo === 'true';
                        const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                        
                        if (isActive && !isDisabled) {
                          return (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600 font-medium">Activo</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs text-red-600 font-medium">Inactivo</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              }
              description={
                <div className="space-y-2 mt-3">
                  {evento.sector && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <EnvironmentOutlined className="text-gray-400" />
                      <span>{evento.sector}</span>
                    </div>
                  )}
                  {evento.fecha_evento && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarOutlined className="text-gray-400" />
                      <span>{new Date(evento.fecha_evento).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  {/* Estado del evento */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Estado del evento:</span>
                    {(() => {
                      const isActive = evento.activo === true || evento.activo === 'true';
                      const isDisabled = evento.desactivado === true || evento.desactivado === 'true';
                      
                      if (isActive && !isDisabled) {
                        return <Tag color="green" className="text-xs">Activo</Tag>;
                      } else {
                        return <Tag color="red" className="text-xs">Inactivo</Tag>;
                      }
                    })()}
                  </div>
                  
                  {/* Estado de venta */}
                  {evento.estadoVenta && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Estado de venta:</span>
                      <Tag 
                        color={
                          evento.estadoVenta === 'a-la-venta' ? 'green' : 
                          evento.estadoVenta === 'agotado' ? 'red' : 
                          evento.estadoVenta === 'proximamente' ? 'blue' : 'default'
                        }
                        className="text-xs"
                      >
                        {evento.estadoVenta === 'a-la-venta' ? 'A la venta' :
                         evento.estadoVenta === 'agotado' ? 'Agotado' :
                         evento.estadoVenta === 'proximamente' ? 'Próximamente' :
                         evento.estadoVenta}
                      </Tag>
                    </div>
                  )}
                </div>
              }
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsList;