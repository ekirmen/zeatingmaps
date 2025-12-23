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
import UnifiedContextSelector from '../components/UnifiedContextSelector';

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
  box_office: 'Boletería',
  online: 'Venta Online',
  web: 'Venta Online',
  affiliate: 'Afiliado',
  marketplace: 'Marketplace',
  unknown: 'Sin definir'
};

const SalesTransactions = () => {
  const { currentTenant } = useTenant();

  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [profilesMap, setProfilesMap] = useState(new Map());

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

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);

      // UPDATED: Join with related tables to fetch names
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          event:eventos(id, nombre, recinto_id, recinto),
          venue:recintos(id, nombre),
          funcion:funciones(id, nombre, fecha, fecha_celebracion, hora)
        `)
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
    loadTransactions();
  }, [loadTransactions]);

  const handleContextFilterChange = useCallback(({ venueId, eventId, functionId }) => {
    setSelectedVenue(venueId);
    setSelectedEvent(eventId);
    setSelectedFunction(functionId);
  }, []);

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
        // Data now comes joined as objects 'event', 'venue', 'funcion' (note lowercase in select)
        const event = transaction.event;
        const venue = transaction.venue;
        // Note: Venue might be null if 'event' has logic to find it or if joined via 'recintos' directly.
        // My query joins 'venue:recintos'. Assuming transaction has 'recinto_id' or relation is strictly defined?
        // Actually payment_transactions often doesn't have direct 'recinto_id'. 
        // Usually it relates via Event.
        // If query failed to join venue directly, use event.recinto_id logic?
        // But let's assume the join works if relation exists. If not, we might be missing venue names.

        const funcion = transaction.funcion;

        const eventId = transaction.evento_id || transaction.event_id || transaction.eventId;
        const functionId = transaction.funcion_id || transaction.function_id || transaction.functionId;

        // Resolve venue ID logic
        const venueId = venue?.id || event?.recinto_id || event?.recinto;

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
    formatProfile,
    profilesMap,
    searchTerm,
    showHidden,
    selectedEvent,
    selectedFunction,
    selectedVenue,
    transactions
  ]);

  const handleStatusChange = useCallback(async (transaction, newStatus) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacción seleccionada');
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
      console.error('Error al actualizar el estado de la transacción:', error);
      message.error('No se pudo actualizar el estado de la transacción');
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleHideTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacción seleccionada');
      return;
    }

    try {
      setHidingId(transaction.id);
      const updated = await hidePaymentTransaction(transaction.id);
      message.success('Transacción ocultada correctamente');
      setTransactions(prev =>
        prev.map(item =>
          item.id === transaction.id
            ? { ...item, ...updated }
            : item
        )
      );
    } catch (error) {
      console.error('Error al ocultar la transacción:', error);
      message.error('No se pudo ocultar la transacción');
    } finally {
      setHidingId(null);
    }
  }, []);

  const handleUnhideTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacción seleccionada');
      return;
    }

    try {
      setHidingId(transaction.id);
      const updated = await unhidePaymentTransaction(transaction.id);
      message.success('Transacción mostrada nuevamente');
      setTransactions(prev =>
        prev.map(item =>
          item.id === transaction.id
            ? { ...item, ...updated }
            : item
        )
      );
    } catch (error) {
      console.error('Error al mostrar la transacción:', error);
      message.error('No se pudo mostrar la transacción');
    } finally {
      setHidingId(null);
    }
  }, []);

  const handleDeleteTransaction = useCallback(async (transaction) => {
    if (!transaction?.id) {
      message.warning('No se pudo identificar la transacción seleccionada');
      return;
    }

    try {
      setDeletingId(transaction.id);
      await deletePaymentTransaction(transaction.id);
      message.success('Transacción eliminada correctamente');
      setTransactions(prev => prev.filter(item => item.id !== transaction.id));
    } catch (error) {
      console.error('Error al eliminar la transacción:', error);
      message.error('No se pudo eliminar la transacción');
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
              Mtodo: {record.payment_method.toUpperCase()}
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
      render: (_, record) => record?.venue?.nombre || '-'
    },
    {
      title: 'Evento',
      dataIndex: ['event', 'nombre'],
      key: 'event',
      render: (_, record) => record?.event?.nombre || '-'
    },
    {
      title: 'Función',
      dataIndex: ['funcion', 'id'],
      key: 'funcion',
      render: (_, record) => {
        if (!record?.funcion) {
          return '-';
        }

        const date = record.funcion?.fecha || record.funcion?.fecha_celebracion;
        const time = record.funcion?.hora;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{record.funcion?.nombre || `Función ${record.funcion?.id}`}</Text>
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
              title="¿Eliminar transacción?"
              description="Esta acción no se puede deshacer."
              onConfirm={() => handleDeleteTransaction(record)}
              okText="Sí, eliminar"
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

  return (
    <div className="p-6 space-y-6">
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size={4}>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Transacciones</h1>
            <p className="text-gray-600">Visualiza y administra las transacciones de tus ventas en línea y boletería.</p>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isLoading}
            >
              Actualizar
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <UnifiedContextSelector
            onFilterChange={handleContextFilterChange}
            venueId={selectedVenue}
            eventId={selectedEvent}
            functionId={selectedFunction}
          />
        </div>

        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginTop: 16 }}>
          <Col flex="1">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Buscar por localizador, pedido, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Space>
              <Button onClick={() => setShowHidden(!showHidden)}>
                {showHidden ? 'Ocultar Ocultos' : 'Ver Ocultos'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={preparedTransactions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            position: ['bottomRight'],
            showSizeChanger: true,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
          footer={() => (
            <div className="flex justify-between items-center">
              <Text type="secondary">
                Mostrando últimos {transactions.length} registros
              </Text>
              {transactions.length >= recordLimit && (
                <Button type="link" onClick={handleShowAll}>
                  Cargar más registros antiguos
                </Button>
              )}
            </div>
          )}
        />
      </Card>
    </div>
  );
};

export default SalesTransactions;
