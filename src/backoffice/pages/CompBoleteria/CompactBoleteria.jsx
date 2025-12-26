import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Space, Typography, Button, Tooltip, Tabs } from '../../../utils/antdComponents';
import {
  UserOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useSeatLockStore } from '../../../components/seatLockStore';
import { useTheme } from '../../../contexts/ThemeContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CompactBoleteria = ({
  selectedFuncion,
  mapa,
  zonas = [],
  plantillaPrecios = [],
  onSeatClick
}) => {
  const [seatStats, setSeatStats] = useState({
    total: 0,
    disponibles: 0,
    seleccionados: 0,
    vendidos: 0,
    reservados: 0,
    bloqueados: 0
  });
  const [zoneStats, setZoneStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

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

  // Calcular estadísticas de asientos
  const calculateSeatStats = useCallback(() => {
    if (!mapa?.contenido) {
      return;
    }

    let stats = {
      total: 0,
      disponibles: 0,
      seleccionados: 0,
      vendidos: 0,
      reservados: 0,
      bloqueados: 0
    };

    const zoneData = {};

    // Procesar todos los elementos del mapa
    // Si el contenido es un array, procesarlo directamente
    // Si es un objeto, buscar la propiedad 'elementos'
    const elementos = Array.isArray(mapa.contenido)
      ? mapa.contenido
      : mapa.contenido.elementos || [];

    if (!Array.isArray(elementos)) {
      return stats;
    }

    elementos.forEach(elemento => {
      if (elemento.type === 'silla') {
        stats.total++;

        // Determinar estado del asiento
        let seatStatus = elemento.estado || 'disponible';

        // Verificar si está bloqueado
        const isLocked = Array.isArray(lockedSeats) ? lockedSeats.some(lock => lock.seat_id === elemento._id) : false;
        if (isLocked) {
          const lock = Array.isArray(lockedSeats) ? lockedSeats.find(lock => lock.seat_id === elemento._id) : null;
          if (lock.status === 'seleccionado') {
            seatStatus = 'seleccionado';
          } else {
            seatStatus = 'bloqueado';
          }
        }

        // Contar por estado
        switch (seatStatus) {
          case 'disponible':
            stats.disponibles++;
            break;
          case 'seleccionado':
            stats.seleccionados++;
            break;
          case 'vendido':
          case 'pagado':
            stats.vendidos++;
            break;
          case 'reservado':
            stats.reservados++;
            break;
          case 'bloqueado':
            stats.bloqueados++;
            break;
          default:
            stats.disponibles++;
        }

        // Agrupar por zona
        const zonaId = elemento.zona?.id || elemento.zonaId || 'sin_zona';
        if (!zoneData[zonaId]) {
          zoneData[zonaId] = {
            nombre: elemento.zona?.nombre || 'Sin zona',
            total: 0,
            disponibles: 0,
            seleccionados: 0,
            vendidos: 0,
            reservados: 0,
            bloqueados: 0,
            precio: 0
          };
        }
        zoneData[zonaId].total++;

        switch (seatStatus) {
          case 'disponible':
            zoneData[zonaId].disponibles++;
            break;
          case 'seleccionado':
            zoneData[zonaId].seleccionados++;
            break;
          case 'vendido':
          case 'pagado':
            zoneData[zonaId].vendidos++;
            break;
          case 'reservado':
            zoneData[zonaId].reservados++;
            break;
          case 'bloqueado':
            zoneData[zonaId].bloqueados++;
            break;
          default:
            zoneData[zonaId].disponibles++;
        }
      }
    });

    // Añadir precios a las zonas
    Object.keys(zoneData).forEach(zonaId => {
      const detalle = Array.isArray(plantillaPrecios?.detalles) ? plantillaPrecios.detalles.find(d => d.zonaId === zonaId) : null;
      zoneData[zonaId].precio = detalle?.precio || 0;
    });

    setSeatStats(stats);
    setZoneStats(Object.values(zoneData));
  }, [mapa, lockedSeats, plantillaPrecios]);

  useEffect(() => {
    calculateSeatStats();
  }, [calculateSeatStats]);

  // Función para obtener el color de un estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible':
        return eventTheme.seatAvailable || '#4CAF50';
      case 'seleccionado':
        return eventTheme.seatSelectedMe || '#ffd700';
      case 'vendido':
      case 'pagado':
        return eventTheme.seatSold || '#2d3748';
      case 'reservado':
        return eventTheme.seatReserved || '#805ad5';
      case 'bloqueado':
        return eventTheme.seatBlocked || '#f56565';
      default:
        return '#4CAF50';
    }
  };

  // Función para obtener el porcentaje de ocupación
  const getOccupancyPercentage = (zone) => {
    const occupied = zone.vendidos + zone.reservados + zone.seleccionados;
    return zone.total > 0 ? Math.round((occupied / zone.total) * 100) : 0;
  };

  // Función para manejar clic en asiento
  const handleSeatClick = (seat) => {
    if (onSeatClick) {
      onSeatClick(seat);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Title level={2} className="mb-4">Boletería Compacta</Title>

      {/* Header con estadísticas generales */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Asientos"
              value={seatStats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Disponibles"
              value={seatStats.disponibles}
              valueStyle={{ color: getStatusColor('disponible') }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Seleccionados"
              value={seatStats.seleccionados}
              valueStyle={{ color: getStatusColor('seleccionado') }}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Vendidos"
              value={seatStats.vendidos}
              valueStyle={{ color: getStatusColor('vendido') }}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>

        {/* Barra de progreso general */}
        <div className="mt-4">
          <Text strong>Ocupación General: </Text>
          <Progress
            percent={seatStats.total > 0 ? Math.round(((seatStats.vendidos + seatStats.reservados + seatStats.seleccionados) / seatStats.total) * 100) : 0}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

      {/* Tabs para cambiar entre vistas */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
        <TabPane tab="Estadísticas" key="stats" />
        <TabPane tab="Mapa Visual" key="map" />
      </Tabs>

      {activeTab === 'stats' ? (
        <>
          {/* Zonas y estadísticas */}
          <Row gutter={[16, 16]}>
            {zoneStats.map((zone, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                <Card
                  size="small"
                  className="h-full"
                  title={
                    <Space>
                      <Text strong>{zone.nombre}</Text>
                      {zone.precio > 0 && (
                        <Tag color="green">${zone.precio}</Tag>
                      )}
                    </Space>
                  }
                  extra={
                    <Tooltip title="Ocupación">
                      <Text type="secondary">{getOccupancyPercentage(zone)}%</Text>
                    </Tooltip>
                  }
                >
                  <div className="space-y-2">
                    {/* Estadísticas de la zona */}
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Statistic
                          title="Total"
                          value={zone.total}
                          size="small"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Disponibles"
                          value={zone.disponibles}
                          valueStyle={{ color: getStatusColor('disponible') }}
                          size="small"
                        />
                      </Col>
                    </Row>

                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <Statistic
                          title="Seleccionados"
                          value={zone.seleccionados}
                          valueStyle={{ color: getStatusColor('seleccionado') }}
                          size="small"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Vendidos"
                          value={zone.vendidos}
                          valueStyle={{ color: getStatusColor('vendido') }}
                          size="small"
                        />
                      </Col>
                    </Row>

                    {/* Barra de progreso de la zona */}
                    <div className="mt-2">
                      <Progress
                        percent={getOccupancyPercentage(zone)}
                        size="small"
                        strokeColor={{
                          '0%': getStatusColor('disponible'),
                          '50%': getStatusColor('seleccionado'),
                          '100%': getStatusColor('vendido'),
                        }}
                      />
                    </div>

                    {/* Detalles adicionales */}
                    <div className="text-xs text-gray-500">
                      <div>Reservados: {zone.reservados}</div>
                      <div>Bloqueados: {zone.bloqueados}</div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Leyenda de colores */}
          <Card className="mt-4" size="small">
            <Title level={5}>Leyenda de Estados</Title>
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
        </>
      ) : (
        /* Vista del mapa visual */
        <div className="text-center p-8">
          <Title level={3}>Mapa Visual</Title>
          <Text>Esta funcionalidad estará disponible próximamente</Text>
        </div>
      )}

      {/* Botón de actualizar */}
      <div className="mt-4 text-center">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={calculateSeatStats}
          loading={loading}
        >
          ðŸ”„ Actualizar Estadísticas
        </Button>
      </div>
    </div>
  );
};

export default CompactBoleteria;


