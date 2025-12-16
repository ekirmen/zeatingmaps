/**
 * Componente mejorado para seleccionar opciones de pago en cuotas
 */
import React from 'react';
import { Card, Radio, Space, Typography, Tag, Alert, Divider, Tooltip } from '../utils/antdComponents';
import { CreditCardOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const InstallmentPaymentSelector = ({
  total,
  cantidadCuotas,
  diasEntrePagos,
  cuotasCalculadas = [],
  cuotasSeleccionadas,
  onCuotasChange,
  fechaInicio,
  fechaFin,
  disabled = false
}) => {
  const { t } = useTranslation();


  if (!cantidadCuotas || cantidadCuotas <= 1 || total <= 0) {
    return null;
  }

  // Calcular fechas de vencimiento para cada cuota
  const calcularFechasVencimiento = () => {
    const fechas = [];
    const fechaBase = fechaInicio ? new Date(fechaInicio) : new Date();

    for (let i = 0; i < cantidadCuotas; i++) {
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * diasEntrePagos));
      fechas.push(fechaVencimiento);
    }

    return fechas;
  };

  const fechasVencimiento = calcularFechasVencimiento();
  const montoPorCuota = total / cantidadCuotas;

  return (
    <Card
      className="installment-payment-selector"
      title={
        <Space>
          <CreditCardOutlined />
          <span>{t('installments.title', 'Pago en Cuotas Disponible')}</span>
        </Space>
      }
      extra={
        <Tag color="green">
          {t('installments.available', 'Disponible')}
        </Tag>
      }
      style={{ marginTop: '16px' }}
    >
      <Alert
        message={t('installments.info', 'Puedes pagar este pedido en cuotas cómodas')}
        description={
          <Text type="secondary">
            {t('installments.description', `Divide tu pago en {count} cuotas de ${montoPorCuota.toFixed(2)} cada una`, { count: cantidadCuotas })}
          </Text>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '16px' }}
      />

      <Radio.Group
        value={cuotasSeleccionadas}
        onChange={(e) => onCuotasChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Opción: Pago completo */}
          <Radio.Button value={0} style={{ width: '100%', textAlign: 'left', padding: '12px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <Text strong>{t('installments.full_payment', 'Pago Completo')}</Text>
                <Tag color="blue">${total.toFixed(2)}</Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('installments.full_payment_desc', 'Paga todo ahora y evita cuotas futuras')}
              </Text>
            </Space>
          </Radio.Button>

          <Divider style={{ margin: '8px 0' }}>
            {t('installments.or', 'O')}
          </Divider>

          {/* Opciones de cuotas */}
          {cuotasCalculadas.map((cuota, index) => {
            const fechaVencimiento = fechasVencimiento[index];
            const esUltima = index === cuotasCalculadas.length - 1;

            return (
              <Radio.Button
                key={cuota.numero}
                value={cuota.numero}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px',
                  border: cuotasSeleccionadas === cuota.numero ? '2px solid #1890ff' : '1px solid #d9d9d9'
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <CalendarOutlined />
                      <Text strong>
                        {t('installments.installment_number', 'Cuota {number} de {total}', {
                          number: cuota.numero,
                          total: cantidadCuotas
                        })}
                      </Text>
                      {esUltima && (
                        <Tag color="orange">
                          {t('installments.last', 'Última')}
                        </Tag>
                      )}
                    </Space>
                    <Tag color="green" style={{ fontSize: '14px' }}>
                      ${cuota.monto.toFixed(2)}
                    </Tag>
                  </Space>

                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {t('installments.due_date', 'Vence: {date}', {
                        date: fechaVencimiento.toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      })}
                    </Text>
                    {index > 0 && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {t('installments.days_apart', '{days} días después de la cuota anterior', {
                          days: diasEntrePagos
                        })}
                      </Text>
                    )}
                  </Space>
                </Space>
              </Radio.Button>
            );
          })}
        </Space>
      </Radio.Group>

      {/* Resumen de selección */}
      {cuotasSeleccionadas > 0 && (
        <Card
          size="small"
          style={{
            marginTop: '16px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #91d5ff'
          }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>
              {t('installments.summary', 'Resumen de Pago')}
            </Title>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>
                {t('installments.paying', 'Pagarás ahora:')}
              </Text>
              <Text strong style={{ fontSize: '16px' }}>
                ${cuotasCalculadas
                  .slice(0, cuotasSeleccionadas)
                  .reduce((sum, c) => sum + c.monto, 0)
                  .toFixed(2)}
              </Text>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">
                {t('installments.remaining', 'Pendiente:')}
              </Text>
              <Text type="secondary">
                ${(total - cuotasCalculadas
                  .slice(0, cuotasSeleccionadas)
                  .reduce((sum, c) => sum + c.monto, 0))
                  .toFixed(2)}
              </Text>
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">
                {t('installments.remaining_installments', 'Cuotas pendientes:')}
              </Text>
              <Text type="secondary">
                {cantidadCuotas - cuotasSeleccionadas}
              </Text>
            </Space>
          </Space>
        </Card>
      )}

      {/* Información adicional */}
      {(fechaInicio || fechaFin) && (
        <Alert
          message={t('installments.period_info', 'Período de Pagos a Plazos')}
          description={
            <Space direction="vertical" size={0}>
              {fechaInicio && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('installments.start_date', 'Inicio: {date}', {
                    date: new Date(fechaInicio).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  })}
                </Text>
              )}
              {fechaFin && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {t('installments.end_date', 'Fin: {date}', {
                    date: new Date(fechaFin).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  })}
                </Text>
              )}
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </Card>
  );
};

export default InstallmentPaymentSelector;


