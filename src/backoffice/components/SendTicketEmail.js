import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Alert,
  Space,
  Typography,
  Divider,
  Checkbox,
  List,
  Avatar,
  Tag
} from 'antd';
import {
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { TicketEmailService } from '../services/ticketEmailService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SendTicketEmail = ({ 
  visible, 
  onClose, 
  tickets, 
  eventData, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasEmailConfig, setHasEmailConfig] = useState(false);
  const [emailConfigStatus, setEmailConfigStatus] = useState('checking');

  useEffect(() => {
    if (visible) {
      checkEmailConfig();
      form.resetFields();
    }
  }, [visible]);

  const checkEmailConfig = async () => {
    try {
      setEmailConfigStatus('checking');
      const hasConfig = await TicketEmailService.hasEmailConfig();
      setHasEmailConfig(hasConfig);
      setEmailConfigStatus(hasConfig ? 'configured' : 'not-configured');
    } catch (error) {
      setEmailConfigStatus('error');
      console.error('Error verificando configuración de correo:', error);
    }
  };

  const handleSendEmail = async (values) => {
    try {
      setLoading(true);

      const { email, message: customMessage, sendIndividualTickets } = values;

      if (sendIndividualTickets) {
        // Enviar tickets individuales
        await sendIndividualTickets(email, customMessage);
      } else {
        // Enviar todos los tickets en un correo
        await sendMultipleTickets(email, customMessage);
      }

      message.success('Tickets enviados por correo correctamente');
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error enviando tickets por correo:', error);
      message.error('Error enviando tickets por correo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendIndividualTickets = async (email, customMessage) => {
    const promises = tickets.map(async (ticket) => {
      const ticketData = {
        eventName: eventData.nombre,
        eventDate: eventData.fecha,
        eventTime: eventData.hora,
        venueName: eventData.recinto?.nombre || 'Sin especificar',
        venueAddress: eventData.recinto?.direccion || 'Sin especificar',
        ticketNumber: ticket.numero || ticket.id,
        seatInfo: ticket.asiento || ticket.fila,
        zoneName: ticket.zona?.nombre || 'General',
        price: ticket.precio || '0',
        companyName: eventData.empresa?.nombre || 'Tu Empresa',
        supportEmail: eventData.empresa?.email || 'soporte@tuempresa.com',
        customMessage
      };

      return TicketEmailService.sendTicketEmail(ticketData, email);
    });

    await Promise.all(promises);
  };

  const sendMultipleTickets = async (email, customMessage) => {
    const ticketsData = {
      eventName: eventData.nombre,
      eventDate: eventData.fecha,
      eventTime: eventData.hora,
      venueName: eventData.recinto?.nombre || 'Sin especificar',
      venueAddress: eventData.recinto?.direccion || 'Sin especificar',
      totalPrice: tickets.reduce((sum, ticket) => sum + (ticket.precio || 0), 0),
      companyName: eventData.empresa?.nombre || 'Tu Empresa',
      supportEmail: eventData.empresa?.email || 'soporte@tuempresa.com',
      customMessage,
      tickets: tickets.map(ticket => ({
        ticketNumber: ticket.numero || ticket.id,
        seatInfo: ticket.asiento || ticket.fila,
        zoneName: ticket.zona?.nombre || 'General',
        price: ticket.precio || '0'
      }))
    };

    await TicketEmailService.sendMultipleTicketsEmail(ticketsData, email);
  };

  const renderEmailConfigStatus = () => {
    switch (emailConfigStatus) {
      case 'checking':
        return (
          <Alert
            message="Verificando configuración de correo..."
            type="info"
            showIcon
            className="mb-4"
          />
        );
      
      case 'configured':
        return (
          <Alert
            message="Configuración de correo activa"
            description="Los tickets se enviarán usando la configuración SMTP de tu empresa"
            type="success"
            showIcon
            className="mb-4"
          />
        );
      
      case 'not-configured':
        return (
          <Alert
            message="Configuración de correo no encontrada"
            description="Necesitas configurar el servidor SMTP de tu empresa para enviar correos"
            type="warning"
            showIcon
            className="mb-4"
            action={
              <Button size="small" type="link" href="/backoffice/email-config">
                Configurar Correo
              </Button>
            }
          />
        );
      
      case 'error':
        return (
          <Alert
            message="Error verificando configuración"
            description="No se pudo verificar la configuración de correo"
            type="error"
            showIcon
            className="mb-4"
          />
        );
      
      default:
        return null;
    }
  };

  const renderTicketsSummary = () => (
    <div className="mb-4">
      <Title level={5}>
        <CheckCircleOutlined className="mr-2 text-green-600" />
        Resumen de Tickets
      </Title>
      
      <List
        size="small"
        dataSource={tickets}
        renderItem={(ticket, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar style={{ backgroundColor: '#87d068' }}>
                  {index + 1}
                </Avatar>
              }
              title={`Ticket #${ticket.numero || ticket.id}`}
              description={
                <Space direction="vertical" size="small">
                  <Text>
                    <strong>Asiento:</strong> {ticket.asiento || ticket.fila || 'General'}
                  </Text>
                  <Text>
                    <strong>Zona:</strong> {ticket.zona?.nombre || 'General'}
                  </Text>
                  <Text>
                    <strong>Precio:</strong> ${ticket.precio || '0'}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
      
      <Divider />
      
      <div className="flex justify-between items-center">
        <Text strong>Total de tickets: {tickets.length}</Text>
        <Text strong>
          Precio total: ${tickets.reduce((sum, ticket) => sum + (ticket.precio || 0), 0)}
        </Text>
      </div>
    </div>
  );

  if (!hasEmailConfig && emailConfigStatus === 'not-configured') {
    return (
      <Modal
        title="Enviar Tickets por Correo"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Cerrar
          </Button>
        ]}
        width={600}
      >
        {renderEmailConfigStatus()}
        
        <div className="text-center py-8">
          <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />
          <Title level={4} className="mt-4">
            Configuración de Correo Requerida
          </Title>
          <Paragraph>
            Para enviar tickets por correo, primero debes configurar el servidor SMTP de tu empresa.
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            href="/backoffice/email-config"
            className="mt-4"
          >
            Ir a Configuración de Correo
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          Enviar Tickets por Correo
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {renderEmailConfigStatus()}
      
      {renderTicketsSummary()}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSendEmail}
        initialValues={{
          sendIndividualTickets: false
        }}
      >
        <Form.Item
          name="email"
          label="Email del destinatario"
          rules={[
            { required: true, message: 'Email es requerido' },
            { type: 'email', message: 'Formato de email inválido' }
          ]}
        >
          <Input 
            placeholder="cliente@email.com" 
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="message"
          label="Mensaje personalizado (opcional)"
        >
          <TextArea
            placeholder="Escribe un mensaje personalizado para el cliente..."
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="sendIndividualTickets"
          valuePropName="checked"
        >
          <Checkbox>
            Enviar cada ticket en un correo separado
          </Checkbox>
        </Form.Item>

        <div className="text-xs text-gray-500 mb-4">
          <Text type="secondary">
            <strong>Nota:</strong> Si no marcas la casilla, todos los tickets se enviarán en un solo correo.
            Si la marcas, cada ticket se enviará en un correo individual.
          </Text>
        </div>

        <Divider />

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose}>
            Cancelar
          </Button>
          
          <Button
            type="primary"
            icon={<SendOutlined />}
            htmlType="submit"
            loading={loading}
            disabled={!hasEmailConfig}
            size="large"
          >
            Enviar Tickets por Correo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SendTicketEmail;
