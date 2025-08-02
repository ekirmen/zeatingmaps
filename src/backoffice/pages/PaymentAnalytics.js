import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker, 
  Select, 
  Button, 
  Progress, 
  Typography, 
  Space, 
  Tag,
  Spin,
  Alert
} from 'antd';
import { 
  DollarOutlined, 
  CreditCardOutlined, 
  BankOutlined, 
  MobileOutlined, 
  TrendingUpOutlined, 
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '../services/supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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
  }, [filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadTransactionData(),
        loadGatewayStats(),
        loadDailySales(),
        loadMonthlyTrends(),
        loadTopEvents()
      ]);
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
        .select(`
          *,
          payment_gateways (name, type)
        `);

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
      }

      if (filters.gateway !== 'all') {
        query = query.eq('payment_gateways.type', filters.gateway);
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
        .select(`
          *,
          payment_gateways (name, type)
        `)
        .eq('status', 'completed');

      if (error) throw error;

      // Agrupar por gateway
      const gatewayStats = data.reduce((acc, transaction) => {
        const gatewayName = transaction.payment_gateways?.name || 'Unknown';
        if (!acc[gatewayName]) {
          acc[gatewayName] = {
            name: gatewayName,
            count: 0,
            amount: 0,
            color: getGatewayColor(transaction.payment_gateways?.type)
          };
        }
        acc[gatewayName].count += 1;
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
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const dailyData = data.reduce((acc, transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, sales: 0, count: 0 };
        }
        acc[date].sales += parseFloat(transaction.amount || 0);
        acc[date].count += 1;
        return acc;
      }, {});

      const dailySales = Object.values(dailyData).slice(-30); // Últimos 30 días

      setAnalyticsData(prev => ({
        ...prev,
        dailySales
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

      // Agrupar por mes
      const monthlyData = data.reduce((acc, transaction) => {
        const date = new Date(transaction.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { 
            month: monthKey, 
            revenue: 0, 
            transactions: 0,
            avgTicket: 0
          };
        }
        acc[monthKey].revenue += parseFloat(transaction.amount || 0);
        acc[monthKey].transactions += 1;
        return acc;
      }, {});

      // Calcular promedio por ticket
      Object.values(monthlyData).forEach(month => {
        month.avgTicket = month.transactions > 0 ? month.revenue / month.transactions : 0;
      });

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
        .select(`
          amount,
          eventos (nombre)
        `)
        .eq('status', 'completed');

      if (error) throw error;

      // Agrupar por evento
      const eventStats = data.reduce((acc, transaction) => {
        const eventName = transaction.eventos?.nombre || 'Unknown Event';
        if (!acc[eventName]) {
          acc[eventName] = { name: eventName, revenue: 0, tickets: 0 };
        }
        acc[eventName].revenue += parseFloat(transaction.amount || 0);
        acc[eventName].tickets += 1;
        return acc;
      }, {});

      const topEvents = Object.values(eventStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

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
      reservation: <TrendingUpOutlined />
    };
    return icons[type] || <CreditCardOutlined />;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      pending: 'orange',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'blue';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const totalRevenue = analyticsData.transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalTransactions = analyticsData.transactions.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

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

      {/* Gráficos */}
      <Row gutter={[16, 16]} className="mb-8">
        {/* Ventas Diarias */}
        <Col xs={24} lg={12}>
          <Card title="Ventas Diarias" extra={<LineChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Ventas']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Ventas"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Distribución por Pasarela */}
        <Col xs={24} lg={12}>
          <Card title="Distribución por Pasarela" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.gatewayStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {analyticsData.gatewayStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tendencias Mensuales */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24}>
          <Card title="Tendencias Mensuales" extra={<AreaChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value, 
                  name === 'revenue' ? 'Ingresos' : 
                  name === 'transactions' ? 'Transacciones' : 'Ticket Promedio'
                ]} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#3f8600" 
                  fill="#3f8600" 
                  name="Ingresos"
                />
                <Area 
                  type="monotone" 
                  dataKey="avgTicket" 
                  stackId="2" 
                  stroke="#722ed1" 
                  fill="#722ed1" 
                  name="Ticket Promedio"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Eventos */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Top 10 Eventos por Ingresos" extra={<BarChartOutlined />}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.topEvents} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => [`$${value}`, 'Ingresos']} />
                <Legend />
                <Bar dataKey="revenue" fill="#1890ff" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Transacciones Recientes */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24}>
          <Card title="Transacciones Recientes">
            <Table
              dataSource={analyticsData.transactions.slice(0, 10)}
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                  render: (id) => id.slice(0, 8) + '...'
                },
                {
                  title: 'Monto',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `$${parseFloat(amount).toFixed(2)}`
                },
                {
                  title: 'Pasarela',
                  dataIndex: ['payment_gateways', 'name'],
                  key: 'gateway',
                  render: (name, record) => (
                    <Space>
                      {getGatewayIcon(record.payment_gateways?.type)}
                      {name}
                    </Space>
                  )
                },
                {
                  title: 'Estado',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Tag>
                  )
                },
                {
                  title: 'Fecha',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (date) => new Date(date).toLocaleString()
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PaymentAnalytics; 