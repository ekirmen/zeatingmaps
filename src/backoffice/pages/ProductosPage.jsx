import React, { useState, useEffect } from 'react';
import { Button, Space, Tag, Modal, message, Image, Avatar, Typography } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TagOutlined
} from '@ant-design/icons';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import { supabase } from '../../supabaseClient';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useTenantFilter } from '../../hooks/useTenantFilter';

const { Text } = Typography;

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const { addTenantFilter } = useTenantFilter();

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await addTenantFilter(
        supabase
          .from('productos')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
      message.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      message.success('Producto eliminado correctamente');
      setDeleteModalVisible(false);
      setProductToDelete(null);
      loadProductos();
    } catch (error) {
      console.error('Error deleting producto:', error);
      message.error('Error al eliminar el producto');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'bebidas': return 'blue';
      case 'comida': return 'green';
      case 'merchandising': return 'purple';
      case 'entradas': return 'orange';
      default: return 'default';
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'red';
    if (stock <= 10) return 'orange';
    return 'green';
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Sin stock';
    if (stock <= 10) return 'Stock bajo';
    return 'Disponible';
  };

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.imagen ? resolveImageUrl(record.imagen) : null}
            icon={<ShoppingOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.descripcion}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => `$${precio}`,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => (
        <Tag color={getCategoryColor(categoria)}>
          {categoria}
        </Tag>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Tag color={getStockColor(stock)}>
          {getStockText(stock)} ({stock})
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedProduct(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
          >
            Editar
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Gestión de Productos"
      subtitle="Administra todos los productos del sistema"
    >
      <DataTable
        title="Productos"
        dataSource={productos}
        columns={columns}
        loading={loading}
        onRefresh={loadProductos}
        showSearch={true}
        searchPlaceholder="Buscar productos..."
        addButtonText="Crear Producto"
        onAdd={() => console.log('Crear producto')}
      />

      {/* Modal para ver detalles del producto */}
      <Modal
        title="Detalles del Producto"
        visible={!!selectedProduct}
        onCancel={() => setSelectedProduct(null)}
        footer={null}
        width={600}
      >
        {selectedProduct && (
          <div>
            {selectedProduct.imagen && (
              <div style={{ marginBottom: '16px' }}>
                <Image
                  src={resolveImageUrl(selectedProduct.imagen)}
                  alt={selectedProduct.nombre}
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <strong>Nombre:</strong> {selectedProduct.nombre}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Descripción:</strong> {selectedProduct.descripcion}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Precio:</strong> ${selectedProduct.precio}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Categoría:</strong> 
              <Tag color={getCategoryColor(selectedProduct.categoria)} style={{ marginLeft: '8px' }}>
                {selectedProduct.categoria}
              </Tag>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Stock:</strong> 
              <Tag color={getStockColor(selectedProduct.stock)} style={{ marginLeft: '8px' }}>
                {getStockText(selectedProduct.stock)} ({selectedProduct.stock})
              </Tag>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        title="Confirmar Eliminación"
        visible={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProductToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que quieres eliminar el producto "{productToDelete?.nombre}"?</p>
        <p>Esta acción no se puede deshacer.</p>
      </Modal>
    </DashboardLayout>
  );
};

export default ProductosPage;
