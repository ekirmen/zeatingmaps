import React, { useMemo } from 'react';
import { Card, Tag, Button } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import VirtualizedList from './VirtualizedList';
import { EventListSkeleton } from './SkeletonLoaders';

/**
 * Lista virtualizada de eventos para mejor performance con muchos eventos
 */
const VirtualizedEventList = ({
  eventos = [],
  loading = false,
  onEventClick,
  height = 600,
  className = ''
}) => {
  const renderEvent = (evento, index, setItemSize) => {
    const cardRef = React.useRef(null);
    
    React.useEffect(() => {
      if (cardRef.current && setItemSize) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setItemSize(index, entry.contentRect.height);
          }
        });
        
        resizeObserver.observe(cardRef.current);
        return () => resizeObserver.disconnect();
      }
    }, [index, setItemSize]);

    return (
      <div ref={cardRef} className="p-2">
        <Card
          hoverable
          onClick={() => onEventClick?.(evento)}
          className="w-full"
          size="small"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{evento.nombre}</h3>
              
              {evento.descripcion && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {evento.descripcion}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                {evento.fecha_inicio && (
                  <Tag icon={<CalendarOutlined />} color="blue">
                    {new Date(evento.fecha_inicio).toLocaleDateString()}
                  </Tag>
                )}
                
                {evento.hora_inicio && (
                  <Tag icon={<ClockCircleOutlined />} color="green">
                    {evento.hora_inicio}
                  </Tag>
                )}
                
                {evento.precio_minimo && (
                  <Tag icon={<DollarOutlined />} color="orange">
                    Desde ${evento.precio_minimo}
                  </Tag>
                )}
              </div>
            </div>
            
            {evento.imagen && (
              <img
                src={evento.imagen}
                alt={evento.nombre}
                className="w-20 h-20 object-cover rounded ml-4"
                loading="lazy"
              />
            )}
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return <EventListSkeleton />;
  }

  return (
    <VirtualizedList
      items={eventos}
      renderItem={renderEvent}
      height={height}
      itemHeight={120}
      variableHeight={true}
      emptyMessage="No hay eventos disponibles"
      className={className}
    />
  );
};

export default VirtualizedEventList;

