import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
  Button,
  Tag
} from 'antd';
import {
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Title, Paragraph, Text } = Typography;

const DEFAULT_CASHEA_SETTINGS = {
  enabled: false,
  merchantName: '',
  redirectUrl: '',
  deliveryMethod: 'IN_STORE',
  deliveryPrice: 0,
  storeId: '',
  storeName: '',
  logoUrl: ''
};

const DELIVERY_METHODS = [
  { value: 'IN_STORE', label: 'Retiro en tienda' },
  { value: 'PICKUP', label: 'Retiro en punto de entrega' },
  { value: 'DELIVERY', label: 'Entrega a domicilio' }
];

const normalizeCasheaSettings = (rawSettings = {}, fallback = {}) => {
  const normalized = {
    ...DEFAULT_CASHEA_SETTINGS,
    ...fallback,
    ...rawSettings
  };

  if (!normalized.storeId && fallback.id) {
    normalized.storeId = String(fallback.id);
  }
  if (!normalized.storeName && fallback.nombre) {
    normalized.storeName = fallback.nombre;
  }
  if (!normalized.merchantName && fallback.nombre) {
    normalized.merchantName = fallback.nombre;
  }

  normalized.deliveryPrice = Number.isFinite(Number(normalized.deliveryPrice))
    ? Number(normalized.deliveryPrice)
    : 0;

  return normalized;
};

const parseOtrasOpciones = (value) => {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('No se pudo parsear otrasOpciones de evento:', error);
      return {};
    }
  }

  if (typeof value === 'object') {
    return { ...value };
  }

  return {};
};

