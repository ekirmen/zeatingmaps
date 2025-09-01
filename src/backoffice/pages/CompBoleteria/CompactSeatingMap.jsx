import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tooltip, Space } from 'antd';
import { useSeatLockStore } from '../../../components/seatLockStore';
import { useTheme } from '../../../contexts/ThemeContext';

const { Title, Text } = Typography;

const CompactSeatingMap = ({ mapa, selectedFuncion, onSeatClick }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { theme, getEventTheme } = useTheme();
  const [eventTheme, setEventTheme] = useState(theme);
  const { lockedSeats } = useSeatLockStore();

  // Cargar tema del evento
  useEffect(() => {
    const loadEventTheme = async () => {
      if (selectedFuncion?.evento_id) {
        try {
          const eventSpecificTheme = await getEventTheme(selectedFuncion.evento_id);
          setEventTheme(eventSpecificTheme);
        } catch (error) {
          console.error('Error loading event theme:', error);
          setEventTheme(theme);
        }
      }
    };
    loadEventTheme();
  }, [selectedFuncion, getEventTheme, theme]);

  // Procesar asientos del mapa
  useEffect(() => {
    if (!mapa?.contenido) return;

    const processedSeats = [];
    
    mapa.contenido.forEach(elemento => {
      if (elemento.type === 'silla') {
        // Determinar estado del asiento
        let seatStatus = elemento.estado || 'disponible';
        
        // Verificar si está bloqueado
        const isLocked = lockedSeats.some(lock => lock.seat_id === elemento._id);
        if (isLocked) {
          const lock = lockedSeats.find(lock => lock.seat_id === elemento._id);
          if (lock.status === 'seleccionado') {
            seatStatus = 'seleccionado';
          } else {
            seatStatus = 'bloqueado';
          }
        }

        processedSeats.push({
          id: elemento._id,
          nombre: elemento.nombre || elemento.numero || elemento._id,
          zona: elemento.zona?.nombre || 'Sin zona',
          estado: seatStatus,
          posicion: elemento.posicion || { x: 0, y: 0 }
        });
      }
    });

    setSeats(processedSeats);
  }, [mapa, lockedSeats]);

  // Función para obtener el color de un estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible':
        return eventTheme.seatAvailable || '#4CAF50';
      case 'seleccionado':
        return eventTheme.seatSelectedMe || '#1890ff';
      case 'vendido':
      case 'pagado':
        return eventTheme.seatSold || '#8c8c8c';
      case 'reservado':
        return eventTheme.seatReserved || '#722ed1';
      case 'bloqueado':
        return eventTheme.seatBlocked || '#ff4d4f';
      default:
        return '#4CAF50';
    }
  };

  // Agrupar asientos por zona
  const seatsByZone = seats.reduce((acc, seat) => {
    if (!acc[seat.zona]) {
      acc[seat.zona] = [];
    }
    acc[seat.zona].push(seat);
    return acc;
  }, {});

  // Función para manejar clic en asiento
  const handleSeatClick = (seat) => {
    if (onSeatClick) {
      onSeatClick(seat);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Cargando mapa...</div>;
  }

  return (
    <div className="p-4">
      <Title level={4} className="mb-4">Mapa de Asientos</Title>
      
      {Object.keys(seatsByZone).map((zona) => (
        <Card 
          key={zona} 
          size="small" 
          className="mb-4"
          title={
            <Space>
              <Text strong>{zona}</Text>
              <Text type="secondary">({seatsByZone[zona].length} asientos)</Text>
            </Space>
          }
        >
          <div className="grid grid-cols-10 gap-1">
            {seatsByZone[zona].map((seat) => (
              <Tooltip 
                key={seat.id} 
                title={`${seat.nombre} - ${seat.estado}`}
              >
                <div
                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer text-xs font-medium text-white hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: getStatusColor(seat.estado),
                    borderColor: seat.estado === 'disponible' ? '#4CAF50' : getStatusColor(seat.estado)
                  }}
                  onClick={() => handleSeatClick(seat)}
                >
                  {seat.nombre.length <= 2 ? seat.nombre : seat.nombre.substring(0, 2)}
                </div>
              </Tooltip>
            ))}
          </div>
        </Card>
      ))}

      {/* Leyenda */}
      <Card size="small" className="mt-4">
        <Title level={5}>Leyenda</Title>
        <Row gutter={[16, 8]}>
          <Col>
            <Space>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getStatusColor('disponible') }}
              />
              <Text>Disponible</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getStatusColor('seleccionado') }}
              />
              <Text>Seleccionado</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getStatusColor('vendido') }}
              />
              <Text>Vendido</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getStatusColor('reservado') }}
              />
              <Text>Reservado</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: getStatusColor('bloqueado') }}
              />
              <Text>Bloqueado</Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CompactSeatingMap;
