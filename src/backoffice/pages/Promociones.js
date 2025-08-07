import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Tag, 
  Space, 
  message, 
  Typography,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  GiftOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Promociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPromociones();
  }, []);

  const loadPromociones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promociones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromociones(data || []);
    } catch (error) {
      console.error('Error loading promociones:', error);
      message.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromocion = async (values) => {
    try {
      const promocionData = {
        ...values,
        fecha_inicio: values.fecha_inicio?.toISOString(),
        fecha_fin: values.fecha_fin?.toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('promociones')
        .insert([promocionData])
        .select()
        .single();

      if (error) throw error;

      message.success('Promoción creada correctamente');
      setModalVisible(false);
      form.resetFields();
      loadPromociones();
    } catch (error) {
      console.error('Error creating promocion:', error);
      message.error('Error al crear promoción');
    }
  };

  const handleUpdatePromocion = async (values) => {
    try {
      const promocionData = {
        ...values,
        fecha_inicio: values.fecha_inicio?.toISOString(),
        fecha_fin: values.fecha_fin?.toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('promociones')
        .update(promocionData)
        .eq('id', editingPromocion.id);

      if (error) throw error;

      message.success('Promoción actualizada correctamente');
      setModalVisible(false);
      setEditingPromocion(null);
      form.resetFields();
      loadPromociones();
    } catch (error) {
      console.error('Error updating promocion:', error);
      message.error('Error al actualizar promoción');
    }
  };

  const handleDeletePromocion = async (id) => {
    try {
      const { error } = await supabase
        .from('promociones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Promoción eliminada correctamente');
      loadPromociones();
    } catch (error) {
      console.error('Error deleting promocion:', error);
      message.error('Error al eliminar promoción');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Código copiado al portapapeles');
  };

  const getStatusTag = (promocion) => {
    const now = new Date();
    const startDate = new Date(promocion.fecha_inicio);
    const endDate = new Date(promocion.fecha_fin);

    if (!promocion.activo) return <Tag color="red">Inactiva</Tag>;
    if (now < startDate) return <Tag color="orange">Pendiente</Tag>;
    if (now > endDate) return <Tag color="gray">Expirada</Tag>;
    return <Tag color="green">Activa</Tag>;
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (codigo) => (
        <Space>
          <Text code>{codigo}</Text>
          <Tooltip title="Copiar código">
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(codigo)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'porcentaje' ? 'blue' : 'purple'}>
          {tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
        </Tag>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      render: (valor, record) => (
        <Text strong>
          {record.tipo === 'porcentaje' ? `${valor}%` : `$${valor}`}
        </Text>
      ),
    },
    {
      title: 'Uso Máximo',
      dataIndex: 'uso_maximo',
      key: 'uso_maximo',
      render: (uso) => uso || 'Ilimitado',
    },
    {
      title: 'Usos Actuales',
      dataIndex: 'usos_actuales',
      key: 'usos_actuales',
      render: (usos) => usos || 0,
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'Válido',
      key: 'validez',
      render: (_, record) => (
        <div className="text-xs">
          <div>Desde: {new Date(record.fecha_inicio).toLocaleDateString()}</div>
          <div>Hasta: {new Date(record.fecha_fin).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => {
                setEditingPromocion(record);
                form.setFieldsValue({
                  ...record,
                  fecha_inicio: record.fecha_inicio ? new Date(record.fecha_inicio) : null,
                  fecha_fin: record.fecha_fin ? new Date(record.fecha_fin) : null,
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="¿Estás seguro de eliminar esta promoción?"
            onConfirm={() => handleDeletePromocion(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button 
                type="text" 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <GiftOutlined className="mr-2" />
          Gestión de Promociones
        </Title>
        <Text type="secondary">
          Crea y gestiona códigos de descuento y promociones para tus eventos
        </Text>
      </div>

      <Card>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <Text strong>Total de Promociones: {promociones.length}</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPromocion(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Nueva Promoción
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={promociones}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingPromocion ? 'Editar Promoción' : 'Nueva Promoción'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPromocion(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingPromocion ? handleUpdatePromocion : handleCreatePromocion}
        >
          <Form.Item
            name="codigo"
            label="Código de Promoción"
            rules={[{ required: true, message: 'Ingresa el código de promoción' }]}
          >
            <Input placeholder="Ej: DESCUENTO20" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: 'Ingresa una descripción' }]}
          >
            <TextArea rows={3} placeholder="Describe la promoción..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="tipo"
              label="Tipo de Descuento"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select placeholder="Selecciona tipo">
                <Option value="porcentaje">Porcentaje (%)</Option>
                <Option value="monto_fijo">Monto Fijo ($)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="valor"
              label="Valor del Descuento"
              rules={[{ required: true, message: 'Ingresa el valor' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="10"
                min={0}
                max={100}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="uso_maximo"
              label="Uso Máximo"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Ilimitado"
                min={1}
              />
            </Form.Item>

            <Form.Item
              name="monto_minimo"
              label="Monto Mínimo"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Sin mínimo"
                min={0}
                prefix="$"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="fecha_inicio"
              label="Fecha de Inicio"
              rules={[{ required: true, message: 'Selecciona fecha de inicio' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="fecha_fin"
              label="Fecha de Fin"
              rules={[{ required: true, message: 'Selecciona fecha de fin' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="eventos_aplicables"
            label="Eventos Aplicables"
          >
            <Select
              mode="multiple"
              placeholder="Todos los eventos"
              allowClear
            >
              {/* Aquí se cargarían los eventos disponibles */}
              <Option value="todos">Todos los eventos</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="activo"
            label="Estado"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Activa" unCheckedChildren="Inactiva" />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPromocion ? 'Actualizar' : 'Crear'} Promoción
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Promociones; 