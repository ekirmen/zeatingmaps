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
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error loading productos:', error);
        setProductos([]);
        return;
      }

      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
      message.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (editingProducto) {
        const { error } = await supabase
          .from('productos')
          .update(values)
          .eq('id', editingProducto.id);
        
        if (error) throw error;
        message.success('Producto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([values]);
        
        if (error) throw error;
        message.success('Producto creado correctamente');
      }

      setModalVisible(false);
      setEditingProducto(null);
      form.resetFields();
      loadProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      message.error('Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    form.setFieldsValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      stock_disponible: producto.stock_disponible,
      activo: producto.activo,
      tags: producto.tags || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      message.success('Producto eliminado correctamente');
      loadProductos();
    } catch (error) {
      console.error('Error deleting producto:', error);
      message.error('Error al eliminar producto');
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `productos/${fileName}`;

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
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text) => text?.slice(0, 50) + (text?.length > 50 ? '...' : '')
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => `$${parseFloat(precio).toFixed(2)}`
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => <Tag color="blue">{categoria}</Tag>
    },
    {
      title: 'Stock',
      dataIndex: 'stock_disponible',
      key: 'stock_disponible',
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
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
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
      <Title level={2}>Gestión de Productos</Title>
      
      <Card 
        title="Productos" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProducto(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Nuevo Producto
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={productos}
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
        title={`${editingProducto ? 'Editar' : 'Crear'} Producto`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProducto(null);
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
            label="Nombre del Producto"
            rules={[{ required: true, message: 'Por favor ingresa el nombre del producto' }]}
          >
            <Input placeholder="Ejemplo: Camiseta del Evento" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
          >
            <TextArea 
              rows={4} 
              placeholder="Descripción detallada del producto"
            />
          </Form.Item>

          <Form.Item
            name="precio"
            label="Precio"
            rules={[{ required: true, message: 'Por favor ingresa el precio' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="categoria"
            label="Categoría"
            rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}
          >
            <Select placeholder="Selecciona una categoría">
              <Option value="Merchandising">Merchandising</Option>
              <Option value="Información">Información</Option>
              <Option value="Pack">Pack</Option>
              <Option value="Alimentos">Alimentos</Option>
              <Option value="Bebidas">Bebidas</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="stock_disponible"
            label="Stock Disponible"
            rules={[{ required: true, message: 'Por favor ingresa el stock disponible' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="imagen_url"
            label="Imagen del Producto"
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
            label="Activo"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProducto ? 'Actualizar' : 'Crear'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingProducto(null);
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

export default Productos; 