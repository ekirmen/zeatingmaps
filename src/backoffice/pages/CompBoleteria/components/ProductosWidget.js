import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Image, Typography, Space, InputNumber, Input, Select, Tag, Badge, Tooltip, Alert } from '../../../../utils/antdComponents';
import { 
  ShoppingCartOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  FireOutlined
} from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProductosWidget = ({ eventoId, onProductAdded }) => {
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch productos from Supabase

    if (!eventoId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error fetching productos:', error);
        return;
      }

      setProductos(data || []);
      setFilteredProductos(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(p => p.categoria).filter(Boolean) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  // Filter productos based on search and filters
  useEffect(() => {
    let filtered = productos;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(producto =>
        producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(producto => producto.categoria === categoryFilter);
    }

    // Price filter
    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(producto => producto.precio >= min && producto.precio <= max);
      } else {
        filtered = filtered.filter(producto => producto.precio >= min);
      }
    }

    // Stock filter
    if (stockFilter !== 'all') {
      if (stockFilter === 'in-stock') {
        filtered = filtered.filter(producto => producto.stock > 0);
      } else if (stockFilter === 'out-of-stock') {
        filtered = filtered.filter(producto => producto.stock <= 0);
      }
    }

    setFilteredProductos(filtered);
  }, [productos, searchTerm, categoryFilter, priceFilter, stockFilter]);

  const handleQuantityChange = (productoId, value) => {
    setQuantities(prev => ({
      ...prev,
      [productoId]: Math.max(0, value || 0)
    }));
  };

  const handleAddToCart = (producto) => {
    const quantity = quantities[producto.id] || 1;
    if (quantity <= 0) return;

    // Call the callback if provided
    if (onProductAdded) {
      onProductAdded(producto, quantity);
    }

    // Reset quantity
    setQuantities(prev => ({
      ...prev,
      [producto.id]: 0
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(price);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { status: 'error', text: 'Sin stock' };
    if (stock <= 5) return { status: 'warning', text: 'Poco stock' };
    return { status: 'success', text: 'En stock' };
  };

  return (
    <div className="productos-widget">
      <div className="mb-4">
        <Title level={4}>Productos del Evento</Title>
        
        {/* Search and Filters */}
        <Space direction="vertical" className="w-full">
          <Search
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
          
          <Button
            type="link"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
          
          {showFilters && (
            <Space wrap>
              <Select
                placeholder="Categor­a"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 120 }}
              >
                <Option value="all">Todas</Option>
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
              
              <Select
                placeholder="Precio"
                value={priceFilter}
                onChange={setPriceFilter}
                style={{ width: 120 }}
              >
                <Option value="all">Todos</Option>
                <Option value="0-100">0-100 VES</Option>
                <Option value="100-500">100-500 VES</Option>
                <Option value="500-1000">500-1000 VES</Option>
                <Option value="1000">+1000 VES</Option>
              </Select>
              
              <Select
                placeholder="Stock"
                value={stockFilter}
                onChange={setStockFilter}
                style={{ width: 120 }}
              >
                <Option value="all">Todos</Option>
                <Option value="in-stock">En stock</Option>
                <Option value="out-of-stock">Sin stock</Option>
              </Select>
            </Space>
          )}
        </Space>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Text>Cargando productos...</Text>
        </div>
      ) : filteredProductos.length === 0 ? (
        <Alert
          message="No hay productos disponibles"
          description="No se encontraron productos que coincidan con los filtros aplicados."
          type="info"
          showIcon
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProductos.map(producto => {
            const stockStatus = getStockStatus(producto.stock);
            const quantity = quantities[producto.id] || 0;
            
            return (
              <Card
                key={producto.id}
                hoverable
                cover={
                  producto.imagen ? (
                    <Image
                      src={producto.imagen}
                      alt={producto.nombre}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <ShoppingCartOutlined className="text-4xl text-gray-400" />
                    </div>
                  )
                }
                actions={[
                  <Space key="quantity" direction="vertical" className="w-full">
                    <InputNumber
                      min={0}
                      max={producto.stock}
                      value={quantity}
                      onChange={(value) => handleQuantityChange(producto.id, value)}
                      placeholder="Cantidad"
                      className="w-full"
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddToCart(producto)}
                      disabled={quantity <= 0 || producto.stock <= 0}
                      className="w-full"
                    >
                      Agregar
                    </Button>
                  </Space>
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex justify-between items-start">
                      <Text strong className="text-sm">
                        {producto.nombre}
                      </Text>
                      <Badge
                        status={stockStatus.status}
                        text={stockStatus.text}
                      />
                    </div>
                  }
                  description={
                    <div>
                      <Text className="text-lg font-bold text-green-600">
                        {formatPrice(producto.precio)}
                      </Text>
                      {producto.descripcion && (
                        <Text className="block text-xs text-gray-500 mt-1">
                          {producto.descripcion}
                        </Text>
                      )}
                      {producto.categoria && (
                        <Tag color="blue" className="mt-2">
                          {producto.categoria}
                        </Tag>
                      )}
                    </div>
                  }
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductosWidget;


