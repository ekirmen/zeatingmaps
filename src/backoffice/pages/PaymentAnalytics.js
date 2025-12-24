import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Button,
  Typography,
  Space,
  Tag,
  Spin,
  Empty
} from '../../utils/antdComponents';
import {
  DollarOutlined,
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  RiseOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Componente simple para gráficos básicos usando divs y CSS
const SimpleBarChart = ({ data, dataKey, color = '#1890ff', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d[dataKey])) || 1;

  return (
    <div style={{ height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '16px 0' }}>
      {data.map((item, index) => {
        const value = item[dataKey] || 0;
        const heightPercent = (value / maxValue) * 80;

        return (
          <div
            key={index}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <div
              style={{
                height: `${heightPercent}%`,
                backgroundColor: color,
                width: '80%',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease'
              }}
            />
            <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
              {item.name || item.date || item.month}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#333' }}>
              ${value.toFixed(0)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SimplePieChart = ({ data, height = 200 }) => {
  const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {total === 0 ? (
        <Empty description="Sin datos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '300px' }}>
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.amount || 0) / total) * 100 : 0;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: item.color || '#1890ff',
                    borderRadius: '2px'
                  }}
                />
                <div style={{ flex: 1, fontSize: '12px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PaymentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    transactions: [],
    gatewayStats: [],
    dailySales: [],
    monthlyTrends: [],
    topEvents: []
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    gateway: 'all'
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Carga solo datos esenciales primero
      await Promise.all([
        loadTransactionData(),
        loadGatewayStats()
      ]);

      // Carga datos pesados después
      setTimeout(async () => {
        await Promise.all([
          loadDailySales(),
          loadMonthlyTrends(),
          loadTopEvents()
        ]);
      }, 100);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionData = async () => {
    try {
      let query = supabase
        .from('payment_transactions')
        .select('*');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
      }

      if (filters.gateway !== 'all') {
        query = query.eq('gateway_id', filters.gateway);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setAnalyticsData(prev => ({
        ...prev,
        transactions: data || []
      }));
    } catch (error) {
      console.error('Error loading transaction data:', error);
    }
  };

  const loadGatewayStats = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('status', 'completed');

      if (error) throw error;

      const gatewayStats = data.reduce((acc, transaction) => {
        const gatewayName = transaction.gateway_id || 'Unknown';
        if (!acc[gatewayName]) {
          acc[gatewayName] = {
            name: gatewayName,
            amount: 0,
            color: getGatewayColor(gatewayName)
          };
        }
        acc[gatewayName].amount += parseFloat(transaction.amount || 0);
        return acc;
      }, {});

      setAnalyticsData(prev => ({
        ...prev,
        gatewayStats: Object.values(gatewayStats)
      }));
    } catch (error) {
      console.error('Error loading gateway stats:', error);
    }
  };

  const loadDailySales = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('amount, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      const dailyData = data.reduce((acc, transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short'
        });
        if (!acc[date]) {
          acc[date] = { date, sales: 0 };
        }
        acc[date].sales += parseFloat(transaction.amount || 0);
        return acc;
      }, {});

      setAnalyticsData(prev => ({
        ...prev,
        dailySales: Object.values(dailyData)
      }));
    } catch (error) {
      console.error('Error loading daily sales:', error);
    }
  };

  const loadMonthlyTrends = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('amount, created_at, status')
        .eq('status', 'completed');

      if (error) throw error;

      const monthlyData = data.reduce((acc, transaction) => {
        const date = new Date(transaction.created_at);
        const monthKey = date.toLocaleDateString('es-ES', { month: 'short' });

        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, revenue: 0 };
        }
        acc[monthKey].revenue += parseFloat(transaction.amount || 0);
        return acc;
      }, {});

      setAnalyticsData(prev => ({
        ...prev,
        monthlyTrends: Object.values(monthlyData)
      }));
    } catch (error) {
      console.error('Error loading monthly trends:', error);
    }
  };

  const loadTopEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'completed')
        .limit(10);

      if (error) throw error;

      // Datos de ejemplo para top events (simplificado)
      const topEvents = data.map((tx, index) => ({
        name: `Evento ${index + 1}`,
        revenue: parseFloat(tx.amount || 0)
      })).sort((a, b) => b.revenue - a.revenue);

      setAnalyticsData(prev => ({
        ...prev,
        topEvents
      }));
    } catch (error) {
      console.error('Error loading top events:', error);
    }
  };

  const getGatewayColor = (type) => {
    const colors = {
      stripe: '#1890ff',
      paypal: '#003087',
      transfer: '#52c41a',
      mobile_payment: '#722ed1',
      zelle: '#fadb14',
      reservation: '#fa8c16'
    };
    return colors[type] || '#666666';
  };

  const getGatewayIcon = (type) => {
    const icons = {
      stripe: <CreditCardOutlined />,
      paypal: <CreditCardOutlined />,
      transfer: <BankOutlined />,
      mobile_payment: <MobileOutlined />,
      zelle: <DollarOutlined />,
      reservation: <RiseOutlined />
    };
    return icons[type] || <CreditCardOutlined />;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      pending: 'orange',
      reservado: 'gold',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'blue';
  };

  const totalRevenue = analyticsData.transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalTransactions = analyticsData.transactions.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const statusBreakdown = useMemo(() => {
    const summary = {
      completed: 0,
      pending: 0,
      reservado: 0,
      failed: 0,
      cancelled: 0
    };

    analyticsData.transactions.forEach((tx) => {
      const key = String(tx.status || '').toLowerCase();
      if (summary[key] !== undefined) {
        summary[key] += 1;
      }
    });

    return summary;
  }, [analyticsData.transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>Análisis de Pagos</Title>
        <Text type="secondary">Métricas detalladas y tendencias de transacciones</Text>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text strong>Rango de Fechas:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Pasarela:</Text>
            <Select
              value={filters.gateway}
              onChange={(value) => setFilters(prev => ({ ...prev, gateway: value }))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="all">Todas las Pasarelas</Option>
              <Option value="stripe">Stripe</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="transfer">Transferencias</Option>
              <Option value="mobile_payment">Pago Móvil</Option>
              <Option value="zelle">Zelle</Option>
              <Option value="reservation">Reservas</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={loadAnalyticsData}
              loading={loading}
            >
              Actualizar Datos
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Métricas Principales */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ingresos Totales"
              value={totalRevenue}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Transacciones"
              value={totalTransactions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ticket Promedio"
              value={avgTransaction}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos Simplificados */}
      <Row gutter={[16, 16]} className="mb-8">
        {/* Ventas Diarias */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                Ventas Diarias
              </Space>
            }
          >
            {analyticsData.dailySales.length > 0 ? (
              <SimpleBarChart
                data={analyticsData.dailySales}
                dataKey="sales"
                color="#1890ff"
              />
            ) : (
              <Empty description="Sin datos de ventas diarias" />
            )}
          </Card>
        </Col>

        {/* Distribución por Pasarela */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PieChartOutlined />
                Distribución por Pasarela
              </Space>
            }
          >
            <SimplePieChart data={analyticsData.gatewayStats} />
          </Card>
        </Col>
      </Row>

      {/* Tendencias Mensuales */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                Tendencias Mensuales
              </Space>
            }
          >
            {analyticsData.monthlyTrends.length > 0 ? (
              <SimpleBarChart
                data={analyticsData.monthlyTrends}
                dataKey="revenue"
                color="#3f8600"
                height={250}
              />
            ) : (
              <Empty description="Sin datos de tendencias mensuales" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Resumen por Estado */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24}>
          <Card title="Resumen por Estado de Transacción">
            <Row gutter={[16, 16]}>
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <Col xs={12} sm={4} key={status}>
                  <Card size="small">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(status) }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>
                        {status}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {totalTransactions > 0 ? ((count / totalTransactions) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Transacciones Recientes */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Transacciones Recientes">
            {analyticsData.transactions.length > 0 ? (
              <Table
                dataSource={analyticsData.transactions.slice(0, 10)}
                columns={[
                  {
                    title: 'ID',
                    dataIndex: 'id',
                    key: 'id',
                    render: (id) => id ? id.slice(0, 8) + '...' : 'N/A'
                  },
                  {
                    title: 'Monto',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
                  },
                  {
                    title: 'Pasarela',
                    dataIndex: 'gateway_id',
                    key: 'gateway',
                    render: (name) => (
                      <Space>
                        {getGatewayIcon(name)}
                        <span>{name || 'Desconocida'}</span>
                      </Space>
                    )
                  },
                  {
                    title: 'Estado',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={getStatusColor(status)}>
                        {status ? status.toUpperCase() : 'N/A'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Fecha',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (date) => date ? new Date(date).toLocaleString() : 'N/A'
                  }
                ]}
                pagination={false}
                size="small"
                rowKey="id"
              />
            ) : (
              <Empty description="No hay transacciones recientes" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentAnalytics;

