import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Typography, 
  Badge, 
  Timeline, 
  Avatar, 
  Tooltip, 
  message,
  Drawer,
  List,
  Divider,
  Rate,
  Alert,
  Checkbox
} from '../../utils/antdComponents';
import { 
  CustomerServiceOutlined, 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MessageOutlined,
  HistoryOutlined,
  StarOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SupportTicketSystem = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [responseForm] = Form.useForm();
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          tenants(company_name, subdomain),
          assigned_to:auth.users(email),
          responses:support_responses(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      message.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    setSelectedTicket(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    form.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assigned_to: ticket.assigned_to
    });
    setModalVisible(true);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setDetailDrawerVisible(true);
  };

  const handleSaveTicket = async (values) => {
    try {
      if (selectedTicket) {
        // Actualizar ticket existente
        const { error } = await supabase
          .from('support_tickets')
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id);

        if (error) throw error;
        message.success('Ticket actualizado correctamente');
      } else {
        // Crear nuevo ticket
        const { error } = await supabase
          .from('support_tickets')
          .insert([values]);

        if (error) throw error;
        message.success('Ticket creado correctamente');
      }

      setModalVisible(false);
      loadTickets();
    } catch (error) {
      console.error('Error saving ticket:', error);
      message.error('Error al guardar ticket');
    }
  };

  const handleAddResponse = async (values) => {
    try {
      const { error } = await supabase
        .from('support_responses')
        .insert([{
          ticket_id: selectedTicket.id,
          message: values.message,
          is_internal: values.is_internal || false
        }]);

      if (error) throw error;

      // Actualizar estado del ticket si es necesario
      if (values.update_status) {
        await supabase
          .from('support_tickets')
          .update({ status: values.update_status })
          .eq('id', selectedTicket.id);
      }

      message.success('Respuesta agregada correctamente');
      setResponseModalVisible(false);
      responseForm.resetFields();
      loadTickets();
    } catch (error) {
      console.error('Error adding response:', error);
      message.error('Error al agregar respuesta');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const columns = [
    {
      title: 'Ticket',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>#{id.slice(0, 8)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.title}</div>
        </div>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => (
        <div>
          <div>{tenant?.company_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {tenant?.subdomain}.ticketera.com
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: 'Categor­a',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag>{category || 'Sin categor­a'}</Tag>
      ),
    },
    {
      title: 'Asignado',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assigned) => (
        <div>
          {assigned ? (
            <Avatar size="small" icon={<UserOutlined />} />
          ) : (
            <Tag color="orange">Sin asignar</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Respuestas',
      dataIndex: 'responses',
      key: 'responses',
      render: (responses) => (
        <Badge count={responses?.length || 0} size="small">
          <MessageOutlined />
        </Badge>
      ),
    },
    {
      title: 'Satisfacci³n',
      dataIndex: 'satisfaction_rating',
      key: 'satisfaction',
      render: (rating) => (
        rating ? (
          <Rate disabled defaultValue={rating} size="small" />
        ) : (
          <Text type="secondary">Sin calificar</Text>
        )
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <div>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            Ver
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditTicket(record)}
          >
            Editar
          </Button>
          <Button 
            size="small" 
            icon={<MessageOutlined />}
            onClick={() => {
              setSelectedTicket(record);
              setResponseModalVisible(true);
            }}
          >
            Responder
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <CustomerServiceOutlined />
            <span>Sistema de Tickets de Soporte</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="Estado"
              value={filters.status}
              onChange={(value) => setFilters({...filters, status: value})}
              style={{ width: 120 }}
            >
              <Option value="all">Todos</Option>
              <Option value="open">Abierto</Option>
              <Option value="in_progress">En Progreso</Option>
              <Option value="resolved">Resuelto</Option>
              <Option value="closed">Cerrado</Option>
            </Select>
            <Select
              placeholder="Prioridad"
              value={filters.priority}
              onChange={(value) => setFilters({...filters, priority: value})}
              style={{ width: 120 }}
            >
              <Option value="all">Todas</Option>
              <Option value="urgent">Urgente</Option>
              <Option value="high">Alta</Option>
              <Option value="normal">Normal</Option>
              <Option value="low">Baja</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTicket}>
              Nuevo Ticket
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tickets}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} tickets`
          }}
        />
      </Card>

      {/* Modal para crear/editar ticket */}
      <Modal
        title={selectedTicket ? 'Editar Ticket' : 'Nuevo Ticket de Soporte'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTicket}
        >
          <Form.Item
            name="title"
            label="T­tulo"
            rules={[{ required: true, message: 'T­tulo requerido' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripci³n"
            rules={[{ required: true, message: 'Descripci³n requerida' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Categor­a"
          >
            <Select>
              <Option value="technical">T©cnico</Option>
              <Option value="billing">Facturaci³n</Option>
              <Option value="feature_request">Solicitud de Caracter­stica</Option>
              <Option value="bug_report">Reporte de Error</Option>
              <Option value="general">General</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Prioridad"
            rules={[{ required: true, message: 'Prioridad requerida' }]}
          >
            <Select>
              <Option value="low">Baja</Option>
              <Option value="normal">Normal</Option>
              <Option value="high">Alta</Option>
              <Option value="urgent">Urgente</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Estado"
            rules={[{ required: true, message: 'Estado requerido' }]}
          >
            <Select>
              <Option value="open">Abierto</Option>
              <Option value="in_progress">En Progreso</Option>
              <Option value="resolved">Resuelto</Option>
              <Option value="closed">Cerrado</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedTicket ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer para ver detalles del ticket */}
      <Drawer
        title={`Ticket #${selectedTicket?.id?.slice(0, 8)}`}
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        visible={detailDrawerVisible}
      >
        {selectedTicket && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Title level={4}>{selectedTicket.title}</Title>
                <Space>
                  <Tag color={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Tag>
                  <Tag color={getPriorityColor(selectedTicket.priority)}>
                    {getPriorityText(selectedTicket.priority)}
                  </Tag>
                </Space>
              </div>
              <Paragraph>{selectedTicket.description}</Paragraph>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Creado: {new Date(selectedTicket.created_at).toLocaleString()}
              </div>
            </Card>

            <Divider />

            <Title level={5}>Respuestas</Title>
            <Timeline>
              {selectedTicket.responses?.map((response, index) => (
                <Timeline.Item 
                  key={response.id}
                  dot={response.is_internal ? <ExclamationCircleOutlined /> : <MessageOutlined />}
                >
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>
                        {response.is_internal ? 'Nota Interna' : 'Respuesta'}
                      </Text>
                      <Text type="secondary">
                        {new Date(response.created_at).toLocaleString()}
                      </Text>
                    </div>
                    <Paragraph>{response.message}</Paragraph>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>

            <Divider />

            <Button 
              type="primary" 
              icon={<MessageOutlined />}
              onClick={() => {
                setDetailDrawerVisible(false);
                setResponseModalVisible(true);
              }}
            >
              Agregar Respuesta
            </Button>
          </div>
        )}
      </Drawer>

      {/* Modal para agregar respuesta */}
      <Modal
        title="Agregar Respuesta"
        visible={responseModalVisible}
        onCancel={() => setResponseModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={responseForm}
          layout="vertical"
          onFinish={handleAddResponse}
        >
          <Form.Item
            name="message"
            label="Mensaje"
            rules={[{ required: true, message: 'Mensaje requerido' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="is_internal"
            valuePropName="checked"
          >
            <Checkbox>Nota interna (solo visible para administradores)</Checkbox>
          </Form.Item>

          <Form.Item
            name="update_status"
            label="Actualizar estado del ticket"
          >
            <Select allowClear>
              <Option value="in_progress">En Progreso</Option>
              <Option value="resolved">Resuelto</Option>
              <Option value="closed">Cerrado</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Enviar Respuesta
              </Button>
              <Button onClick={() => setResponseModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportTicketSystem;


