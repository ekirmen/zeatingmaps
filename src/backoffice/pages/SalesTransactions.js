import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from '../../utils/antdComponents';
import { EyeInvisibleOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { format, parseISO } from 'date-fns';

import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import {
  deletePaymentTransaction,
  hidePaymentTransaction,
  unhidePaymentTransaction,
  updatePaymentTransactionStatus
} from '../../services/paymentTransactionsService';

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Pagado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'canceled', label: 'Cancelado' }
];

const STATUS_COLORS = {
  pending: 'orange',
  completed: 'green',
  failed: 'red',
  refunded: 'gold',
  canceled: 'default'
};

const SOURCE_LABELS = {
  box_office: 'Boleter­a',
  online: 'Venta Online',
  web: 'Venta Online',
  affiliate: 'Afiliado',
  marketplace: 'Marketplace',
  unknown: 'Sin definir'
};

const SalesTransactions = () => {
  const { currentTenant } = useTenant();

  const [isLoading, setIsLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [profilesMap, setProfilesMap] = useState(new Map());
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);

  const [recordLimit, setRecordLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedFunction, setSelectedFunction] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [hidingId, setHidingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  const isMultiTenant = useMemo(() => currentTenant?.id && currentTenant.id !== 'main-domain', [currentTenant?.id]);

  const loadFilters = useCallback(async () => {
    try {
      setFiltersLoading(true);

      let recintosQuery = supabase
        .from('recintos')
        .select('id, nombre');

      let eventosQuery = supabase
        .from('eventos')
        .select('id, nombre, recinto, recinto_id, tenant_id');

      let funcionesQuery = supabase
        .from('funciones')
        .select('*');

      if (isMultiTenant) {
        recintosQuery = recintosQuery.eq('tenant_id', currentTenant.id);
        eventosQuery = eventosQuery.eq('tenant_id', currentTenant.id);
        funcionesQuery = funcionesQuery.eq('tenant_id', currentTenant.id);
      }

      const [recintosResponse, eventosResponse] = await Promise.all([
        recintosQuery,
        eventosQuery
      ]);

      const handleFuncionesFallback = async (error) => {
        console.warn('š ï¸ [SalesTransactions] Error cargando funciones, usando fallback select("*"):', error);
        let fallbackQuery = supabase
          .from('funciones')
          .select('*');

        if (isMultiTenant) {
          fallbackQuery = fallbackQuery.eq('tenant_id', currentTenant.id);
        }

        const fallbackResponse = await fallbackQuery;

        if (fallbackResponse.error) {
          console.error('Œ [SalesTransactions] Error en fallback de funciones:', fallbackResponse.error);
          return fallbackResponse;
        }

        return {
          data: fallbackResponse.data || [],
          error: null
        };
      };

      let funcionesResponse = await funcionesQuery;

      if (funcionesResponse.error) {
        funcionesResponse = await handleFuncionesFallback(funcionesResponse.error);
      }

      if (recintosResponse.error) {
        console.error('Error cargando recintos:', recintosResponse.error);
        message.error('No se pudieron cargar los recintos');
      } else {
        setVenues(recintosResponse.data || []);
      }

      if (eventosResponse.error) {
        console.error('Error cargando eventos:', eventosResponse.error);
        message.error('No se pudieron cargar los eventos');
      } else {
        setEvents(eventosResponse.data || []);
      }

      if (funcionesResponse.error) {
        console.error('Error cargando funciones:', funcionesResponse.error);
        message.error('No se pudieron cargar las funciones');
      } else {
        const normalizedFunctions = (funcionesResponse.data || []).map(funcion => {
          const fechaCelebracion =
            funcion.fecha_celebracion ||
            funcion.fechaCelebracion ||
            funcion.fecha ||
            null;

          let hora = funcion.hora;

          if (!hora && fechaCelebracion) {
            try {
              const parsed = new Date(fechaCelebracion);

              if (!Number.isNaN(parsed.getTime())) {
                const hours = String(parsed.getHours()).padStart(2, '0');
                const minutes = String(parsed.getMinutes()).padStart(2, '0');
                hora = `${hours}:${minutes}`;
              }
            } catch (parseError) {
            }
          }

          let nombre = funcion.nombre;

          if (!nombre) {
            if (fechaCelebracion) {
              try {
                const parsed = new Date(fechaCelebracion);

                if (!Number.isNaN(parsed.getTime())) {
                  nombre = new Intl.DateTimeFormat('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }).format(parsed);
                }
              } catch (formatError) {
              }
            }

            if (!nombre) {
              nombre = `Funci³n ${funcion.id}`;
            }
          }

          return {
            ...funcion,
            nombre,
            fecha: funcion.fecha || fechaCelebracion,
            hora,
            fecha_celebracion: fechaCelebracion
          };
        });

        setFunctions(normalizedFunctions);
      }
    } catch (error) {
      console.error('Error al cargar filtros de transacciones:', error);
      message.error('No se pudieron cargar los filtros');
    } finally {
      setFiltersLoading(false);
    }
  }, [currentTenant?.id, isMultiTenant]);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(recordLimit);

      if (isMultiTenant) {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setTransactions(data || []);

      const profileIds = Array.from(
        new Set(
          (data || [])
            .flatMap(transaction => [transaction?.user_id, transaction?.processed_by])
            .filter(Boolean)
        )
      );

      if (!profileIds.length) {
        setProfilesMap(new Map());
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email:login')
        .in('id', profileIds);

      if (profilesError) {
        console.error('Error cargando perfiles relacionados:', profilesError);
        return;
      }

      const normalizedProfiles = (profilesData || []).map(profile => {
        const computedFullName = [profile?.nombre, profile?.apellido]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          ...profile,
          full_name: computedFullName || null
        };
      });

      setProfilesMap(new Map(normalizedProfiles.map(profile => [profile.id, profile])));
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      message.error('No se pudieron cargar las transacciones');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id, isMultiTenant, recordLimit]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setSelectedEvent('all');
    setSelectedFunction('all');
  }, [selectedVenue]);

  useEffect(() => {
    setSelectedFunction('all');
  }, [selectedEvent]);

  const venuesMap = useMemo(
    () => new Map((venues || []).map(venue => [String(venue.id), venue])),
    [venues]
  );

  const eventsMap = useMemo(
    () => new Map((events || []).map(event => [String(event.id), event])),
    [events]
  );

  const functionsMap = useMemo(
    () => new Map((functions || []).map(funcion => [String(funcion.id), funcion])),
    [functions]
  );

  const filteredEvents = useMemo(() => {
    if (selectedVenue === 'all') {
      return events;
    }

    return (events || []).filter(event => {
      const eventVenueId = event?.recinto || event?.recinto_id;
      return eventVenueId && String(eventVenueId) === String(selectedVenue);
    });
  }, [events, selectedVenue]);

  const filteredFunctions = useMemo(() => {
    if (selectedEvent === 'all') {
      return functions;
    }

    return (functions || []).filter(funcion => {
      const eventId = funcion?.evento_id;
      return eventId && String(eventId) === String(selectedEvent);
    });
  }, [functions, selectedEvent]);

  const formatProfile = useCallback((profile) => {
    if (!profile) {
      return { name: 'Sin asignar', email: null };
    }

    const name = profile?.nombre || profile?.full_name || profile?.email || 'Sin nombre';
    return {
      name,
      email: profile?.email || null
    };
  }, []);

  const preparedTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (transactions || [])
      .map(transaction => {
        const eventId = transaction?.evento_id || transaction?.event_id || transaction?.eventId;
        const functionId = transaction?.funcion_id || transaction?.function_id || transaction?.functionId;

        const event = eventId ? eventsMap.get(String(eventId)) : null;
        const funcion = functionId ? functionsMap.get(String(functionId)) : null;
        const venueId = event?.recinto || event?.recinto_id;
        const venue = venueId ? venuesMap.get(String(venueId)) : null;

        const buyerProfile = transaction?.user_id ? profilesMap.get(transaction.user_id) : null;
        const sellerProfile = transaction?.processed_by ? profilesMap.get(transaction.processed_by) : null;

        const buyer = formatProfile(buyerProfile);
        const seller = formatProfile(sellerProfile);

        const rawSource = transaction?.channel || transaction?.source || transaction?.sales_channel;
        const normalizedSource = typeof rawSource === 'string'
          ? rawSource.toLowerCase()
          : rawSource;
        let sourceLabel = SOURCE_LABELS[normalizedSource];
        if (!sourceLabel) {
          if (transaction?.processed_by) {
            sourceLabel = SOURCE_LABELS.box_office;
          } else {
            sourceLabel = SOURCE_LABELS.online;
          }
        }

        const isHidden = transaction?.is_hidden ?? Boolean(transaction?.hidden_at);

        return {
          ...transaction,
          event,
          funcion,
          venue,
          buyer,
          seller,
          sourceLabel,
          isHidden,
          eventId: eventId ? String(eventId) : null,
          functionId: functionId ? String(functionId) : null,
          venueId: venueId ? String(venueId) : null,
          matchesSearch: normalizedSearch
            ? [
              transaction?.locator,
              transaction?.order_id,
              transaction?.gateway_transaction_id,
              buyer?.name,
              buyer?.email,
              seller?.name,
              seller?.email
            ]
              .filter(Boolean)
              .some(value => String(value).toLowerCase().includes(normalizedSearch))
            : true
        };
      })
      .filter(transaction => {
        if (!transaction.matchesSearch) {
          return false;
        }

        if (!showHidden && transaction.isHidden) {
          return false;
        }

        if (selectedVenue !== 'all' && transaction.venueId !== String(selectedVenue)) {
          return false;
        }

        if (selectedEvent !== 'all' && transaction.eventId !== String(selectedEvent)) {
          return false;
        }

        if (selectedFunction !== 'all' && transaction.functionId !== String(selectedFunction)) {
          return false;
        }

        return true;
      });
  }, [
    eventsMap,
    formatProfile,
    functionsMap,
    profilesMap,
    searchTerm,
    showHidden,
    selectedEvent,
    selectedFunction,
    selectedVenue,
    transactions,
    venuesMap
  ]);

  const handleStatusChange = useCallback(async (transaction, newStatus) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacci³n seleccionada');
      return;
    }

    try {
      setUpdatingId(transaction.id);
      await updatePaymentTransactionStatus(transaction.id, newStatus);
      message.success('Estado actualizado correctamente');
      setTransactions(prev =>
        prev.map(item =>
          item.id === transaction.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error('Error al actualizar el estado de la transacci³n:', error);
      message.error('No se pudo actualizar el estado de la transacci³n');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleHideTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacci³n seleccionada');
      return;
    }

    try {
      setHidingId(transaction.id);
      const updated = await hidePaymentTransaction(transaction.id);
      message.success('Transacci³n ocultada correctamente');
      setTransactions(prev =>
        prev.map(item =>
          item.id === transaction.id
            ? { ...item, ...updated }
            : item
        )
      );
    } catch (error) {
      console.error('Error al ocultar la transacci³n:', error);
      message.error('No se pudo ocultar la transacci³n');
    } finally {
      setHidingId(null);
    }
  }, []);

  const handleUnhideTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacci³n seleccionada');
      return;
    }

    try {
      setHidingId(transaction.id);
      const updated = await unhidePaymentTransaction(transaction.id);
      message.success('Transacci³n mostrada nuevamente');
      setTransactions(prev =>
        prev.map(item =>
          item.id === transaction.id
            ? { ...item, ...updated }
            : item
        )
      );
    } catch (error) {
      console.error('Error al mostrar la transacci³n:', error);
      message.error('No se pudo mostrar la transacci³n');
    } finally {
      setHidingId(null);
    }
  }, []);

  const handleDeleteTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacci³n seleccionada');
      return;
    }

    try {
      setDeletingId(transaction.id);
      await deletePaymentTransaction(transaction.id);
      message.success('Transacci³n eliminada correctamente');
      setTransactions(prev => prev.filter(item => item.id !== transaction.id));
    } catch (error) {
      console.error('Error al eliminar la transacci³n:', error);
      message.error('No se pudo eliminar la transacci³n');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Localizador',
      dataIndex: 'locator',
      key: 'locator',
      render: (locator, record) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable>{locator || record?.id}</Text>
          {record?.order_id && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Pedido: {record.order_id}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, record) => {
        const amount = record?.amount ?? record?.monto ?? 0;
        const currency = record?.currency || 'USD';
        return (
          <Text>{new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency
          }).format(Number(amount) || 0)}</Text>
        );
      }
    },
    {
      title: 'Pasarela',
      dataIndex: 'gateway_name',
      key: 'gateway_name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record?.gateway_name || record?.gateway_id || 'Sin definir'}</Text>
          {record?.payment_method && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              M©todo: {record.payment_method.toUpperCase()}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space direction="vertical" size={4}>
          <Tag color={STATUS_COLORS[status] || 'default'}>
            {(STATUS_OPTIONS.find(option => option.value === status)?.label || status || 'Desconocido').toUpperCase()}
          </Tag>
          <Select
            size="small"
            value={status || 'pending'}
            options={STATUS_OPTIONS}
            onChange={value => handleStatusChange(record, value)}
            loading={updatingId === record?.id}
            style={{ minWidth: 140 }}
          />
        </Space>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt) => createdAt
        ? format(new Date(createdAt), 'dd/MM/yyyy, HH:mm:ss')

        : 'Sin fecha'
    },
    {
      title: 'Recinto',
      dataIndex: ['venue', 'nombre'],
      key: 'venue',
      render: (_, record) => record?.venue?.nombre || '-”'
    },
    {
      title: 'Evento',
      dataIndex: ['event', 'nombre'],
      key: 'event',
      render: (_, record) => record?.event?.nombre || '-”'
    },
    {
      title: 'Funci³n',
      dataIndex: ['funcion', 'id'],
      key: 'funcion',
      render: (_, record) => {
        if (!record?.funcion) {
          return '-”';
        }

        const date = record.funcion?.fecha || record.funcion?.fecha_celebracion;
        const time = record.funcion?.hora;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{record.funcion?.nombre || `Funci³n ${record.funcion?.id}`}</Text>
            {(date || time) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {[date ? format(new Date(date), 'dd/MM/yyyy') : null, time].filter(Boolean).join(' · ')}
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Comprador',
      dataIndex: 'buyer',
      key: 'buyer',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record?.buyer?.name}</Text>
          {record?.buyer?.email && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.buyer.email}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Vendedor',
      dataIndex: 'seller',
      key: 'seller',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record?.seller?.name}</Text>
          {record?.seller?.email && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.seller.email}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Canal',
      dataIndex: 'sourceLabel',
      key: 'sourceLabel',
      render: (sourceLabel) => sourceLabel || 'Sin definir'
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        const isProcessing = [updatingId, hidingId, deletingId].includes(record?.id);
        return (
          <Space>
            {record?.isHidden ? (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleUnhideTransaction(record)}
                loading={hidingId === record?.id}
                disabled={isProcessing}
              >
                Mostrar
              </Button>
            ) : (
              <Button
                size="small"
                icon={<EyeInvisibleOutlined />}
                onClick={() => handleHideTransaction(record)}
                loading={hidingId === record?.id}
                disabled={isProcessing}
              >
                Ocultar
              </Button>
            )}
            <Popconfirm
              title="¿Eliminar transacci³n?"
              description="Esta acci³n no se puede deshacer."
              onConfirm={() => handleDeleteTransaction(record)}
              okText="S­, eliminar"
              cancelText="Cancelar"
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deletingId === record?.id}
                disabled={isProcessing}
              >
                Eliminar
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ], [
    deletingId,
    handleDeleteTransaction,
    handleHideTransaction,
    handleStatusChange,
    handleUnhideTransaction,
    hidingId,
    updatingId
  ]);

  const handleShowAll = useCallback(() => {
    setRecordLimit(500);
  }, []);

  const handleRefresh = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  const venueOptions = useMemo(() => [
    { value: 'all', label: 'Todos los recintos' },
    ...(venues || []).map(venue => ({
      value: String(venue.id),
      label: venue.nombre
    }))
  ], [venues]);

  const eventOptions = useMemo(() => [
    { value: 'all', label: 'Todos los eventos' },
    ...(filteredEvents || []).map(event => ({
      value: String(event.id),
      label: event.nombre
    }))
  ], [filteredEvents]);

  const functionOptions = useMemo(() => [
    { value: 'all', label: 'Todas las funciones' },
    ...(filteredFunctions || []).map(funcion => ({
      value: String(funcion.id),
      label: (() => {
        const pieces = [];
        if (funcion.nombre) {
          pieces.push(funcion.nombre);
        } else {
          pieces.push(`Funci³n ${funcion.id}`);
        }

        const fecha = funcion.fecha || funcion.fecha_celebracion;
        const hora = funcion.hora;
        const schedule = [
          fecha ? format(new Date(fecha), 'dd/MM/yyyy') : null,
          hora
        ]
          .filter(Boolean)
          .join(' · ');

        if (schedule) {
          pieces.push(schedule);
        }

        return pieces.join(' -” ');
      })()
    }))
  ], [filteredFunctions]);

  return (
    <div className="p-6 space-y-6">
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              Gesti³n de Transacciones
            </Title>
            <Text type="secondary">
              Visualiza y administra las transacciones de tus ventas en l­nea y boleter­a.
            </Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
              Actualizar
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false} className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              allowClear
              placeholder="Buscar por localizador, pedido o cliente"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              loading={filtersLoading}
              options={venueOptions}
              value={selectedVenue}
              onChange={setSelectedVenue}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              loading={filtersLoading}
              options={eventOptions}
              value={selectedEvent}
              onChange={setSelectedEvent}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              loading={filtersLoading}
              options={functionOptions}
              value={selectedFunction}
              onChange={setSelectedFunction}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Col>
        </Row>
      </Card>

      <Card
        className="shadow-sm"
        title="Transacciones Recientes"
        extra={
          <Space>
            <Button type="link" onClick={() => setShowHidden(prev => !prev)}>
              {showHidden ? 'Ocultar transacciones ocultas' : 'Mostrar transacciones ocultas'}
            </Button>
            <Button type="link" onClick={handleShowAll}>
              Ver Todas
            </Button>
          </Space>
        }
      >
        <Table
          rowKey={record => record.id}
          loading={isLoading}
          columns={columns}
          dataSource={preparedTransactions}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default SalesTransactions;