const CasheaConfig = () => {
  const { currentTenant } = useTenant();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState({});

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('eventos')
        .select('id, nombre, fecha, otrasOpciones, imagenPrincipal')
        .order('created_at', { ascending: false });

      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const prepared = (data || []).map((event) => {
        const otrasOpciones = parseOtrasOpciones(event.otrasOpciones);
        const casheaRaw = otrasOpciones.cashea || {};
        const casheaConfig = normalizeCasheaSettings(casheaRaw, {
          id: event.id,
          nombre: event.nombre,
          logoUrl: event.imagenPrincipal || ''
        });

        return {
          id: event.id,
          nombre: event.nombre,
          fecha: event.fecha,
          otrasOpciones,
          casheaConfig,
          dirty: false
        };
      });

      setEvents(prepared);
    } catch (error) {
      console.error('Error cargando eventos para Cashea:', error);
      message.error('No se pudo cargar la configuración de Cashea');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFieldChange = (eventId, field, value) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              casheaConfig: {
                ...event.casheaConfig,
                [field]: value
              },
              dirty: true
            }
          : event
      )
    );
  };

  const handleToggle = (eventId, enabled) => {
    handleFieldChange(eventId, 'enabled', enabled);
  };

  const handleSave = async (eventId) => {
    const targetEvent = events.find((event) => event.id === eventId);
    if (!targetEvent) return;

    setSaving((prev) => ({ ...prev, [eventId]: true }));

    try {
      const updatedOtrasOpciones = {
        ...(targetEvent.otrasOpciones || {}),
        cashea: {
          ...targetEvent.casheaConfig,
          deliveryPrice: Number.isFinite(Number(targetEvent.casheaConfig.deliveryPrice))
            ? Number(targetEvent.casheaConfig.deliveryPrice)
            : 0
        }
      };

      const { error } = await supabase
        .from('eventos')
        .update({ otrasOpciones: updatedOtrasOpciones })
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                otrasOpciones: updatedOtrasOpciones,
                dirty: false
              }
            : event
        )
      );

      message.success('Configuración de Cashea guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración de Cashea:', error);
      message.error('No se pudo guardar la configuración de Cashea');
    } finally {
      setSaving((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return events;

    return events.filter((event) =>
      event.nombre?.toLowerCase()?.includes(normalizedSearch)
    );
  }, [events, searchTerm]);

  return (
    <div className="p-6">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Configuración Cashea</Title>
          <Paragraph>
            Administra la disponibilidad de Cashea por evento y define los datos necesarios para redirigir al checkout.
          </Paragraph>
        </div>

        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Buscar evento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Button icon={<ReloadOutlined />} onClick={fetchEvents}>
                Recargar
              </Button>
            </Col>
          </Row>
        </Card>

        <Spin spinning={loading} tip="Cargando eventos...">
          {filteredEvents.length === 0 ? (
            <Card>
              <Empty description="No se encontraron eventos" />
            </Card>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div className="flex items-center justify-between">
                          <Space size="small">
                            <Title level={4} style={{ margin: 0 }}>
                              {event.nombre}
                            </Title>
                            {event.casheaConfig.enabled ? (
                              <Tag color="green">Cashea activo</Tag>
                            ) : (
                              <Tag color="red">Cashea desactivado</Tag>
                            )}
                          </Space>
                          <Switch
                            checked={event.casheaConfig.enabled}
                            onChange={(checked) => handleToggle(event.id, checked)}
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                          />
                        </div>
                        {event.fecha && (
                          <Text type="secondary">
                            Fecha: {dayjs(event.fecha).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        )}
                        <Paragraph type="secondary" style={{ marginTop: 12 }}>
                          Define la información necesaria para crear la orden en Cashea cuando los clientes seleccionan este método de pago.
                        </Paragraph>
                      </Space>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Nombre del comercio</Text>
                        <Input
                          placeholder="Nombre mostrado en Cashea"
                          value={event.casheaConfig.merchantName}
                          onChange={(e) => handleFieldChange(event.id, 'merchantName', e.target.value)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>URL de redirección</Text>
                        <Input
                          placeholder="https://tu-sitio.com/cashea/callback"
                          value={event.casheaConfig.redirectUrl}
                          onChange={(e) => handleFieldChange(event.id, 'redirectUrl', e.target.value)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Método de entrega</Text>
                        <Select
                          value={event.casheaConfig.deliveryMethod}
                          onChange={(value) => handleFieldChange(event.id, 'deliveryMethod', value)}
                          disabled={!event.casheaConfig.enabled}
                          options={DELIVERY_METHODS}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Costo de entrega</Text>
                        <InputNumber
                          min={0}
                          style={{ width: '100%' }}
                          value={event.casheaConfig.deliveryPrice}
                          formatter={(value) => `$ ${value ?? 0}`}
                          parser={(value) => (value ? value.replace(/\$\s?/g, '') : '0')}
                          onChange={(value) => handleFieldChange(event.id, 'deliveryPrice', value || 0)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={8}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Logo o imagen (opcional)</Text>
                        <Input
                          placeholder="URL de imagen"
                          value={event.casheaConfig.logoUrl}
                          onChange={(e) => handleFieldChange(event.id, 'logoUrl', e.target.value)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>ID de tienda</Text>
                        <Input
                          placeholder="Identificador único de la tienda"
                          value={event.casheaConfig.storeId}
                          onChange={(e) => handleFieldChange(event.id, 'storeId', e.target.value)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Nombre de tienda</Text>
                        <Input
                          placeholder="Nombre que verá el cliente"
                          value={event.casheaConfig.storeName}
                          onChange={(e) => handleFieldChange(event.id, 'storeName', e.target.value)}
                          disabled={!event.casheaConfig.enabled}
                        />
                      </Space>
                    </Col>
                  </Row>

                  <Row style={{ marginTop: 24 }} justify="end">
                    <Col>
                      <Space>
                        {event.dirty && (
                          <Text type="warning">Hay cambios sin guardar</Text>
                        )}
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={() => handleSave(event.id)}
                          disabled={!event.dirty || !event.casheaConfig.enabled}
                          loading={!!saving[event.id]}
                        >
                          Guardar cambios
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          )}
        </Spin>
      </Space>
    </div>
  );
};

export default CasheaConfig;
