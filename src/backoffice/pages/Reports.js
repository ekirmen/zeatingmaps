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
  Alert,
  Switch,
  Radio,
  Checkbox,
  InputNumber,
  TimePicker,
  Dropdown
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
  InfoCircleOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { TenantEmailConfigService } from '../services/tenantEmailConfigService';
import { showEmailDiagnosticsModal } from '../utils/emailDiagnostics';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveReportForm] = Form.useForm();
  const [savingReport, setSavingReport] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [sendingReportEmail, setSendingReportEmail] = useState(false);
  const [reportEmailPreview, setReportEmailPreview] = useState({ visible: false, subject: '', html: '' });
  const { currentTenant } = useTenant();
  const { user } = useAuth();

  const serializeDateRange = (range) => {
    if (!range || range.length !== 2) return null;
    const [start, end] = range;
    if (!start || !end) return null;
    return [start.toISOString(), end.toISOString()];
  };

  const deserializeDateRange = (range) => {
    if (!Array.isArray(range) || range.length !== 2) return null;
    const [start, end] = range;
    if (!start || !end) return null;
    return [dayjs(start), dayjs(end)];
  };

  const normalizeReportConfig = (config) => ({
    id: config.id,
    name: config.name,
    selectedReport: config.selected_report || config.selectedReport || 'sales',
    dateMode: config.date_mode || config.dateMode || 'fixed',
    language: config.language || 'es_MX',
    filters: config.filters || {},
    schedule: config.schedule || {}
  });

  const loadSavedReports = async (showSuccess = false) => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      setSavedReportsLoading(true);
      const { data, error } = await supabase
        .from('report_configs')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedReports((data || []).map(normalizeReportConfig));

      if (showSuccess) {
        message.success('Reportes sincronizados con el servidor');
      }
    } catch (error) {
      console.error('Error loading saved reports', error);
      message.error('No se pudieron cargar tus reportes guardados');
    } finally {
      setSavedReportsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentTenant?.id || !user?.id) {
      setSavedReports([]);
      return;
    }

    loadSavedReports();
  }, [currentTenant?.id, user?.id]);

  const weekDayOptions = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'X', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 7 }
  ];

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

  const handleDeleteSavedReport = async (reportId) => {
    if (!currentTenant?.id || !user?.id) {
      message.error('Selecciona un tenant e inicia sesión para gestionar reportes');
      return;
    }

    try {
      setDeletingReportId(reportId);
      const { error } = await supabase
        .from('report_configs')
        .delete()
        .eq('id', reportId)
        .eq('tenant_id', currentTenant.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedReports(prev => prev.filter(report => report.id !== reportId));
      message.success('Reporte eliminado del servidor');
    } catch (error) {
      console.error('Error deleting saved report', error);
      message.error('No se pudo eliminar el reporte');
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleLoadSavedReport = (reportId) => {
    const report = savedReports.find(item => item.id === reportId);
    if (!report) {
      message.error('No se pudo cargar el reporte seleccionado');
      return;
    }

    setSelectedReport(report.selectedReport || 'sales');

    setFilters(prev => {
      const { dateRange, ...restFilters } = report.filters || {};
      const hydratedRange = deserializeDateRange(dateRange);
      return {
        ...prev,
        ...restFilters,
        dateRange: hydratedRange
      };
    });

    message.success(`Reporte "${report.name}" cargado`);
  };

  const handleSavedReportsMenuClick = ({ key }) => {
    if (key === 'empty' || key === 'loading') return;
    handleLoadSavedReport(key);
  };

  const validateEmailList = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Indica el email destinatario.'));
    }

    const emails = value
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    if (!emails.length) {
      return Promise.reject(new Error('Indica el email destinatario.'));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = emails.find(email => !emailRegex.test(email));

    if (invalidEmail) {
      return Promise.reject(new Error(`Email inválido: ${invalidEmail}`));
    }

    return Promise.resolve();
  };

  const openSaveReportModal = () => {
    saveReportForm.resetFields();
    saveReportForm.setFieldsValue({
      name: '',
      dateMode: 'fixed',
      language: 'es_MX',
      scheduled: false,
      scheduleRange: filters.dateRange || null,
      emails: '',
      periodicity: 'd',
      dayOfMonth: 1,
      time: dayjs('08:00', 'HH:mm'),
      weekDays: []
    });
    setSaveModalVisible(true);
  };

  const handleSaveReport = async () => {
    try {
      if (!currentTenant?.id || !user?.id) {
        message.error('Selecciona un tenant e inicia sesión para guardar el reporte');
        return;
      }

      const values = await saveReportForm.validateFields();
      setSavingReport(true);

      const serializedFilters = {
        ...filters,
        dateRange: serializeDateRange(filters.dateRange)
      };

      const scheduleEnabled = values.scheduled;
      const scheduleRange = values.scheduleRange ? serializeDateRange(values.scheduleRange) : null;

      const schedule = {
        enabled: scheduleEnabled,
        dateRange: scheduleEnabled ? scheduleRange : null,
        emails: scheduleEnabled ? values.emails : '',
        periodicity: scheduleEnabled ? values.periodicity : 'd',
        weekDays: scheduleEnabled && values.periodicity === 's' ? values.weekDays || [] : [],
        dayOfMonth: scheduleEnabled && values.periodicity === 'm' ? values.dayOfMonth || 1 : 1,
        time: scheduleEnabled && values.time ? values.time.format('HH:mm') : null
      };

      const { data, error } = await supabase
        .from('report_configs')
        .insert({
          tenant_id: currentTenant.id,
          user_id: user.id,
          name: values.name,
          selected_report: selectedReport,
          date_mode: values.dateMode,
          language: values.language,
          filters: serializedFilters,
          schedule
        })
        .select()
        .single();

      if (error) throw error;

      setSavedReports(prev => [normalizeReportConfig(data), ...prev]);
      message.success('Reporte guardado correctamente en Supabase');
      setSaveModalVisible(false);
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      console.error('Error saving report', error);
      message.error('No se pudo guardar el reporte');
    } finally {
      setSavingReport(false);
    }
  };

  const savedReportsMenuItems = savedReportsLoading
    ? [
        {
          key: 'loading',
          disabled: true,
          label: (
            <Space size="small">
              <Spin size="small" />
              <Text type="secondary">Cargando reportes...</Text>
            </Space>
          )
        }
      ]
    : savedReports.length
      ? savedReports.map(report => ({
          key: report.id,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{report.name}</span>
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deletingReportId === report.id}
                disabled={savedReportsLoading}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleDeleteSavedReport(report.id);
                }}
              >
                Eliminar
              </Button>
            </div>
          )
        }))
      : [
          {
            key: 'empty',
            disabled: true,
            label: <Text type="secondary">No hay reportes guardados</Text>
          }
        ];

  const loadSalesReport = async () => {
    try {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          user:profiles!user_id(*),
          event:eventos(*)
        `)
        .eq('status', 'pagado');

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
        .from('payment_transactions')
        .select(`
          *,
          user:profiles!user_id(*),
          event:eventos(*)
        `);

      if (filters.status !== 'all') {
        // Map status values to match database values
        const statusMap = {
          'completed': 'pagado',
          'pending': 'pendiente',
          'failed': 'fallido',
          'reserved': 'reservado'
        };
        const dbStatus = statusMap[filters.status] || filters.status;
        query = query.eq('status', dbStatus);
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
      dataIndex: 'monto',
      key: 'monto',
      render: (monto) => `$${parseFloat(monto || 0).toFixed(2)}`
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'pagado' ? 'green' : status === 'pendiente' ? 'orange' : status === 'fallido' ? 'red' : 'blue'}>
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
      dataIndex: 'monto',
      key: 'monto',
      render: (monto) => `$${parseFloat(monto || 0).toFixed(2)}`
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'pagado' ? 'green' : 
          status === 'pendiente' ? 'orange' : 
          status === 'fallido' ? 'red' : 
          status === 'reservado' ? 'blue' : 'gray'
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
        const totalSales = data.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
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
        const completedPayments = data.filter(p => p.status === 'pagado').length;
        const totalAmount = data.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
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

  const statsLabels = {
    total: 'Total de registros',
    amount: 'Monto total',
    average: 'Promedio',
    active: 'Activos',
    inactive: 'Inactivos',
    newThisWeek: 'Nuevos esta semana',
    completed: 'Pagos completados',
    totalValue: 'Valor total',
    totalValueCarritos: 'Valor total',
    totalValuePromos: 'Valor total',
    totalValueProducts: 'Valor total',
    totalValueSales: 'Valor total'
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const extractValueByDataIndex = (row, dataIndex) => {
    if (!row || dataIndex === undefined) return undefined;
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce((acc, key) => (acc ? acc[key] : undefined), row);
    }
    if (typeof dataIndex === 'string' && dataIndex.includes('.')) {
      return dataIndex.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), row);
    }
    return row[dataIndex];
  };

  const extractTextFromReactNode = (node) => {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) {
      return node.map(child => extractTextFromReactNode(child)).join('');
    }
    if (React.isValidElement(node)) {
      return extractTextFromReactNode(node.props.children);
    }
    return '';
  };

  const formatStatValue = (key, value) => {
    if (value === null || value === undefined) return '0';
    const lowerKey = (key || '').toString().toLowerCase();

    if (typeof value === 'number') {
      if (lowerKey.includes('amount') || lowerKey.includes('value')) {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (lowerKey.includes('average')) {
        return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return value.toLocaleString('es-MX');
    }

    return String(value);
  };

  const formatCellValueForEmail = (column, row) => {
    const rawValue = extractValueByDataIndex(row, column.dataIndex);

    if (column.render) {
      try {
        const rendered = column.render(rawValue, row);
        if (typeof rendered === 'string' || typeof rendered === 'number') {
          return String(rendered);
        }
        const textValue = extractTextFromReactNode(rendered);
        if (textValue) {
          return textValue;
        }
      } catch (renderError) {
        console.error('Error formateando columna para email:', renderError);
      }
    }

    if (rawValue === null || rawValue === undefined) return '';
    if (rawValue instanceof Date) return rawValue.toLocaleString('es-MX');
    if (typeof rawValue === 'number') return rawValue.toString();
    if (typeof rawValue === 'object') return JSON.stringify(rawValue);
    return String(rawValue);
  };

  const generateReportEmailContent = () => {
    const data = getReportData();
    const columns = getReportColumns();
    const statsData = getReportStats();
    const option = reportOptions.find(opt => opt.value === selectedReport);
    const reportTitle = option?.label || selectedReport;
    const previewLimit = 10;
    const previewRows = data.slice(0, previewLimit);
    const generatedAt = new Date();

    const statsEntries = statsData
      ? Object.entries(statsData).map(([key, value]) => ({
          key,
          label: statsLabels[key] || key,
          value: formatStatValue(key, value)
        }))
      : [];

    const tableHeader = columns
      .map(col => `<th style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: left;">${escapeHtml(col.title)}</th>`)
      .join('');

    const tableBody = previewRows
      .map(row => {
        const cells = columns
          .map(col => {
            const value = formatCellValueForEmail(col, row);
            return `<td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(value)}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const subject = `Resumen de ${reportTitle} - ${dayjs(generatedAt).format('DD/MM/YYYY')}`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 720px; margin: 0 auto;">
        <h2 style="color: #722ed1;">${escapeHtml(subject)}</h2>
        <p>Te compartimos un resumen del reporte <strong>${escapeHtml(reportTitle)}</strong> generado el ${escapeHtml(generatedAt.toLocaleString('es-MX'))}.</p>
        ${statsEntries.length ? `
          <div style="margin: 16px 0;">
            <h3 style="color: #1890ff; margin-bottom: 8px;">Indicadores principales</h3>
            <ul style="padding-left: 18px; margin: 0;">
              ${statsEntries
                .map(entry => `<li><strong>${escapeHtml(entry.label)}:</strong> ${escapeHtml(entry.value)}</li>`)
                .join('')}
            </ul>
          </div>
        ` : ''}
        <div style="margin-top: 20px;">
          <h3 style="color: #1890ff; margin-bottom: 8px;">Datos del reporte</h3>
          ${previewRows.length ? `
            <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
              <thead>
                <tr>${tableHeader}</tr>
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>
            ${previewRows.length < data.length ? `<p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Mostrando ${previewRows.length} de ${data.length} registros. Exporta el reporte desde el panel para ver el detalle completo.</p>` : ''}
          ` : '<p>No hay datos disponibles para el reporte con los filtros seleccionados.</p>'}
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">Este correo se generó automáticamente desde el panel de reportes de Omega Boletos.</p>
      </div>
    `;

    const textLines = [
      `Resumen de ${reportTitle}`,
      `Generado el ${generatedAt.toLocaleString('es-MX')}`,
      '',
      'Indicadores principales:',
      ...statsEntries.map(entry => `- ${entry.label}: ${entry.value}`),
      '',
      previewRows.length
        ? `Incluye ${previewRows.length} de ${data.length} registros disponibles.`
        : 'No hay datos disponibles para los filtros seleccionados.'
    ];

    return { subject, html, text: textLines.join('\n') };
  };

  const openReportEmailPreview = () => {
    const content = generateReportEmailContent();
    setReportEmailPreview({
      visible: true,
      subject: content.subject,
      html: content.html
    });
  };

  const closeReportEmailPreview = () => {
    setReportEmailPreview(prev => ({ ...prev, visible: false }));
  };

  const handleSendReportEmail = async () => {
    try {
      setSendingReportEmail(true);
      const emailConfig = await TenantEmailConfigService.getActiveEmailConfig();

      if (!emailConfig || !emailConfig.smtp_host || !emailConfig.smtp_user || !emailConfig.smtp_pass) {
        message.error('No hay una configuración de correo activa con credenciales completas.');
        return;
      }

      const content = generateReportEmailContent();
      const result = await TenantEmailConfigService.executeEmailTest(emailConfig, {
        subject: content.subject,
        html: content.html
      });

      message.success('Enviamos el resumen del reporte a tu bandeja de entrada.');

      if (result?.diagnostics) {
        showEmailDiagnosticsModal(result.diagnostics, {
          success: true,
          title: 'Reporte enviado por correo',
          message: 'El servidor SMTP aceptó el resumen del reporte correctamente.'
        });
      }
    } catch (error) {
      console.error('Error enviando resumen del reporte:', error);
      const errorMessage = error?.message || 'Error enviando el correo de resumen';
      message.error(errorMessage);

      if (error?.diagnostics) {
        showEmailDiagnosticsModal(error.diagnostics, {
          success: false,
          title: 'Error enviando resumen',
          message: errorMessage
        });
      }
    } finally {
      setSendingReportEmail(false);
    }
  };

  const reportOptions = [
    { value: 'sales', label: 'Ventas', icon: <DollarOutlined /> },
    { value: 'events', label: 'Eventos', icon: <CalendarOutlined /> },
    { value: 'users', label: 'Usuarios', icon: <UserOutlined /> },
    { value: 'payments', label: 'Pagos', icon: <CreditCardOutlined /> },
    { value: 'products', label: 'Productos', icon: <ShoppingCartOutlined /> },
    { value: 'promociones', label: 'Promociones', icon: <GiftOutlined /> },
    { value: 'carritos', label: 'Carritos', icon: <ShoppingCartOutlined /> }
  ];

  const overviewContent = (
    <>
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
    </>
  );

  const detailedContent = (
    <>
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

          <Col xs={24} sm={12} md={8}>
            <Text strong>Rango de Fechas:</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                style={{ width: '100%' }}
              />
              <Switch
                checkedChildren="Filtrar por fecha"
                unCheckedChildren="Todas las fechas"
                checked={!!filters.dateRange}
                onChange={(checked) =>
                  setFilters(prev => ({ ...prev, dateRange: checked ? filters.dateRange : null }))
                }
              />
            </Space>
          </Col>

          <Col xs={24} sm={12} md={4}>
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
              <Option value="reserved">Reservados</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space wrap>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={loadReportData}
              >
                Actualizar
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

      <Card className="mb-6" title="Envío de resumen por correo">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Envía un resumen del reporte seleccionado a tu correo usando la configuración SMTP activa para validar el contenido que recibirán tus equipos.
          </Text>
          <Space wrap>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sendingReportEmail}
              onClick={handleSendReportEmail}
            >
              Enviar a mi correo
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={openReportEmailPreview}
            >
              Vista previa
            </Button>
          </Space>
          <Text type="secondary">
            Usa esta opción para confirmar que la configuración de correo y los filtros del reporte son correctos antes de programar envíos automáticos.
          </Text>
        </Space>
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
                  title="Carritos con Asientos"
                  value={stats.cartsWithSeats}
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
    </>
  );

  const tabItems = [
    {
      key: 'overview',
      label: 'Vista General',
      children: overviewContent
    },
    {
      key: 'detailed',
      label: 'Reportes Detallados',
      children: detailedContent
    }
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

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title={reportEmailPreview.subject || 'Vista previa del correo'}
        open={reportEmailPreview.visible}
        onCancel={closeReportEmailPreview}
        footer={[
          <Button key="close" onClick={closeReportEmailPreview}>
            Cerrar
          </Button>
        ]}
        width={720}
      >
        <div
          className="prose prose-sm"
          dangerouslySetInnerHTML={{ __html: reportEmailPreview.html }}
        />
      </Modal>

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

      <Modal
        title="Guardar en mis reportes"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        onOk={handleSaveReport}
        confirmLoading={savingReport}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form layout="vertical" form={saveReportForm} name="saveReportForm">
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Indica el nombre de tu informe.' }]}
          >
            <Input placeholder="Pon el nombre de tu reporte" maxLength={255} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Fechas" name="dateMode" initialValue="fixed">
                <Radio.Group>
                  <Radio value="fixed">Fijas</Radio>
                  <Radio value="sliding">Deslizantes</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Idioma" name="language" initialValue="es_MX">
                <Select>
                  <Option value="en_US">English (en_US)</Option>
                  <Option value="es_MX">Spanish (es_MX)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Programar informe"
            name="scheduled"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, current) => prev.scheduled !== current.scheduled} noStyle>
            {({ getFieldValue }) =>
              getFieldValue('scheduled') ? (
                <div className="configuracionProgramacion">
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Fechas"
                        name="scheduleRange"
                        rules={[{ required: true, message: 'Seleccione la fecha' }]}
                      >
                        <RangePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Email"
                        name="emails"
                        rules={[{ validator: validateEmailList }]}
                      >
                        <Input placeholder="email@email.com" maxLength={4000} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Periodicidad" name="periodicity" initialValue="d">
                        <Radio.Group>
                          <Radio value="d">Diario</Radio>
                          <Radio value="s">Semanal</Radio>
                          <Radio value="m">Mensual</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item shouldUpdate={(prev, current) => prev.periodicity !== current.periodicity} noStyle>
                    {({ getFieldValue }) => {
                      const periodicity = getFieldValue('periodicity');

                      if (periodicity === 's') {
                        return (
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Días"
                                name="weekDays"
                                rules={[{ required: true, message: 'Seleccione al menos un día' }]}
                              >
                                <Checkbox.Group options={weekDayOptions} />
                              </Form.Item>
                            </Col>
                          </Row>
                        );
                      }

                      if (periodicity === 'm') {
                        return (
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Día del mes"
                                name="dayOfMonth"
                                rules={[{ required: true, message: 'Indica el día del mes' }]}
                              >
                                <InputNumber min={1} max={31} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        );
                      }

                      return null;
                    }}
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="Hora"
                        name="time"
                        rules={[{ required: true, message: 'Indica la hora de ejecución' }]}
                      >
                        <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reports; 
