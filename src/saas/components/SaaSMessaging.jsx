import React, { useState, useEffect, useRef } from 'react';
import { Card, List, Input, Button, Typography, Space, Tag, Avatar, Badge, Drawer, Select, message, Table, Row, Col, Statistic } from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  UserOutlined, 
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SaaSMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned: 'all'
  });
  const [stats, setStats] = useState({});
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  const priorityColors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
    urgent: 'purple'
  };

  const statusColors = {
    open: 'green',
    pending: 'orange',
    closed: 'gray'
  };

  useEffect(() => {
    // Obtener usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();

    // Cargar conversaciones
    loadConversations();
    loadStats();
    
    // Suscribirse a nuevos mensajes
    const subscription = supabase
      .channel('saas_messaging')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tenant_messages' },
        (payload) => {
          if (payload.new.sender_type === 'tenant') {
            setMessages(prev => [...prev, payload.new]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filters]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('tenant_conversations')
        .select(`
          *,
          tenants:tenant_id(name, email),
          assigned_user:assigned_to(email, user_metadata),
          created_user:created_by(email, user_metadata)
        `)
        .order('last_message_at', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.assigned !== 'all') {
        if (filters.assigned === 'me') {
          query = query.eq('assigned_to', currentUser?.id);
        } else if (filters.assigned === 'unassigned') {
          query = query.is('assigned_to', null);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_conversations')
        .select('status, priority, assigned_to');

      if (error) throw error;

      const statsData = {
        total: data.length,
        open: data.filter(c => c.status === 'open').length,
        pending: data.filter(c => c.status === 'pending').length,
        closed: data.filter(c => c.status === 'closed').length,
        urgent: data.filter(c => c.priority === 'urgent').length,
        unassigned: data.filter(c => !c.assigned_to).length
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('tenant_messages')
        .select(`
          *,
          sender:sender_id(email, user_metadata)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const openConversation = (conversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
    setIsOpen(true);
    setUnreadCount(0);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tenant_messages')
        .insert({
          conversation_id: currentConversation.id,
          sender_id: currentUser.id,
          sender_type: 'saas',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Error al enviar mensaje');
    }
  };

  const assignConversation = async (conversationId, userId) => {
    try {
      const { error } = await supabase
        .from('tenant_conversations')
        .update({ assigned_to: userId })
        .eq('id', conversationId);

      if (error) throw error;

      message.success('Conversación asignada exitosamente');
      loadConversations();
    } catch (error) {
      console.error('Error assigning conversation:', error);
      message.error('Error al asignar conversación');
    }
  };

  const updateConversationStatus = async (conversationId, status) => {
    try {
      const { error } = await supabase
        .from('tenant_conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) throw error;

      message.success('Estado actualizado exitosamente');
      loadConversations();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error al actualizar estado');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  const renderMessage = (message) => {
    const isSaaS = message.sender_type === 'saas';
    
    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isSaaS ? 'flex-end' : 'flex-start',
          marginBottom: '12px'
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: isSaaS ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <Avatar
            icon={isSaaS ? <CustomerServiceOutlined /> : <UserOutlined />}
            style={{
              backgroundColor: isSaaS ? '#52c41a' : '#1890ff'
            }}
          />
          <div
            style={{
              backgroundColor: isSaaS ? '#52c41a' : '#f5f5f5',
              color: isSaaS ? 'white' : 'black',
              padding: '8px 12px',
              borderRadius: '12px',
              position: 'relative'
            }}
          >
            <Text style={{ color: isSaaS ? 'white' : 'black' }}>
              {message.content}
            </Text>
            <div
              style={{
                fontSize: '10px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.7
              }}
            >
              {formatTime(message.created_at)}
              {message.is_read && <CheckCircleOutlined />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const conversationColumns = [
    {
      title: 'Tenant',
      dataIndex: 'tenants',
      key: 'tenant',
      render: (tenant) => tenant?.name || 'N/A',
    },
    {
      title: 'Asunto',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject, record) => (
        <Space>
          <Text strong>{subject}</Text>
          {record.priority === 'urgent' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priorityColors[priority]}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Asignado a',
      dataIndex: 'assigned_user',
      key: 'assigned',
      render: (user) => user?.email || 'Sin asignar',
    },
    {
      title: 'Último mensaje',
      dataIndex: 'last_message_at',
      key: 'last_message',
      render: (date) => formatDate(date),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => openConversation(record)}
          >
            Ver
          </Button>
          <Select
            placeholder="Asignar"
            style={{ width: 120 }}
            onChange={(value) => assignConversation(record.id, value)}
          >
            <Option value={currentUser?.id}>A mí</Option>
            <Option value={null}>Sin asignar</Option>
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <MessageOutlined style={{ marginRight: '8px' }} />
          Centro de Mensajería SaaS
        </Title>
        <Text type="secondary">
          Gestiona las conversaciones con los tenants
        </Text>
      </div>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total"
              value={stats.total || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Abiertas"
              value={stats.open || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Pendientes"
              value={stats.pending || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Urgentes"
              value={stats.urgent || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Sin asignar"
              value={stats.unassigned || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Select
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            style={{ width: 150 }}
          >
            <Option value="all">Todos los estados</Option>
            <Option value="open">Abiertas</Option>
            <Option value="pending">Pendientes</Option>
            <Option value="closed">Cerradas</Option>
          </Select>
          <Select
            value={filters.priority}
            onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            style={{ width: 150 }}
          >
            <Option value="all">Todas las prioridades</Option>
            <Option value="low">Baja</Option>
            <Option value="medium">Media</Option>
            <Option value="high">Alta</Option>
            <Option value="urgent">Urgente</Option>
          </Select>
          <Select
            value={filters.assigned}
            onChange={(value) => setFilters(prev => ({ ...prev, assigned: value }))}
            style={{ width: 150 }}
          >
            <Option value="all">Todas</Option>
            <Option value="me">Asignadas a mí</Option>
            <Option value="unassigned">Sin asignar</Option>
          </Select>
          <Button onClick={loadConversations}>
            Actualizar
          </Button>
        </Space>
      </Card>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Tabla de conversaciones */}
        <div style={{ flex: 2 }}>
          <Card title="Conversaciones">
            <Table
              columns={conversationColumns}
              dataSource={conversations}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>

        {/* Panel de mensajes */}
        <div style={{ flex: 1 }}>
          <Card
            title={
              currentConversation ? (
                <Space>
                  <MessageOutlined />
                  <span>{currentConversation.subject}</span>
                  <Tag color={priorityColors[currentConversation.priority]}>
                    {currentConversation.priority.toUpperCase()}
                  </Tag>
                </Space>
              ) : (
                'Selecciona una conversación'
              )
            }
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
          >
            {currentConversation ? (
              <>
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '16px'
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                      <MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                      <div style={{ marginTop: '16px' }}>
                        <Text type="secondary">No hay mensajes en esta conversación</Text>
                      </div>
                    </div>
                  ) : (
                    messages.map(renderMessage)
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <MessageOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">Selecciona una conversación para ver los mensajes</Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SaaSMessaging;
