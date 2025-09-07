import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  TimePicker, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Divider, 
  Table, 
  Tag, 
  Modal, 
  message, 
  Spin,
  Radio,
  Checkbox,
  Alert
} from 'antd';
import { 
  CalendarOutlined, 
  MailOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ScheduledReports = () => {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form] = Form.useForm();

  const reportTypes = [
    { value: 'sales', label: 'Ventas', icon: <FileTextOutlined /> },
    { value: 'events', label: 'Eventos', icon: <CalendarOutlined /> },
    { value: 'users', label: 'Usuarios', icon: <MailOutlined /> },
    { value: 'payments', label: 'Pagos', icon: <ClockCircleOutlined /> },
    { value: 'products', label: 'Productos', icon: <FileTextOutlined /> },
    { value: 'promociones', label: 'Promociones', icon: <FileTextOutlined /> },
    { value: 'carritos', label: 'Carritos', icon: <FileTextOutlined /> }
  ];

  const periodicities = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' }
  ];

  const languages = [
    { value: 'es_MX', label: 'Español (es_MX)' },
    { value: 'en_US', label: 'English (en_US)' }
  ];

  const weekDays = [
    { value: 1, label: 'L', name: 'Lunes' },
    { value: 2, label: 'M', name: 'Martes' },
    { value: 3, label: 'X', name: 'Miércoles' },
    { value: 4, label: 'J', name: 'Jueves' },
    { value: 5, label: 'V', name: 'Viernes' },
    { value: 6, label: 'S', name: 'Sábado' },
    { value: 7, label: 'D', name: 'Domingo' }
  ];

  useEffect(() => {
    loadData();
  }, [currentTenant?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadScheduledReports(),
        loadEvents(),
        loadReportTemplates()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select(`
          *,
          evento:eventos(nombre),
          executions:scheduled_report_executions(id, fecha_ejecucion, estado, error_message)
        `)
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledReports(data || []);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_evento')
        .eq('tenant_id', currentTenant?.id)
        .order('fecha_evento', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadReportTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReportTemplates(data || []);
    } catch (error) {
      console.error('Error loading report templates:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const reportData = {
        ...values,
        tenant_id: currentTenant?.id,
        dias_semana: values.periodicidad === 'weekly' ? values.dias_semana : null,
        dia_mes: values.periodicidad === 'monthly' ? values.dia_mes : null,
        hora_ejecucion: values.hora_ejecucion?.format('HH:mm:ss') || '08:00:00',
        fecha_inicio: values.fecha_inicio?.format('YYYY-MM-DD'),
        fecha_fin: values.fecha_fin?.format('YYYY-MM-DD'),
        evento_id: values.evento_id || null
      };

      if (editingReport) {
        const { error } = await supabase
          .from('scheduled_reports')
          .update(reportData)
          .eq('id', editingReport.id);

        if (error) throw error;
        message.success('Reporte programado actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('scheduled_reports')
          .insert(reportData);

        if (error) throw error;
        message.success('Reporte programado creado correctamente');
      }

      setModalVisible(false);
      setEditingReport(null);
      form.resetFields();
      loadScheduledReports();
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      message.error('Error al guardar el reporte programado');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    form.setFieldsValue({
      ...report,
      fecha_inicio: report.fecha_inicio ? moment(report.fecha_inicio) : null,
      fecha_fin: report.fecha_fin ? moment(report.fecha_fin) : null,
      hora_ejecucion: report.hora_ejecucion ? moment(report.hora_ejecucion, 'HH:mm:ss') : null
    });
    setModalVisible(true);
  };

  const handleDelete = async (report) => {
    Modal.confirm({
      title: '¿Estás seguro?',
      content: `¿Quieres eliminar el reporte programado "${report.nombre}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('scheduled_reports')
            .delete()
            .eq('id', report.id);

          if (error) throw error;
          message.success('Reporte programado eliminado correctamente');
          loadScheduledReports();
        } catch (error) {
          console.error('Error deleting scheduled report:', error);
          message.error('Error al eliminar el reporte programado');
        }
      }
    });
  };

  const toggleActive = async (report) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ activo: !report.activo })
        .eq('id', report.id);

      if (error) throw error;
      message.success(`Reporte ${!report.activo ? 'activado' : 'desactivado'} correctamente`);
      loadScheduledReports();
    } catch (error) {
      console.error('Error toggling report status:', error);
      message.error('Error al cambiar el estado del reporte');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {!record.activo && <Tag color="red">Inactivo</Tag>}
        </Space>
      )
    },
    {
      title: 'Tipo de Reporte',
      dataIndex: 'tipo_reporte',
      key: 'tipo_reporte',
      render: (tipo) => {
        const reportType = reportTypes.find(rt => rt.value === tipo);
        return (
          <Space>
            {reportType?.icon}
            {reportType?.label}
          </Space>
        );
      }
    },
    {
      title: 'Evento',
      dataIndex: ['evento', 'nombre'],
      key: 'evento',
      render: (nombre) => nombre || 'Todos los eventos'
    },
    {
      title: 'Periodicidad',
      dataIndex: 'periodicidad',
      key: 'periodicidad',
      render: (periodicidad) => {
        const period = periodicities.find(p => p.value === periodicidad);
        return period?.label || periodicidad;
      }
    },
    {
      title: 'Horario',
      dataIndex: 'hora_ejecucion',
      key: 'hora_ejecucion',
      render: (hora) => hora || '08:00'
    },
    {
      title: 'Última Ejecución',
      dataIndex: ['executions', 0, 'fecha_ejecucion'],
      key: 'last_execution',
      render: (fecha) => fecha ? new Date(fecha).toLocaleString() : 'Nunca'
    },
    {
      title: 'Estado',
      dataIndex: ['executions', 0, 'estado'],
      key: 'status',
      render: (estado) => {
        const statusColors = {
          'sent': 'green',
          'failed': 'red',
          'pending': 'orange'
        };
        return estado ? (
          <Tag color={statusColors[estado] || 'default'}>
            {estado?.toUpperCase()}
          </Tag>
        ) : '-';
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={record.activo ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => toggleActive(record)}
            title={record.activo ? 'Desactivar' : 'Activar'}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Editar"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="Eliminar"
          />
        </Space>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Title level={2}>
          <MailOutlined className="mr-2" />
          Programar Correo
        </Title>
        <Text type="secondary">Configura reportes automáticos por correo electrónico</Text>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} className="mb-0">
              Reportes Programados
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingReport(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Nuevo Reporte
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={scheduledReports}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} reportes programados`
          }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingReport ? 'Editar Reporte Programado' : 'Nuevo Reporte Programado'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingReport(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            periodicidad: 'daily',
            idioma: 'es_MX',
            fechas_tipo: 'fixed',
            hora_ejecucion: moment('08:00', 'HH:mm'),
            dia_mes: 1,
            activo: true
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="nombre"
                label="Nombre del Reporte"
                rules={[{ required: true, message: 'Por favor ingresa el nombre del reporte' }]}
              >
                <Input placeholder="Ej: Reporte de Ventas Diario" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tipo_reporte"
                label="Tipo de Reporte"
                rules={[{ required: true, message: 'Por favor selecciona el tipo de reporte' }]}
              >
                <Select placeholder="Selecciona el tipo de reporte">
                  {reportTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Space>
                        {type.icon}
                        {type.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="evento_id"
                label="Evento Específico (Opcional)"
              >
                <Select placeholder="Todos los eventos" allowClear>
                  {events.map(event => (
                    <Option key={event.id} value={event.id}>
                      {event.nombre} - {new Date(event.fecha_evento).toLocaleDateString()}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fechas_tipo"
                label="Tipo de Fechas"
              >
                <Radio.Group>
                  <Radio value="fixed">Fijas</Radio>
                  <Radio value="sliding">Deslizantes</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idioma"
                label="Idioma"
              >
                <Select>
                  {languages.map(lang => (
                    <Option key={lang.value} value={lang.value}>
                      {lang.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fecha_inicio"
                label="Fecha de Inicio"
                rules={[{ required: true, message: 'Por favor selecciona la fecha de inicio' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fecha_fin"
                label="Fecha de Fin"
                rules={[{ required: true, message: 'Por favor selecciona la fecha de fin' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email_destinatarios"
            label="Correos Destinatarios"
            rules={[
              { required: true, message: 'Por favor ingresa los correos destinatarios' },
              { type: 'email', message: 'Por favor ingresa correos válidos separados por comas' }
            ]}
          >
            <Input.TextArea 
              placeholder="email1@ejemplo.com, email2@ejemplo.com"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="periodicidad"
            label="Periodicidad"
            rules={[{ required: true, message: 'Por favor selecciona la periodicidad' }]}
          >
            <Radio.Group>
              {periodicities.map(period => (
                <Radio key={period.value} value={period.value}>
                  {period.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.periodicidad !== currentValues.periodicidad
            }
          >
            {({ getFieldValue }) => {
              const periodicidad = getFieldValue('periodicidad');
              
              if (periodicidad === 'weekly') {
                return (
                  <Form.Item
                    name="dias_semana"
                    label="Días de la Semana"
                    rules={[{ required: true, message: 'Por favor selecciona al menos un día' }]}
                  >
                    <Checkbox.Group>
                      <Row>
                        {weekDays.map(day => (
                          <Col key={day.value} span={3}>
                            <Checkbox value={day.value}>{day.label}</Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                );
              }
              
              if (periodicidad === 'monthly') {
                return (
                  <Form.Item
                    name="dia_mes"
                    label="Día del Mes"
                    rules={[{ required: true, message: 'Por favor selecciona el día del mes' }]}
                  >
                    <Input type="number" min={1} max={31} />
                  </Form.Item>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hora_ejecucion"
                label="Hora de Ejecución"
                rules={[{ required: true, message: 'Por favor selecciona la hora de ejecución' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="activo"
                label="Activo"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingReport ? 'Actualizar' : 'Crear'} Reporte
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingReport(null);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduledReports;
