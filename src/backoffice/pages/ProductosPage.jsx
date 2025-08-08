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
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const { Text } = Typography;

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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
            <div style={{ fontWeight: '500', color: '#1e293b' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {record.descripcion?.substring(0, 50)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => (
        <div style={{ fontWeight: '600', color: '#059669' }}>
          ${precio?.toFixed(2) || '0.00'}
        </div>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => (
        <Tag color={getCategoryColor(categoria)}>
          {categoria?.charAt(0).toUpperCase() + categoria?.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Tag color={getStockColor(stock)}>
          {getStockText(stock)} ({stock || 0})
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
            size="small"
            onClick={() => setSelectedProduct(record)}
          >
            Ver
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => window.open(`/backoffice/productos/${record.id}`, '_blank')}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
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
      title="Productos"
      subtitle="Gestiona el inventario de productos"
      actions={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Crear Producto
          </Button>
        </Space>
      }
    >
      <DataTable
        title="Lista de Productos"
        dataSource={productos}
        columns={columns}
        loading={loading}
        onRefresh={loadProductos}
        onAdd={() => window.open('/backoffice/productos/nuevo', '_blank')}
        searchPlaceholder="Buscar productos..."
        addButtonText="Crear Producto"
      />

      {/* Modal de Detalles del Producto */}
      <Modal
        title="Detalles del Producto"
        open={!!selectedProduct}
        onCancel={() => setSelectedProduct(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedProduct(null)}>
            Cerrar
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              window.open(`/backoffice/productos/${selectedProduct?.id}`, '_blank');
              setSelectedProduct(null);
            }}
          >
            Editar
          </Button>,
        ]}
        width={600}
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedProduct.imagen && (
              <Image
                src={resolveImageUrl(selectedProduct.imagen)}
                alt={selectedProduct.nombre}
                style={{ borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
              />
            )}
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                {selectedProduct.nombre}
              </h3>
              <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>
                {selectedProduct.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <DollarOutlined style={{ marginRight: '4px' }} />
                  Precio
                </div>
                <div style={{ fontWeight: '600', color: '#059669', fontSize: '18px' }}>
                  ${selectedProduct.precio?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <TagOutlined style={{ marginRight: '4px' }} />
                  Categoría
                </div>
                <Tag color={getCategoryColor(selectedProduct.categoria)}>
                  {selectedProduct.categoria?.charAt(0).toUpperCase() + selectedProduct.categoria?.slice(1)}
                </Tag>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <ShoppingOutlined style={{ marginRight: '4px' }} />
                  Stock
                </div>
                <Tag color={getStockColor(selectedProduct.stock)}>
                  {getStockText(selectedProduct.stock)} ({selectedProduct.stock || 0})
                </Tag>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  Estado
                </div>
                <Tag color={selectedProduct.activo ? 'green' : 'red'}>
                  {selectedProduct.activo ? 'Activo' : 'Inactivo'}
                </Tag>
              </div>
            </div>

            {selectedProduct.sku && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  SKU
                </div>
                <div style={{ fontWeight: '500' }}>
                  {selectedProduct.sku}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Fecha de Creación
              </div>
              <div style={{ fontWeight: '500' }}>
                {selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'No disponible'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProductToDelete(null);
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>
          ¿Estás seguro de que quieres eliminar el producto "{productToDelete?.nombre}"?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default ProductosPage;
