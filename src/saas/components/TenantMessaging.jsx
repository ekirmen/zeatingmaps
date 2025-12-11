import React, { useState, useEffect, useRef } from 'react';
import { Card, List, Input, Button, Typography, Space, Tag, Avatar, Badge, Drawer, Select, message, Upload } from '../../utils/antdComponents';
import { 
  MessageOutlined, 
  SendOutlined, 
  UserOutlined, 
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PaperClipOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TenantMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newConversationVisible, setNewConversationVisible] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    subject: '',
    priority: 'medium',
    content: ''
  });
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
    
    // Suscribirse a nuevos mensajes
    const subscription = supabase
      .channel('tenant_messaging')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tenant_messages' },
        (payload) => {
          if (payload.new.sender_type === 'saas') {
            setMessages(prev => [...prev, payload.new]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_conversations')
        .select(`
          *,
          tenants:tenant_id(name),
          assigned_user:assigned_to(email, user_metadata)
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
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
          sender_type: 'tenant',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Error al enviar mensaje');
    }
  };

  const createNewConversation = async () => {
    if (!newConversationData.subject.trim() || !newConversationData.content.trim()) {
      message.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tenant_conversations')
        .insert({
          tenant_id: currentUser?.user_metadata?.tenant_id || 'default',
          subject: newConversationData.subject,
          priority: newConversationData.priority,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar mensaje inicial
      await supabase
        .from('tenant_messages')
        .insert({
          conversation_id: data.id,
          sender_id: currentUser.id,
          sender_type: 'tenant',
          content: newConversationData.content
        });

      message.success('Conversaci³n creada exitosamente');
      setNewConversationVisible(false);
      setNewConversationData({ subject: '', priority: 'medium', content: '' });
      loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
      message.error('Error al crear conversaci³n');
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
    const isTenant = message.sender_type === 'tenant';
    
    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isTenant ? 'flex-end' : 'flex-start',
          marginBottom: '12px'
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: isTenant ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <Avatar
            icon={isTenant ? <UserOutlined /> : <CustomerServiceOutlined />}
            style={{
              backgroundColor: isTenant ? '#1890ff' : '#52c41a'
            }}
          />
          <div
            style={{
              backgroundColor: isTenant ? '#1890ff' : '#f5f5f5',
              color: isTenant ? 'white' : 'black',
              padding: '8px 12px',
              borderRadius: '12px',
              position: 'relative'
            }}
          >
            <Text style={{ color: isTenant ? 'white' : 'black' }}>
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

  const renderConversationItem = (conversation) => (
    <List.Item
      key={conversation.id}
      onClick={() => openConversation(conversation)}
      style={{ cursor: 'pointer' }}
    >
      <List.Item.Meta
        avatar={
          <Avatar icon={<MessageOutlined />} style={{ backgroundColor: '#1890ff' }} />
        }
        title={
          <Space>
            <Text strong>{conversation.subject}</Text>
            <Tag color={priorityColors[conversation.priority]}>
              {conversation.priority.toUpperCase()}
            </Tag>
            <Tag color={statusColors[conversation.status]}>
              {conversation.status.toUpperCase()}
            </Tag>
          </Space>
        }
        description={
          <div>
            <Text type="secondary">
              {conversation.assigned_user?.email || 'Sin asignar'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatDate(conversation.last_message_at)}
            </Text>
          </div>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <MessageOutlined style={{ marginRight: '8px' }} />
          Mensajer­a con Soporte
        </Title>
        <Text type="secondary">
          Comun­cate con nuestro equipo de soporte t©cnico
        </Text>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Lista de conversaciones */}
        <div style={{ flex: 1 }}>
          <Card
            title={
              <Space>
                <MessageOutlined />
                <span>Conversaciones</span>
                <Badge count={unreadCount} />
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewConversationVisible(true)}
              >
                Nueva Conversaci³n
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={conversations}
              renderItem={renderConversationItem}
              locale={{ emptyText: 'No hay conversaciones' }}
            />
          </Card>
        </div>

        {/* Panel de mensajes */}
        <div style={{ flex: 2 }}>
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
                'Selecciona una conversaci³n'
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
                        <Text type="secondary">No hay mensajes en esta conversaci³n</Text>
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
                    placeholder="Escribe tu mensaje..."
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
                  <Text type="secondary">Selecciona una conversaci³n para ver los mensajes</Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal para nueva conversaci³n */}
      <Drawer
        title="Nueva Conversaci³n"
        placement="right"
        width={500}
        open={newConversationVisible}
        onClose={() => setNewConversationVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setNewConversationVisible(false)}>
              Cancelar
            </Button>
            <Button type="primary" onClick={createNewConversation}>
              Crear Conversaci³n
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Asunto *</Text>
            <Input
              value={newConversationData.subject}
              onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Describe brevemente tu consulta"
            />
          </div>

          <div>
            <Text strong>Prioridad</Text>
            <Select
              value={newConversationData.priority}
              onChange={(value) => setNewConversationData(prev => ({ ...prev, priority: value }))}
              style={{ width: '100%' }}
            >
              <Option value="low">Baja</Option>
              <Option value="medium">Media</Option>
              <Option value="high">Alta</Option>
              <Option value="urgent">Urgente</Option>
            </Select>
          </div>

          <div>
            <Text strong>Mensaje *</Text>
            <TextArea
              value={newConversationData.content}
              onChange={(e) => setNewConversationData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Describe tu consulta o problema en detalle"
              rows={6}
            />
          </div>
        </Space>
      </Drawer>
    </div>
  );
};

export default TenantMessaging;


