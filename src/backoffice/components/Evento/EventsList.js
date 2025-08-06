import React from 'react';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import { Card, Tag, Button, Space, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined, CalendarOutlined, MapPinOutlined } from '@ant-design/icons';

const EventsList = ({ 
  eventosFiltrados, 
  viewMode, 
  recintoSeleccionado,
  handleEdit,
  handleDelete,
  handleDuplicate
}) => {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      }
    >
      {eventosFiltrados.length > 0 ? (
        eventosFiltrados.map((evento) => (
          <Card
            key={evento.id}
            hoverable
            className={
              viewMode === 'grid'
                ? 'h-full flex flex-col'
                : 'flex-row'
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
              ] : [
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
              avatar={
                viewMode === 'list' && (
                  <Avatar 
                    size={64}
                    src={evento.imagenes?.banner ? resolveImageUrl(evento.imagenes.banner) : null}
                    icon={<CalendarOutlined />}
                  />
                )
              }
              title={
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg truncate">{evento.nombre}</span>
                  <Tag color="blue" className="text-xs">
                    {evento.sector || 'Sin sector'}
                  </Tag>
                </div>
              }
              description={
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPinOutlined className="mr-2" />
                    <span className="text-sm">{recintoSeleccionado?.nombre || 'Sin recinto'}</span>
                  </div>
                  {evento.fecha_evento && (
                    <div className="flex items-center text-gray-600">
                      <CalendarOutlined className="mr-2" />
                      <span className="text-sm">
                        {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    ID: {evento.id}
                  </div>
                </div>
              }
            />
          </Card>
        ))
      ) : (
        <div className="text-center py-12">
          <CalendarOutlined className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay eventos disponibles</h3>
          <p className="text-gray-500">No se encontraron eventos para este recinto y sala.</p>
        </div>
      )}
    </div>
  );
};

export default EventsList;