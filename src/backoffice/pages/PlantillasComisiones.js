import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  message, 
  Space, 
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  DollarOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PlantillasComisiones = () => {
  const { currentTenant } = useTenant();
  const [plantillas, setPlantillas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlantillas();
  }, [currentTenant]);

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('plantillas_comisiones')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPlantillas(data || []);
    } catch (error) {
      console.error('Error loading plantillas:', error);
      message.error('Error al cargar las plantillas de comisiones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const plantillaData = {
        ...values,
        tenant_id: currentTenant?.id,
        activo: values.activo !== undefined ? values.activo : true
      };

      if (editingPlantilla) {
        const { error } = await supabase
          .from('plantillas_comisiones')
          .update(plantillaData)
          .eq('id', editingPlantilla.id);
        
        if (error) throw error;
        message.success('Plantilla actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('plantillas_comisiones')
          .insert([plantillaData]);
        
        if (error) throw error;
        message.success('Plantilla creada exitosamente');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingPlantilla(null);
      loadPlantillas();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      message.error('Error al guardar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plantilla) => {
    setEditingPlantilla(plantilla);
    form.setFieldsValue({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      tipo_comision: plantilla.tipo_comision,
      valor_comision: plantilla.valor_comision,
      aplica_desde: plantilla.aplica_desde,
      aplica_hasta: plantilla.aplica_hasta,
      activo: plantilla.activo,
      condiciones: plantilla.condiciones
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('plantillas_comisiones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      message.success('Plantilla eliminada exitosamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error deleting plantilla:', error);
      message.error('Error al eliminar la plantilla');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.descripcion && (
            <div className="text-sm text-gray-500">{record.descripcion}</div>
          )}
        </div>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_comision',
      key: 'tipo_comision',
      render: (tipo) => (
        <Tag color={tipo === 'porcentaje' ? 'blue' : 'green'}>
          {tipo === 'porcentaje' ? 'Porcentaje' : 'Fijo'}
        </Tag>
      )
    },
    {
      title: 'Valor',
      dataIndex: 'valor_comision',
      key: 'valor_comision',
      render: (valor, record) => (
        <span className="font-mono">
          {record.tipo_comision === 'porcentaje' ? `${valor}%` : `$${valor}`}
        </span>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'success' : 'default'}>
          {activo ? 'Activa' : 'Inactiva'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          />
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="mb-2">
              <DollarOutlined className="mr-2" />
              Plantillas de Comisiones
            </Title>
            <Text type="secondary">
              Gestiona las plantillas de comisiones para diferentes tipos de ventas
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPlantilla(null);
              form.resetFields();
              setModalVisible(true);
            }}
            size="large"
          >
            Nueva Plantilla
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={plantillas}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} plantillas`
          }}
        />
      </Card>

      <Modal
        title={editingPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla de Comisiones'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPlantilla(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            tipo_comision: 'porcentaje',
            activo: true,
            valor_comision: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre de la Plantilla"
                rules={[{ required: true, message: 'El nombre es obligatorio' }]}
              >
                <Input placeholder="Ej: Comisión Estándar" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tipo_comision"
                label="Tipo de Comisión"
                rules={[{ required: true, message: 'Selecciona el tipo' }]}
              >
                <Select>
                  <Option value="porcentaje">Porcentaje (%)</Option>
                  <Option value="fijo">Valor Fijo ($)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <TextArea rows={3} placeholder="Describe el propósito de esta plantilla..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="valor_comision"
                label="Valor de la Comisión"
                rules={[{ required: true, message: 'El valor es obligatorio' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  formatter={(value) => 
                    form.getFieldValue('tipo_comision') === 'porcentaje' 
                      ? `${value}%` 
                      : `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => value.replace(/[%\$\s,]/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="activo"
                label="Estado"
                valuePropName="checked"
              >
                <Switch checkedChildren="Activa" unCheckedChildren="Inactiva" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Condiciones de Aplicación</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="aplica_desde"
                label="Aplicar Desde"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="aplica_hasta"
                label="Aplicar Hasta"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Sin límite"
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="condiciones"
            label="Condiciones Especiales"
          >
            <TextArea 
              rows={3} 
              placeholder="Condiciones adicionales para aplicar esta comisión..."
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => {
              setModalVisible(false);
              setEditingPlantilla(null);
              form.resetFields();
            }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingPlantilla ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PlantillasComisiones;
