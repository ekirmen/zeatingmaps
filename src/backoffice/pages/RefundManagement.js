import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Tag, 
  Space,
  Typography,
  DatePicker,
  Select,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  DollarOutlined, 
  CheckCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { 
  getAllRefunds, 
  approveManualRefund, 
  rejectRefund,
  processRefund 
} from '../../store/services/refundService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionForm] = Form.useForm();
  const [filters, setFilters] = useState({
    status: '',
    dateRange: null
  });

  useEffect(() => {
    loadRefunds();
  }, [filters]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const data = await getAllRefunds(filters);
      setRefunds(data);
    } catch (error) {
      console.error('Error loading refunds:', error);
      message.error('Error al cargar los reembolsos');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async (refundId) => {
    try {
      const values = await actionForm.validateFields();
      await approveManualRefund(refundId, values.adminNotes);
      message.success('Reembolso aprobado correctamente');
      setActionModalVisible(false);
      actionForm.resetFields();
      loadRefunds();
    } catch (error) {
      console.error('Error approving refund:', error);
      message.error('Error al aprobar el reembolso');
    }
  };

  const handleRejectRefund = async (refundId) => {
    try {
      const values = await actionForm.validateFields();
      await rejectRefund(refundId, values.adminNotes);
      message.success('Reembolso rechazado correctamente');
      setActionModalVisible(false);
      actionForm.resetFields();
      loadRefunds();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      message.error('Error al rechazar el reembolso');
    }
  };

  const handleProcessRefund = async (refund) => {
    try {
      setSelectedRefund(refund);
      setModalVisible(true);
      
      const gateway = refund.payment_transactions?.payment_gateways;
      if (gateway) {
        await processRefund(refund.id, gateway);
        message.success('Reembolso procesado correctamente');
        loadRefunds();
      } else {
        message.error('No se pudo procesar el reembolso - pasarela no encontrada');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      message.error('Error al procesar el reembolso');
    } finally {
      setModalVisible(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
      pending_manual: 'blue',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      completed: <CheckCircleOutlined />,
      failed: <CloseOutlined />,
      cancelled: <CloseOutlined />,
      pending_manual: <ExclamationCircleOutlined />,
      rejected: <CloseOutlined />
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => id.slice(0, 8) + '...'
    },
    {
      title: 'Transacción',
      dataIndex: ['payment_transactions', 'id'],
      key: 'transaction',
      render: (id) => id ? id.slice(0, 8) + '...' : 'N/A'
    },
    {
      title: 'Pasarela',
      dataIndex: ['payment_transactions', 'gateway_id'],
      key: 'gateway',
      render: (name) => name || 'N/A'
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`
    },
    {
      title: 'Razón',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reason || 'N/A'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleProcessRefund(record)}
            >
              Procesar
            </Button>
          )}
          {record.status === 'pending_manual' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedRefund(record);
                setActionModalVisible(true);
              }}
            >
              Aprobar
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="¿Rechazar reembolso?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => {
                setSelectedRefund(record);
                setActionModalVisible(true);
              }}
              okText="Sí"
              cancelText="No"
            >
              <Button type="default" size="small" danger>
                Rechazar
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Gestión de Reembolsos</Title>
        <Text type="secondary">
          Administra y procesa las solicitudes de reembolso
        </Text>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <Space>
          <Select
            placeholder="Filtrar por estado"
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="pending">Pendiente</Option>
            <Option value="completed">Completado</Option>
            <Option value="failed">Fallido</Option>
            <Option value="cancelled">Cancelado</Option>
            <Option value="pending_manual">Pendiente Manual</Option>
            <Option value="rejected">Rechazado</Option>
          </Select>
          <RangePicker
            onChange={(dates) => setFilters(prev => ({ 
              ...prev, 
              dateRange: dates ? [dates[0].toISOString(), dates[1].toISOString()] : null 
            }))}
            placeholder={['Fecha inicio', 'Fecha fin']}
          />
          <Button onClick={loadRefunds}>
            Actualizar
          </Button>
        </Space>
      </Card>

      {/* Tabla de Reembolsos */}
      <Card>
        <Table
          columns={columns}
          dataSource={refunds}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} reembolsos`
          }}
        />
      </Card>

      {/* Modal de Procesamiento */}
      <Modal
        title="Procesando Reembolso"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {selectedRefund && (
          <div>
            <p>Procesando reembolso de ${selectedRefund.amount}...</p>
            <p>Pasarela: {selectedRefund.payment_transactions?.gateway_id}</p>
          </div>
        )}
      </Modal>

      {/* Modal de Acción (Aprobar/Rechazar) */}
      <Modal
        title={`${selectedRefund?.status === 'pending_manual' ? 'Aprobar' : 'Rechazar'} Reembolso`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          actionForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setActionModalVisible(false);
            actionForm.resetFields();
          }}>
            Cancelar
          </Button>,
          selectedRefund?.status === 'pending_manual' ? (
            <Button key="approve" type="primary" onClick={() => handleApproveRefund(selectedRefund.id)}>
              Aprobar
            </Button>
          ) : (
            <Button key="reject" danger onClick={() => handleRejectRefund(selectedRefund.id)}>
              Rechazar
            </Button>
          )
        ]}
      >
        <Form form={actionForm} layout="vertical">
          <Form.Item
            name="adminNotes"
            label="Notas del Administrador"
            rules={[{ required: true, message: 'Por favor ingresa las notas' }]}
          >
            <TextArea rows={4} placeholder="Ingresa las notas para esta acción..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RefundManagement; 