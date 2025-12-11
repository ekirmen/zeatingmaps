import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  Tooltip,
  Popconfirm
} from '../../utils/antdComponents';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  PercentageOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;

const ComisionesTasas = () => {
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingComision, setEditingComision] = useState(null);
  const [form] = Form.useForm();

  // Tipos de comisiones predefinidas
  const tiposComisiones = [
    { id: 'stripe', name: 'Stripe', tipo: 'porcentaje', valor: 2.9, fijo: 0.30 },
    { id: 'paypal', name: 'PayPal', tipo: 'porcentaje', valor: 2.9, fijo: 0.30 },
    { id: 'transferencia', name: 'Transferencia Bancaria', tipo: 'fijo', valor: 0, fijo: 0 },
    { id: 'efectivo', name: 'Efectivo', tipo: 'fijo', valor: 0, fijo: 0 },
    { id: 'pago_movil', name: 'Pago M³vil', tipo: 'porcentaje', valor: 3.5, fijo: 0.50 }
  ];

  useEffect(() => {
    loadComisiones();
  }, []);

  

      // Cargar comisiones desde la base de datos
      const { data: comisionesData, error } = await supabase
        .from('comisiones_tasas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no existe
      }

      // Si no hay datos en la BD, usar los tipos predefinidos
      if (!comisionesData || comisionesData.length === 0) {
        setComisiones(tiposComisiones);
      } else {
        setComisiones(comisionesData);
      }
    } catch (error) {
      console.error('Error loading comisiones:', error);
      setComisiones(tiposComisiones);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComision = async (values) => {
    try {
      const comisionData = {
        ...values,
        updated_at: new Date().toISOString()
      };

      if (editingComision) {
        // Actualizar comisi³n existente
        const { error } = await supabase
          .from('comisiones_tasas')
          .update(comisionData)
          .eq('id', editingComision.id);

        if (error) throw error;

        setComisiones(prev =>
          prev.map(comision =>
            comision.id === editingComision.id
              ? { ...comision, ...values }
              : comision
          )
        );
        message.success('Comisi³n actualizada correctamente');
      } else {
        // Crear nueva comisi³n
        const { data, error } = await supabase
          .from('comisiones_tasas')
          .insert([comisionData])
          .select();

        if (error) throw error;

        setComisiones(prev => [data[0], ...prev]);
        message.success('Comisi³n creada correctamente');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingComision(null);
    } catch (error) {
      console.error('Error saving comision:', error);
      message.error('Error al guardar la comisi³n');
    }
  };

  const handleEdit = (comision) => {
    setEditingComision(comision);
    form.setFieldsValue(comision);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('comisiones_tasas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComisiones(prev => prev.filter(comision => comision.id !== id));
      message.success('Comisi³n eliminada correctamente');
    } catch (error) {
      console.error('Error deleting comision:', error);
      message.error('Error al eliminar la comisi³n');
    }
  };

  const columns = [
    {
      title: 'M©todo de Pago',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <DollarOutlined className="text-blue-600" />
          </div>
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'porcentaje' ? 'blue' : 'green'}>
          {tipo === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
        </Tag>
      )
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      render: (valor, record) => (
        <div>
          {record.tipo === 'porcentaje' ? (
            <span className="text-blue-600 font-medium">{valor}%</span>
          ) : (
            <span className="text-green-600 font-medium">${valor}</span>
          )}
        </div>
      )
    },
    {
      title: 'Tasa Fija',
      dataIndex: 'fijo',
      key: 'fijo',
      render: (fijo) => (
        <span className="text-gray-600">${fijo}</span>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar esta comisi³n?"
            onConfirm={() => handleDelete(record.id)}
            okText="S­"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Comisiones y Tasas</Title>
        <Text type="secondary">
          Gestiona las comisiones y tasas aplicadas a cada m©todo de pago
        </Text>
      </div>

      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InfoCircleOutlined className="text-blue-500" />
              <Text strong>Informaci³n Importante</Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingComision(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Nueva Comisi³n
            </Button>
          </div>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <Text type="secondary">
              Las comisiones configuradas aqu­ se aplicar¡n autom¡ticamente al calcular los precios finales.
              Los valores se pueden configurar como porcentaje del monto total o como una tasa fija.
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={comisiones}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} comisiones`
          }}
        />
      </Card>

      {/* Modal para crear/editar comisi³n */}
      <Modal
        title={editingComision ? 'Editar Comisi³n' : 'Nueva Comisi³n'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingComision(null);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveComision}
        >
          <Form.Item
            name="name"
            label="Nombre del M©todo"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input placeholder="Ej: Stripe, PayPal, Transferencia" />
          </Form.Item>

          <Form.Item
            name="tipo"
            label="Tipo de Comisi³n"
            rules={[{ required: true, message: 'El tipo es requerido' }]}
          >
            <Input.Group compact>
              <Form.Item name="tipo" noStyle>
                <Input
                  style={{ width: '100%' }}
                  placeholder="Selecciona el tipo"
                  readOnly
                  value={form.getFieldValue('tipo') === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
                />
              </Form.Item>
              <Button
                onClick={() => {
                  const currentTipo = form.getFieldValue('tipo');
                  form.setFieldsValue({
                    tipo: currentTipo === 'porcentaje' ? 'fijo' : 'porcentaje',
                    valor: 0
                  });
                }}
              >
                {form.getFieldValue('tipo') === 'porcentaje' ? 'Cambiar a Fijo' : 'Cambiar a Porcentaje'}
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="valor"
            label={form.getFieldValue('tipo') === 'porcentaje' ? 'Porcentaje (%)' : 'Valor Fijo ($)'}
            rules={[{ required: true, message: 'El valor es requerido' }]}
          >
            <InputNumber
              min={0}
              max={form.getFieldValue('tipo') === 'porcentaje' ? 100 : undefined}
              style={{ width: '100%' }}
              placeholder={form.getFieldValue('tipo') === 'porcentaje' ? '2.9' : '0.30'}
              addonAfter={form.getFieldValue('tipo') === 'porcentaje' ? '%' : '$'}
            />
          </Form.Item>

          <Form.Item
            name="fijo"
            label="Tasa Fija Adicional ($)"
            rules={[{ required: true, message: 'La tasa fija es requerida' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="0.30"
              addonAfter="$"
            />
          </Form.Item>

          <Form.Item
            name="activo"
            label="Estado"
            valuePropName="checked"
            initialValue={true}
          >
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Comisi³n activa</span>
            </div>
          </Form.Item>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              {editingComision ? 'Actualizar' : 'Crear'} Comisi³n
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ComisionesTasas;


