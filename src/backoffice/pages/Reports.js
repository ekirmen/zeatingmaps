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
  Spin,
  Tabs,
  Badge,
  Tooltip,
  Alert
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
  CreditCardOutlined,
  TrendingUpOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    sales: [],
    events: [],
    users: [],
    payments: [],
    products: [],
    promociones: [],
    carritos: []
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
  const [activeTab, setActiveTab] = useState('overview');

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
        case 'products':
          await loadProductsReport();
          break;
        case 'promociones':
          await loadPromocionesReport();
          break;
        case 'carritos':
          await loadCarritosReport();
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
        .from('payments')
        .select(`
          *,
          user:profiles!user_id(*),
          event:eventos(*)
        `)
        .eq('status', 'completed');

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange[0].toISOString())
          .lte('created_at', filters.dateRange[1].toISOString());
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
        .from('payments')
        .select(`
          *,
          user:profiles!user_id(*),
          event:eventos(*)
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

  const loadProductsReport = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        products: data || []
      }));
    } catch (error) {
      console.error('Error loading products report:', error);
    }
  };

  const loadPromocionesReport = async () => {
    try {
      const { data, error } = await supabase
        .from('promociones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        promociones: data || []
      }));
    } catch (error) {
      console.error('Error loading promociones report:', error);
    }
  };

  const loadCarritosReport = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        carritos: data || []
      }));
    } catch (error) {
      console.error('Error loading carritos report:', error);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const columns = getReportColumns();
    const headers = columns.map(col => col.title).join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        let value = row[col.dataIndex];
        if (col.render) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = col.render(value, row);
          value = tempDiv.textContent || tempDiv.innerText || '';
        }
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const columns = getReportColumns();
    const headers = columns.map(col => col.title);
    const rows = data.map(row => {
      return columns.map(col => {
        let value = row[col.dataIndex];
        if (col.render) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = col.render(value, row);
          value = tempDiv.textContent || tempDiv.innerText || '';
        }
        return value || '';
      });
    });

    let html = '<table>';
    html += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data, filename) => {
    if (!data || data.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const columns = getReportColumns();
    const headers = columns.map(col => col.title);
    const rows = data.map(row => {
      return columns.map(col => {
        let value = row[col.dataIndex];
        if (col.render) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = col.render(value, row);
          value = tempDiv.textContent || tempDiv.innerText || '';
        }
        return value || '';
      });
    });

    let html = `
      <html>
        <head>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #1890ff; }
          </style>
        </head>
        <body>
          <h1>Reporte de ${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}</h1>
          <table>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.pdf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (values) => {
    try {
      setLoading(true);
      
      const data = getReportData();
      const filename = values.filename || `reporte_${selectedReport}`;
      
      switch (values.format) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'excel':
          exportToExcel(data, filename);
          break;
        case 'pdf':
          exportToPDF(data, filename);
          break;
        default:
          message.error('Formato no soportado');
          return;
      }
      
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
      title: 'Cliente',
      dataIndex: ['user', 'login'],
      key: 'client',
      render: (login) => login || 'N/A'
    },
    {
      title: 'Evento',
      dataIndex: ['event', 'nombre'],
      key: 'event',
      render: (nombre) => nombre || 'N/A'
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status?.toUpperCase() || 'N/A'}
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
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'gray'}>
          {activo ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      )
    }
  ];

  const getUsersColumns = () => [
    {
      title: 'Usuario',
      dataIndex: 'login',
      key: 'login'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      render: (telefono) => telefono || 'N/A'
    },
    {
      title: 'Empresa',
      dataIndex: 'empresa',
      key: 'empresa',
      render: (empresa) => empresa || 'N/A'
    },
    {
      title: 'Fecha Registro',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  const getPaymentsColumns = () => [
    {
      title: 'ID Transacción',
      dataIndex: 'id',
      key: 'id',
      render: (id) => id?.slice(0, 8) + '...' || 'N/A'
    },
    {
      title: 'Cliente',
      dataIndex: ['user', 'login'],
      key: 'client',
      render: (login) => login || 'N/A'
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${parseFloat(amount || 0).toFixed(2)}`
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
          {status?.toUpperCase() || 'N/A'}
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

  const getProductsColumns = () => [
    {
      title: 'Producto',
      dataIndex: 'nombre',
      key: 'nombre'
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => `$${parseFloat(precio || 0).toFixed(2)}`
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => categoria || 'Sin categoría'
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => stock || 0
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'gray'}>
          {activo ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      )
    }
  ];

  const getPromocionesColumns = () => [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (codigo) => <Text code>{codigo}</Text>
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'porcentaje' ? 'blue' : 'purple'}>
          {tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
        </Tag>
      )
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      render: (valor, record) => (
        <Text strong>
          {record.tipo === 'porcentaje' ? `${valor}%` : `$${valor}`}
        </Text>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
          {activo ? 'ACTIVA' : 'INACTIVA'}
        </Tag>
      )
    }
  ];

  const getCarritosColumns = () => [
    {
      title: 'Cliente ID',
      dataIndex: 'client_id',
      key: 'client_id',
      render: (id) => id || 'N/A'
    },
    {
      title: 'Evento ID',
      dataIndex: 'event_id',
      key: 'event_id',
      render: (id) => id || 'N/A'
    },
    {
      title: 'Asientos',
      dataIndex: 'seats',
      key: 'seats',
      render: (seats) => seats?.length || 0
    },
    {
      title: 'Productos',
      dataIndex: 'products',
      key: 'products',
      render: (products) => products?.length || 0
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => `$${parseFloat(total || 0).toFixed(2)}`
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
      case 'products':
        return getProductsColumns();
      case 'promociones':
        return getPromocionesColumns();
      case 'carritos':
        return getCarritosColumns();
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
        const activeEvents = data.filter(e => e.activo).length;
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
      case 'products':
        const activeProducts = data.filter(p => p.activo).length;
        const totalValue = data.reduce((sum, p) => sum + parseFloat(p.precio || 0), 0);
        return {
          total: data.length,
          active: activeProducts,
          totalValue: totalValue
        };
      case 'promociones':
        const activePromociones = data.filter(p => p.activo).length;
        return {
          total: data.length,
          active: activePromociones,
          inactive: data.length - activePromociones
        };
      case 'carritos':
        const totalValueCarritos = data.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
        return {
          total: data.length,
          totalValue: totalValueCarritos,
          average: data.length > 0 ? totalValueCarritos / data.length : 0
        };
      default:
        return {};
    }
  };

  const stats = getReportStats();

  const reportOptions = [
    { value: 'sales', label: 'Ventas', icon: <DollarOutlined /> },
    { value: 'events', label: 'Eventos', icon: <CalendarOutlined /> },
    { value: 'users', label: 'Usuarios', icon: <UserOutlined /> },
    { value: 'payments', label: 'Pagos', icon: <CreditCardOutlined /> },
    { value: 'products', label: 'Productos', icon: <ShoppingCartOutlined /> },
    { value: 'promociones', label: 'Promociones', icon: <GiftOutlined /> },
    { value: 'carritos', label: 'Carritos', icon: <ShoppingCartOutlined /> }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>
          <BarChartOutlined className="mr-2" />
          Reportes y Analytics
        </Title>
        <Text type="secondary">Análisis detallado de datos del sistema</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Vista General" key="overview">
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Ventas"
                  value={stats.amount || 0}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600' }}
                  suffix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Eventos Activos"
                  value={reportData.events?.filter(e => e.activo).length || 0}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Usuarios Registrados"
                  value={reportData.users?.length || 0}
                  valueStyle={{ color: '#722ed1' }}
                  suffix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Productos Disponibles"
                  value={reportData.products?.filter(p => p.activo).length || 0}
                  valueStyle={{ color: '#faad14' }}
                  suffix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Alert
            message="Resumen del Sistema"
            description="Aquí puedes ver un resumen general de las métricas más importantes del sistema."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            className="mb-6"
          />
        </TabPane>

        <TabPane tab="Reportes Detallados" key="detailed">
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
                  {reportOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        {option.icon}
                        {option.label}
                      </Space>
                    </Option>
                  ))}
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

            {selectedReport === 'products' && (
              <>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total de Productos"
                      value={stats.total}
                      prefix={<ShoppingCartOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Productos Activos"
                      value={stats.active}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Valor Total"
                      value={stats.totalValue}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </>
            )}

            {selectedReport === 'promociones' && (
              <>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total de Promociones"
                      value={stats.total}
                      prefix={<GiftOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Promociones Activas"
                      value={stats.active}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Promociones Inactivas"
                      value={stats.inactive}
                      prefix={<CloseOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
              </>
            )}

            {selectedReport === 'carritos' && (
              <>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Total de Carritos"
                      value={stats.total}
                      prefix={<ShoppingCartOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Valor Total"
                      value={stats.totalValue}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="Valor Promedio"
                      value={stats.average}
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
        </TabPane>
      </Tabs>

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