import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Space,
  Typography,
  Select,
  Switch,
  Image,
  Tag,
  Row,
  Col
} from '../../utils/antdComponents';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PlantillasProductos = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPlantillas();
    loadRecintos();
  }, []);

  

      if (error) {

        return;
      }

      setRecintos(data || []);
    } catch (error) {
      console.error('Error loading recintos:', error);
    }
  };

  const loadSalas = async (recintoId) => {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('recinto_id', recintoId)
        .order('nombre');

      if (error) {
        setSalas([]);
        return;
      }

      setSalas(data || []);
    } catch (error) {
      console.error('Error loading salas:', error);
    }
  };

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plantillas_productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setPlantillas([]);
        return;
      }

      setPlantillas(data || []);
    } catch (error) {
      console.error('Error loading plantillas:', error);
      message.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (editingPlantilla) {
        const { error } = await supabase
          .from('plantillas_productos')
          .update(values)
          .eq('id', editingPlantilla.id);

        if (error) throw error;
        message.success('Plantilla actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('plantillas_productos')
          .insert([values]);

        if (error) throw error;
        message.success('Plantilla creada correctamente');
      }

      setModalVisible(false);
      setEditingPlantilla(null);
      form.resetFields();
      loadPlantillas();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      message.error('Error al guardar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plantilla) => {
    setEditingPlantilla(plantilla);
    form.setFieldsValue({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      precio_base: plantilla.precio_base,
      categoria: plantilla.categoria,
      activo: plantilla.activo
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('plantillas_productos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Plantilla eliminada correctamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error deleting plantilla:', error);
      message.error('Error al eliminar plantilla');
    }
  };

  const handleDuplicate = async (plantilla) => {
    try {
      const { error } = await supabase
        .from('plantillas_productos')
        .insert([{
          nombre: `${plantilla.nombre} (copia)`,
          descripcion: plantilla.descripcion,
          precio_base: plantilla.precio_base,
          categoria: plantilla.categoria,
          activo: false
        }]);

      if (error) throw error;
      message.success('Plantilla duplicada correctamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error duplicating plantilla:', error);
      message.error('Error al duplicar plantilla');
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `plantillas-productos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      form.setFieldsValue({ imagen_url: publicUrl });
      message.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Imagen',
      dataIndex: 'imagen_url',
      key: 'imagen',
      render: (url) => (
        <Image
          width={50}
          height={50}
          src={url}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      )
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Descripci³n',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text) => text?.slice(0, 50) + (text?.length > 50 ? '...' : '')
    },
    {
      title: 'Precio Base',
      dataIndex: 'precio_base',
      key: 'precio_base',
      render: (precio) => `$${parseFloat(precio).toFixed(2)}`
    },
    // Nota: si la tabla no tiene recinto_id, ocultamos esta columna
    {
      title: 'Sala',
      dataIndex: 'sala_id',
      key: 'sala',
      render: (salaId) => {
        const sala = salas.find(s => s.id === salaId);
        return sala ? (
          <div className="flex items-center">
            <EnvironmentOutlined className="mr-1" />
            {sala.nombre}
          </div>
        ) : 'N/A';
      }
    },
    {
      title: 'Categor­a',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => <Tag color="blue">{categoria}</Tag>
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      render: (activo) => (
        <Tag color={activo ? 'green' : 'red'}>
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
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record)}
          >
            Duplicar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Plantillas de Productos</Title>

      <Card
        title="Plantillas"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPlantilla(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Nueva Plantilla
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={plantillas}
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
        title={`${editingPlantilla ? 'Editar' : 'Crear'} Plantilla de Producto`}
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
        >
          <Form.Item
            name="nombre"
            label="Nombre de la Plantilla"
            rules={[{ required: true, message: 'Por favor ingresa el nombre de la plantilla' }]}
          >
            <Input placeholder="Ejemplo: Camiseta Est¡ndar" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripci³n"
          >
            <TextArea
              rows={4}
              placeholder="Descripci³n de la plantilla"
            />
          </Form.Item>

          <Form.Item
            name="precio_base"
            label="Precio Base"
            rules={[{ required: true, message: 'Por favor ingresa el precio base' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="recinto_id"
                label="Recinto"
                rules={[{ required: true, message: 'Por favor selecciona un recinto' }]}
              >
                <Select
                  placeholder="Selecciona un recinto"
                  onChange={(value) => {
                    loadSalas(value);
                    form.setFieldsValue({ sala_id: undefined });
                  }}
                >
                  {recintos.map(recinto => (
                    <Option key={recinto.id} value={recinto.id}>
                      {recinto.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sala_id"
                label="Sala"
                rules={[{ required: true, message: 'Por favor selecciona una sala' }]}
              >
                <Select placeholder="Selecciona una sala">
                  {salas.map(sala => (
                    <Option key={sala.id} value={sala.id}>
                      {sala.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="categoria"
            label="Categor­a"
            rules={[{ required: true, message: 'Por favor selecciona una categor­a' }]}
          >
            <Select placeholder="Selecciona una categor­a">
              <Option value="Merchandising">Merchandising</Option>
              <Option value="Informaci³n">Informaci³n</Option>
              <Option value="Pack">Pack</Option>
              <Option value="Alimentos">Alimentos</Option>
              <Option value="Bebidas">Bebidas</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="imagen_url"
            label="Imagen de la Plantilla"
          >
            <Upload
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false;
              }}
              showUploadList={false}
              accept="image/*"
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                disabled={uploading}
              >
                Subir Imagen
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="activo"
            label="Activa"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPlantilla ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingPlantilla(null);
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

export default PlantillasProductos;

