import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Typography,
  Select,
  Switch,
  Tag,
  Row,
  Col,
  Popconfirm,
  ColorPicker
} from '../../utils/antdComponents';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { fetchCanalesVenta } from '../../services/canalVentaService';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Title, Text } = Typography;
const { Option } = Select;

const Cupos = () => {
  const { addTenantFilter, getTenantId } = useTenantFilter();
  const [cupos, setCupos] = useState([]);
  const [canalesVenta, setCanalesVenta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCupo, setEditingCupo] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCupos();
    loadCanalesVenta();
  }, []);

  const loadCupos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('cupos')
        .select('*')
        .order('nombre', { ascending: true });

      query = addTenantFilter(query);

      const { data, error } = await query;

      if (error) throw error;

      // Procesar cupos para mostrar canales
      const processedCupos = (data || []).map(cupo => ({
        ...cupo,
        canales_array: Array.isArray(cupo.canales_venta) 
          ? cupo.canales_venta 
          : (typeof cupo.canales_venta === 'string' ? JSON.parse(cupo.canales_venta || '[]') : [])
      }));

      setCupos(processedCupos);
    } catch (error) {
      console.error('Error loading cupos:', error);
      message.error('Error al cargar cupos');
    } finally {
      setLoading(false);
    }
  };

  const loadCanalesVenta = async () => {
    try {
      const canales = await fetchCanalesVenta();
      setCanalesVenta(canales || []);
    } catch (error) {
      console.error('Error loading canales venta:', error);
    }
  };

  const handleSave = async (values) => {
    try {
      const cupoData = {
        nombre: values.nombre,
        color: values.color || '#4ECDC4',
        descripcion: values.descripcion || null,
        canales_venta: values.canales_venta || [],
        activo: values.activo !== undefined ? values.activo : true,
        tenant_id: getTenantId() || null
      };

      if (editingCupo) {
        const { error } = await supabase
          .from('cupos')
          .update(cupoData)
          .eq('id', editingCupo.id);

        if (error) throw error;
        message.success('Cupo actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('cupos')
          .insert([cupoData]);

        if (error) throw error;
        message.success('Cupo creado exitosamente');
      }

      setModalVisible(false);
      setEditingCupo(null);
      form.resetFields();
      loadCupos();
    } catch (error) {
      console.error('Error saving cupo:', error);
      message.error('Error al guardar cupo');
    }
  };

  const handleEdit = (cupo) => {
    setEditingCupo(cupo);
    form.setFieldsValue({
      nombre: cupo.nombre,
      color: cupo.color || '#4ECDC4',
      descripcion: cupo.descripcion || '',
      canales_venta: Array.isArray(cupo.canales_venta) 
        ? cupo.canales_venta 
        : (typeof cupo.canales_venta === 'string' ? JSON.parse(cupo.canales_venta || '[]') : []),
      activo: cupo.activo !== false
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('cupos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Cupo eliminado exitosamente');
      loadCupos();
    } catch (error) {
      console.error('Error deleting cupo:', error);
      message.error('Error al eliminar cupo. Asegºrate de que no est© en uso en ninguna plantilla.');
    }
  };

  const getCanalNombre = (canalId) => {
    const canal = canalesVenta.find(c => c.id === canalId);
    return canal ? canal.nombre : `Canal ${canalId}`;
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <Space>
          <div 
            style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: record.color || '#4ECDC4',
              borderRadius: 4,
              display: 'inline-block'
            }} 
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Canales de Venta',
      dataIndex: 'canales_array',
      key: 'canales_venta',
      render: (canales) => (
        <Space wrap>
          {canales && canales.length > 0 ? (
            canales.map(canalId => (
              <Tag key={canalId} color="blue">
                {getCanalNombre(canalId)}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Sin canales asignados</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'} icon={activo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Descripci³n',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text) => text || <Text type="secondary">-”</Text>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Est¡s seguro de eliminar este cupo?"
            description="Esta acci³n no se puede deshacer. Asegºrate de que no est© en uso en ninguna plantilla."
            onConfirm={() => handleDelete(record.id)}
            okText="S­, eliminar"
            cancelText="Cancelar"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">Gesti³n de Cupos</Title>
              <Text type="secondary">
                Crea y administra cupos reutilizables para asignar a plantillas de cupos.
                Los cupos definen qu© canales de venta pueden vender un conjunto de butacas.
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setEditingCupo(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Crear Cupo
            </Button>
          </div>
        </Card>

        {/* Tabla de Cupos */}
        <Card>
          <Table
            columns={columns}
            dataSource={cupos}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} cupo${total !== 1 ? 's' : ''}`
            }}
          />
        </Card>

        {/* Modal de Crear/Editar Cupo */}
        <Modal
          title={editingCupo ? 'Editar Cupo' : 'Crear Nuevo Cupo'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingCupo(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText={editingCupo ? 'Actualizar' : 'Crear'}
          cancelText="Cancelar"
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              activo: true,
              color: '#4ECDC4'
            }}
          >
            <Form.Item
              label="Nombre del Cupo"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es obligatorio' }]}
            >
              <Input placeholder="Ej: Cupo Internet, Cupo Taquilla, Cupo Distribuidores" />
            </Form.Item>

            <Form.Item
              label="Color Identificador"
              name="color"
              rules={[{ required: true, message: 'El color es obligatorio' }]}
            >
              <Input 
                type="color" 
                style={{ width: 100, height: 40 }}
                placeholder="#4ECDC4"
              />
            </Form.Item>

            <Form.Item
              label="Descripci³n"
              name="descripcion"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Descripci³n opcional del cupo..."
              />
            </Form.Item>

            <Form.Item
              label="Canales de Venta"
              name="canales_venta"
              rules={[{ required: true, message: 'Debes seleccionar al menos un canal' }]}
              tooltip="Selecciona los canales de venta que podr¡n vender entradas de este cupo"
            >
              <Select
                mode="multiple"
                placeholder="Selecciona uno o m¡s canales de venta"
                allowClear
              >
                {canalesVenta.map(canal => (
                  <Option key={canal.id} value={canal.id}>
                    {canal.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Estado"
              name="activo"
              valuePropName="checked"
            >
              <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Cupos;



