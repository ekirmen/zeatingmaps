import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Alert, Button, Input, Select, Tag, Badge, Statistic, Empty } from '../../utils/antdComponents';
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
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { PageSkeleton } from '../../components/SkeletonLoaders';
import '../styles/store-design.css';

const { Search } = Input;
const { Option } = Select;

const ModernStorePage = () => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { isTenantAdmin } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fecha');

  // Cargar eventos con cache optimizado
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentTenant?.id) {

        return;
      }

      try {
        setLoading(true);

        // Intentar cargar desde cache primero
        const cacheKey = `events_${currentTenant.id}_${statusFilter}_${sortBy}`;
        const cachedEvents = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
        const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp, 10) : Infinity;
        const CACHE_TTL = 30000; // 30 segundos de cache

        // Si hay cache v¡lido (menos de 30 segundos), usarlo
        if (cachedEvents && cacheAge < CACHE_TTL) {
          try {
            const parsedEvents = JSON.parse(cachedEvents);
            setEvents(parsedEvents);
            setLoading(false);
            // Cargar en background para actualizar cache
            fetchEventsFromAPI();
            return;
          } catch (e) {
          }
        }

        // Cargar desde API
        await fetchEventsFromAPI();
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err);
        setLoading(false);
      }
    };

    const fetchEventsFromAPI = async () => {
      try {
        let query = supabase
          .from('eventos')
          .select('*, recintos(nombre)')
          .eq('tenant_id', currentTenant.id);

        // Aplicar filtros
        if (statusFilter !== 'all') {
          query = query.eq('estadoVenta', statusFilter);
        }

        // Aplicar ordenamiento
        if (sortBy === 'fecha') {
          query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'nombre') {
          query = query.order('nombre', { ascending: true });
        } else if (sortBy === 'creado') {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const eventsData = data || [];
        setEvents(eventsData);

        // Guardar en cache
        const cacheKey = `events_${currentTenant.id}_${statusFilter}_${sortBy}`;
        sessionStorage.setItem(cacheKey, JSON.stringify(eventsData));
        sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      } catch (err) {
        console.error('Error fetching events from API:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentTenant?.id, statusFilter, sortBy]);

  // Filtrar eventos por t©rmino de bºsqueda
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

  // Funci³n para obtener el estado visual del evento
  const getEventStatus = (event) => {
    if (event.desactivado) return { status: 'error', text: 'Desactivado', color: 'red' };
    if (!event.activo) return { status: 'warning', text: 'Inactivo', color: 'orange' };
    if (event.estadoVenta === 'a-la-venta') return { status: 'success', text: 'A la Venta', color: 'green' };
    if (event.estadoVenta === 'agotado') return { status: 'error', text: 'Agotado', color: 'red' };
    if (event.estadoVenta === 'pronto') return { status: 'processing', text: 'Pronto', color: 'blue' };
    return { status: 'default', text: 'Disponible', color: 'default' };
  };

  // Funci³n para obtener el modo de venta
  const getModoVenta = (event) => {
    const modos = {
      'normal': { text: 'Normal', color: 'blue' },
      'preventa': { text: 'Preventa', color: 'orange' },
      'especial': { text: 'Especial', color: 'purple' },
      'gratis': { text: 'Gratuito', color: 'green' },
      'mapa': { text: 'Mapa', color: 'cyan' }
    };
    return modos[event.modoVenta] || { text: 'Normal', color: 'default' };
  };

  // Funci³n para parsear tags
  const getEventTags = (event) => {
    if (!event.tags) return [];
    try {
      const tags = typeof event.tags === 'string' ? JSON.parse(event.tags) : event.tags;
      return Array.isArray(tags) ? tags : [];
    } catch (e) {
      return [];
    }
  };

  const handleEventClick = (event, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!event || (!event.slug && !event.id)) {
      return;
    }

    const eventPath = event.slug
      ? `/store/eventos/${event.slug}`
      : `/store/event/${event.id}`;

    navigate(eventPath);
  };

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  if (error) {
    return (
      <div className="store-page">
        <div className="store-container-wrapper">
          <div className="store-card" style={{ marginTop: 'var(--store-space-8)' }}>
            <div className="store-card-body">
              <Alert
                message="Error"
                description="No se pudieron cargar los eventos. Por favor, intenta de nuevo."
                type="error"
                showIcon
                action={
                  <Button size="small" onClick={() => window.location.reload()}>
                    Recargar
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Hero Section */}
      <div className="store-hero-section" style={{
        background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)',
        padding: isMobile ? 'var(--store-space-8) var(--store-space-4)' : 'var(--store-space-20) var(--store-space-6)',
        color: 'var(--store-text-inverse)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="store-page-title" style={{
            color: 'var(--store-text-inverse)',
            fontSize: isMobile ? 'var(--store-font-size-2xl)' : 'var(--store-font-size-5xl)',
            marginBottom: 'var(--store-space-4)',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Eventos Disponibles
          </h1>
          <p className="store-page-subtitle" style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? 'var(--store-font-size-base)' : 'var(--store-font-size-xl)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Descubre los mejores eventos y experiencias ºnicas
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="store-container-wrapper" style={{ paddingTop: 'var(--store-space-8)', paddingBottom: 'var(--store-space-8)' }}>
        {/* Filtros y bºsqueda */}
        <div className="store-card" style={{ marginBottom: 'var(--store-space-8)' }}>
          <div className="store-card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2fr 1fr 1fr auto',
              gap: 'var(--store-space-4)',
              alignItems: 'stretch'
            }}>
              <Search
                placeholder="Buscar eventos..."
                allowClear
                size={isMobile ? 'middle' : 'large'}
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%'
                }}
                onPressEnter={() => {
                  // Search is handled by the filter effect
                }}
              />

              <Select
                placeholder="Estado"
                size={isMobile ? 'middle' : 'large'}
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="all">Todos</Option>
                <Option value="a-la-venta">A la Venta</Option>
                <Option value="pronto">Pronto</Option>
                <Option value="agotado">Agotado</Option>
              </Select>

              <Select
                placeholder="Ordenar"
                size={isMobile ? 'middle' : 'large'}
                style={{ width: '100%' }}
                value={sortBy}
                onChange={setSortBy}
              >
                <Option value="fecha">Fecha</Option>
                <Option value="nombre">Nombre</Option>
                <Option value="creado">Recientes</Option>
              </Select>

              {!isMobile && (
                <div style={{ textAlign: 'right' }}>
                  <Statistic
                    title="Eventos"
                    value={filteredEvents.length}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ fontSize: 'var(--store-font-size-lg)', fontWeight: 700 }}
                  />
                </div>
              )}
            </div>

            {isMobile && (
              <div style={{ marginTop: 'var(--store-space-4)', textAlign: 'center' }}>
                <Statistic
                  title="Eventos encontrados"
                  value={filteredEvents.length}
                  prefix={<TrophyOutlined />}
                />
              </div>
            )}
          </div>
        </div>

        {/* Grid de eventos */}
        {filteredEvents.length === 0 ? (
          <div className="store-card">
            <div className="store-card-body" style={{ textAlign: 'center', padding: 'var(--store-space-12)' }}>
              <Empty
                description="No se encontraron eventos"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {searchTerm && (
                  <Button type="primary" onClick={() => setSearchTerm('')}>
                    Limpiar bºsqueda
                  </Button>
                )}
              </Empty>
            </div>
          </div>
        ) : (
          <div className="store-grid store-grid-auto" style={{ marginBottom: 'var(--store-space-8)' }}>
            {filteredEvents.map((event) => {
              const eventStatus = getEventStatus(event);
              const modoVenta = getModoVenta(event);
              const tags = getEventTags(event);

              return (
                <div
                  key={event.id}
                  className="store-event-card"
                  onClick={(e) => handleEventClick(event, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleEventClick(event, e);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Imagen del evento */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: isMobile ? '200px' : '240px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--store-gray-100) 0%, var(--store-gray-200) 100%)'
                  }}>
                    <EventImage
                      event={event}
                      imageType="banner"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      showDebug={false}
                    />

                    {/* Badges overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 'var(--store-space-3)',
                      right: 'var(--store-space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--store-space-2)',
                      zIndex: 10
                    }}>
                      <Badge
                        status={eventStatus.status}
                        text={eventStatus.text}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 'var(--store-radius-full)',
                          padding: 'var(--store-space-1) var(--store-space-2)',
                          fontSize: 'var(--store-font-size-xs)',
                          fontWeight: 600,
                          boxShadow: 'var(--store-shadow-sm)'
                        }}
                      />
                      <Tag
                        color={modoVenta.color}
                        style={{
                          fontSize: 'var(--store-font-size-xs)',
                          margin: 0,
                          boxShadow: 'var(--store-shadow-sm)'
                        }}
                      >
                        {modoVenta.text}
                      </Tag>
                    </div>

                    {event.oculto && (
                      <div style={{
                        position: 'absolute',
                        top: 'var(--store-space-3)',
                        left: 'var(--store-space-3)'
                      }}>
                        <Tag color="red" icon={<EyeOutlined />} style={{ fontSize: 'var(--store-font-size-xs)' }}>
                          Oculto
                        </Tag>
                      </div>
                    )}
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="store-event-card-content">
                    {/* T­tulo */}
                    <h3 className="store-event-card-title">
                      {event.nombre}
                    </h3>

                    {/* Descripci³n */}
                    {event.descripcion && (
                      <p className="store-event-card-description">
                        {event.descripcion}
                      </p>
                    )}

                    {/* Informaci³n del evento */}
                    <div className="store-event-card-meta">
                      {event.created_at && (
                        <div className="store-event-card-meta-item">
                          <CalendarOutlined style={{ color: 'var(--store-primary)' }} />
                          <span>{formatDateString(event.created_at)}</span>
                        </div>
                      )}

                      {event.recintos?.nombre && (
                        <div className="store-event-card-meta-item">
                          <EnvironmentOutlined style={{ color: 'var(--store-success)' }} />
                          <span>{event.recintos.nombre}</span>
                        </div>
                      )}

                      {event.sector && (
                        <div className="store-event-card-meta-item">
                          <TeamOutlined style={{ color: 'var(--store-secondary)' }} />
                          <span>{event.sector}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--store-space-1)',
                        marginBottom: 'var(--store-space-4)'
                      }}>
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

                    {/* Footer con bot³n */}
                    <div className="store-event-card-footer">
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEventClick(event, e);
                        }}
                        block
                        className="store-button store-button-primary"
                        style={{ marginTop: 'auto' }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estad­sticas generales */}
        <div className="store-card">
          <div className="store-card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 'var(--store-space-4)',
              textAlign: 'center'
            }}>
              <Statistic
                title="Total"
                value={events.length}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: 'var(--store-primary)' }}
              />
              <Statistic
                title="A la Venta"
                value={events.filter(e => e.estadoVenta === 'a-la-venta').length}
                prefix={<FireOutlined />}
                valueStyle={{ color: 'var(--store-success)' }}
              />
              <Statistic
                title="Pr³ximamente"
                value={events.filter(e => e.estadoVenta === 'pronto').length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: 'var(--store-primary)' }}
              />
              <Statistic
                title="Agotados"
                value={events.filter(e => e.estadoVenta === 'agotado').length}
                prefix={<StarOutlined />}
                valueStyle={{ color: 'var(--store-error)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernStorePage;


