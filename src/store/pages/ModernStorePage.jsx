import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Alert, Button, Input, Select, Tag, Badge, Statistic } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import formatDateString from '../../utils/formatDateString';
import EventImage from '../components/EventImage';
import { useTenant } from '../../contexts/TenantContext';

const { Search } = Input;
const { Option } = Select;

const ModernStorePage = () => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fecha');

  // Cargar eventos
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('eventos')
          .select(`
            *,
            recintos!eventos_recinto_fkey (
              id,
              nombre,
              direccion,
              capacidad
            )
          `)
          .eq('tenant_id', currentTenant?.id)
          .eq('activo', true)
          .eq('oculto', false);

        // Aplicar filtros
        if (statusFilter !== 'all') {
          query = query.eq('estadoVenta', statusFilter);
        }

        // Aplicar ordenamiento
        if (sortBy === 'fecha') {
          query = query.order('fecha_evento', { ascending: true });
        } else if (sortBy === 'nombre') {
          query = query.order('nombre', { ascending: true });
        } else if (sortBy === 'creado') {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentTenant?.id) {
      fetchEvents();
    }
  }, [currentTenant?.id, statusFilter, sortBy]);

  // Filtrar eventos por término de búsqueda
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      event.nombre?.toLowerCase().includes(searchLower) ||
      event.descripcion?.toLowerCase().includes(searchLower) ||
      event.sector?.toLowerCase().includes(searchLower) ||
      event.recintos?.nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Función para obtener el estado visual del evento
  const getEventStatus = (event) => {
    if (event.desactivado) return { status: 'error', text: 'Desactivado', color: 'red' };
    if (!event.activo) return { status: 'warning', text: 'Inactivo', color: 'orange' };
    if (event.estadoVenta === 'a-la-venta') return { status: 'success', text: 'A la Venta', color: 'green' };
    if (event.estadoVenta === 'agotado') return { status: 'error', text: 'Agotado', color: 'red' };
    if (event.estadoVenta === 'pronto') return { status: 'processing', text: 'Pronto', color: 'blue' };
    return { status: 'default', text: 'Disponible', color: 'default' };
  };

  // Función para obtener el modo de venta
  const getModoVenta = (event) => {
    const modos = {
      'normal': { text: 'Normal', color: 'blue' },
      'preventa': { text: 'Preventa', color: 'orange' },
      'especial': { text: 'Especial', color: 'purple' },
      'gratis': { text: 'Gratuito', color: 'green' }
    };
    return modos[event.modoVenta] || { text: 'Normal', color: 'default' };
  };

  // Función para parsear tags
  const getEventTags = (event) => {
    if (!event.tags) return [];
    try {
      const tags = typeof event.tags === 'string' ? JSON.parse(event.tags) : event.tags;
      return Array.isArray(tags) ? tags : [];
    } catch (e) {
      return [];
    }
  };

  const handleEventClick = (event) => {
    navigate(`/store/eventos/${event.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert
          message="Error"
          description="No se pudieron cargar los eventos"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Eventos Disponibles
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              Descubre los mejores eventos y experiencias únicas
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filtros y búsqueda */}
        <Card className="mb-8 shadow-lg border-0">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Buscar eventos..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Estado"
                size="large"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                prefix={<FilterOutlined />}
              >
                <Option value="all">Todos</Option>
                <Option value="a-la-venta">A la Venta</Option>
                <Option value="pronto">Pronto</Option>
                <Option value="agotado">Agotado</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Ordenar por"
                size="large"
                style={{ width: '100%' }}
                value={sortBy}
                onChange={setSortBy}
              >
                <Option value="fecha">Fecha</Option>
                <Option value="nombre">Nombre</Option>
                <Option value="creado">Recientes</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-right">
                <Statistic
                  title="Eventos encontrados"
                  value={filteredEvents.length}
                  prefix={<TrophyOutlined />}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Grid de eventos */}
        {filteredEvents.length === 0 ? (
          <Card className="text-center py-12">
            <Alert
              message="No se encontraron eventos"
              description="No hay eventos que coincidan con los criterios de búsqueda."
              type="info"
              showIcon
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredEvents.map((event) => {
              const eventStatus = getEventStatus(event);
              const modoVenta = getModoVenta(event);
              const tags = getEventTags(event);
              
              return (
                <Col key={event.id} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    hoverable
                    className="h-full shadow-lg border-0 overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
                    onClick={() => handleEventClick(event)}
                    cover={
                      <div className="relative h-48 overflow-hidden">
                        <EventImage
                          event={event}
                          imageType="logoHorizontal"
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          showDebug={false}
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <Badge 
                            status={eventStatus.status} 
                            text={eventStatus.text}
                            className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium"
                          />
                          <Tag color={modoVenta.color} className="text-xs">
                            {modoVenta.text}
                          </Tag>
                        </div>
                        {event.oculto && (
                          <div className="absolute top-3 left-3">
                            <Tag color="red" icon={<EyeOutlined />} className="text-xs">
                              Oculto
                            </Tag>
                          </div>
                        )}
                      </div>
                    }
                    actions={[
                      <Button 
                        type="primary" 
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        block
                      >
                        Ver Detalles
                      </Button>
                    ]}
                  >
                    <div className="space-y-3">
                      {/* Título del evento */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                          {event.nombre}
                        </h3>
                        {event.descripcion && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {event.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Información del evento */}
                      <div className="space-y-2">
                        {event.fecha_evento && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <CalendarOutlined className="mr-2 text-blue-500" />
                            <span>{formatDateString(event.fecha_evento)}</span>
                          </div>
                        )}
                        
                        {event.recintos && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <EnvironmentOutlined className="mr-2 text-green-500" />
                            <span>{event.recintos.nombre}</span>
                          </div>
                        )}
                        
                        {event.sector && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <TeamOutlined className="mr-2 text-purple-500" />
                            <span>{event.sector}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index} size="small" color="blue">
                              {tag}
                            </Tag>
                          ))}
                          {tags.length > 3 && (
                            <Tag size="small" color="default">
                              +{tags.length - 3}
                            </Tag>
                          )}
                        </div>
                      )}

                      {/* Información adicional */}
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                        <span>Creado: {formatDateString(event.created_at)}</span>
                        <span>ID: {event.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Estadísticas generales */}
        <Card className="mt-8 shadow-lg border-0">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total de Eventos"
                value={events.length}
                prefix={<TrophyOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="A la Venta"
                value={events.filter(e => e.estadoVenta === 'a-la-venta').length}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Próximamente"
                value={events.filter(e => e.estadoVenta === 'pronto').length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Agotados"
                value={events.filter(e => e.estadoVenta === 'agotado').length}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ModernStorePage;
