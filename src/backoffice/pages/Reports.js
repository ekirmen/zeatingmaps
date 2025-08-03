import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  DatePicker, 
  Select, 
  Space,
  Typography,
  Divider,
  Progress,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Spin
} from 'antd';
import { 
  DownloadOutlined, 
  EyeOutlined,
  BarChartOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    sales: [],
    events: [],
    users: [],
    payments: []
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    eventType: 'all',
    paymentMethod: 'all',
    status: 'all'
  });
  const [selectedReport, setSelectedReport] = useState('sales');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

  useEffect(() => {
    loadReportData();
  }, [filters, selectedReport]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      switch (selectedReport) {
        case 'sales':
          await loadSalesReport();
          break;
        case 'events':
          await loadEventsReport();
          break;
        case 'users':
          await loadUsersReport();
          break;
        case 'payments':
          await loadPaymentsReport();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      message.error('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesReport = async () => {
    try {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_gateways (name),
          eventos (nombre)
        `)
        .eq('status', 'completed');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
      }

      if (filters.paymentMethod !== 'all') {
        query = query.eq('payment_gateways.type', filters.paymentMethod);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        sales: data || []
      }));
    } catch (error) {
      console.error('Error loading sales report:', error);
    }
  };

  const loadEventsReport = async () => {
    try {
      let query = supabase
        .from('eventos')
        .select(`
          *,
          funciones (*),
          entradas (*)
        `);

      if (filters.dateRange) {
        query = query
          .gte('fecha_evento', filters.dateRange[0].toISOString())
          .lte('fecha_evento', filters.dateRange[1].toISOString());
      }

      const { data, error } = await query.order('fecha_evento', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        events: data || []
      }));
    } catch (error) {
      console.error('Error loading events report:', error);
    }
  };

  const loadUsersReport = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        users: data || []
      }));
    } catch (error) {
      console.error('Error loading users report:', error);
    }
  };

  const loadPaymentsReport = async () => {
    try {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_gateways (name, type)
        `);

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        payments: data || []
      }));
    } catch (error) {
      console.error('Error loading payments report:', error);
    }
  };

  const handleExport = async (values) => {
    try {
      setLoading(true);
      
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success(`Reporte exportado como ${values.format.toUpperCase()}`);
      setExportModalVisible(false);
      exportForm.resetFields();
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('Error al exportar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getSalesColumns = () => [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Evento',
      dataIndex: ['eventos', 'nombre'],
      key: 'event'
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
      key: 'gateway'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ];

  const getEventsColumns = () => [
    {
      title: 'Evento',
      dataIndex: 'nombre',
      key: 'nombre'
    },
    {
      title: 'Fecha Evento',
      dataIndex: 'fecha_evento',
      key: 'fecha_evento',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Funciones',
      dataIndex: 'funciones',
      key: 'funciones',
      render: (funciones) => funciones?.length || 0
    },
    {
      title: 'Tickets Vendidos',
      dataIndex: 'entradas',
      key: 'entradas',
      render: (entradas) => entradas?.filter(e => e.status === 'vendido').length || 0
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'green' : 'gray'}>
          {estado?.toUpperCase()}
        </Tag>
      )
    }
  ];

  const getUsersColumns = () => [
    {
      title: 'Usuario',
      dataIndex: 'full_name',
      key: 'full_name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Estado',
      key: 'status',
      render: () => <Tag color="green">ACTIVO</Tag>
    }
  ];

  const getPaymentsColumns = () => [
    {
      title: 'ID Transacción',
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
      key: 'gateway'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'completed' ? 'green' : 
          status === 'pending' ? 'orange' : 
          status === 'failed' ? 'red' : 'gray'
        }>
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
  ];

  const getReportColumns = () => {
    switch (selectedReport) {
      case 'sales':
        return getSalesColumns();
      case 'events':
        return getEventsColumns();
      case 'users':
        return getUsersColumns();
      case 'payments':
        return getPaymentsColumns();
      default:
        return [];
    }
  };

  const getReportData = () => {
    return reportData[selectedReport] || [];
  };

  const getReportStats = () => {
    const data = getReportData();
    
    switch (selectedReport) {
      case 'sales':
        const totalSales = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const avgSale = data.length > 0 ? totalSales / data.length : 0;
        return {
          total: data.length,
          amount: totalSales,
          average: avgSale
        };
      case 'events':
        const activeEvents = data.filter(e => e.estado === 'activo').length;
        return {
          total: data.length,
          active: activeEvents,
          inactive: data.length - activeEvents
        };
      case 'users':
        const newUsers = data.filter(u => {
          const userDate = new Date(u.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return userDate >= weekAgo;
        }).length;
        return {
          total: data.length,
          newThisWeek: newUsers
        };
      case 'payments':
        const completedPayments = data.filter(p => p.status === 'completed').length;
        const totalAmount = data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        return {
          total: data.length,
          completed: completedPayments,
          amount: totalAmount
        };
      default:
        return {};
    }
  };

  const stats = getReportStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>Reportes</Title>
        <Text type="secondary">Análisis detallado de datos del sistema</Text>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text strong>Tipo de Reporte:</Text>
            <Select
              value={selectedReport}
              onChange={setSelectedReport}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="sales">Ventas</Option>
              <Option value="events">Eventos</Option>
              <Option value="users">Usuarios</Option>
              <Option value="payments">Pagos</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Text strong>Rango de Fechas:</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 8 }}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>

          {selectedReport === 'payments' && (
            <Col xs={24} sm={12} md={6}>
              <Text strong>Estado:</Text>
              <Select
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Option value="all">Todos</Option>
                <Option value="completed">Completados</Option>
                <Option value="pending">Pendientes</Option>
                <Option value="failed">Fallidos</Option>
              </Select>
            </Col>
          )}

          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={loadReportData}
                loading={loading}
              >
                Generar Reporte
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                Exportar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} className="mb-6">
        {selectedReport === 'sales' && (
          <>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total de Ventas"
                  value={stats.total}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Ingresos Totales"
                  value={stats.amount}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Venta Promedio"
                  value={stats.average}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </>
        )}

        {selectedReport === 'events' && (
          <>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total de Eventos"
                  value={stats.total}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Eventos Activos"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Eventos Inactivos"
                  value={stats.inactive}
                  prefix={<CloseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </>
        )}

        {selectedReport === 'users' && (
          <>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total de Usuarios"
                  value={stats.total}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Nuevos Esta Semana"
                  value={stats.newThisWeek}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </>
        )}

        {selectedReport === 'payments' && (
          <>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total de Transacciones"
                  value={stats.total}
                  prefix={<CreditCardOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Completadas"
                  value={stats.completed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Monto Total"
                  value={stats.amount}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Tabla de Datos */}
      <Card title={`Reporte de ${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}`}>
        <Table
          columns={getReportColumns()}
          dataSource={getReportData()}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} registros`
          }}
        />
      </Card>

      {/* Modal de Exportación */}
      <Modal
        title="Exportar Reporte"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExport}
        >
          <Form.Item
            name="format"
            label="Formato de Exportación"
            rules={[{ required: true, message: 'Por favor selecciona un formato' }]}
          >
            <Select placeholder="Selecciona formato">
              <Option value="pdf">PDF</Option>
              <Option value="excel">Excel</Option>
              <Option value="csv">CSV</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="filename"
            label="Nombre del Archivo"
            rules={[{ required: true, message: 'Por favor ingresa un nombre' }]}
          >
            <Input placeholder="reporte_ventas" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<DownloadOutlined />}
              >
                Exportar
              </Button>
              <Button onClick={() => setExportModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reports; 