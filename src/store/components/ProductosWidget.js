import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Image, Typography, Space, InputNumber, message, Input, Select, Tag, Badge, Tooltip, Alert } from 'antd';
import { 
  ShoppingCartOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  FireOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useCartStore } from '../cartStore';

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

  const { addProduct, products: cartProducts } = useCartStore();

  useEffect(() => {
    if (eventoId) {
      loadProductos();
    } else {
      setProductos([]);
      setFilteredProductos([]);
      setQuantities({});
    }
  }, [eventoId, loadProductos]);

  useEffect(() => {
    filterProductos();
  }, [productos, searchTerm, categoryFilter, priceFilter, stockFilter, filterProductos]);

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar productos asociados al evento
      const { data: productosEvento, error: errorEvento } = await supabase
        .from('productos_eventos')
        .select(`
          *,
          productos (*)
        `)
        .eq('evento_id', eventoId)
        .eq('activo', true);

      if (errorEvento) {
        console.warn('Error loading productos evento:', errorEvento);
        return;
      }

      // También cargar productos generales activos
      const { data: productosGenerales, error: errorGenerales } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true);

      if (errorGenerales) {
        console.warn('Error loading productos generales:', errorGenerales);
        return;
      }

      // Combinar productos del evento y generales
      const productosEventoData = productosEvento?.map(pe => ({
        ...pe.productos,
        precio_especial: pe.precio_especial,
        stock_disponible: pe.stock_disponible,
        es_evento: true
      })) || [];

      const productosGeneralesData = productosGenerales?.map(p => ({
        ...p,
        es_evento: false
      })) || [];

      const productosCombinados = [...productosEventoData, ...productosGeneralesData];
      
      // Eliminar duplicados y establecer cantidades iniciales
      const productosUnicos = productosCombinados.filter((producto, index, self) => 
        index === self.findIndex(p => p.id === producto.id)
      );

      setProductos(productosUnicos);
      
      // Extraer categorías únicas
      const categoriasUnicas = [...new Set(productosUnicos.map(p => p.categoria).filter(Boolean))];
      setCategories(categoriasUnicas);
      
      // Inicializar cantidades
      const initialQuantities = {};
      productosUnicos.forEach(producto => {
        initialQuantities[producto.id] = 0;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error loading productos:', error);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  const filterProductos = useCallback(() => {
    let filtered = [...productos];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(producto => producto.categoria === categoryFilter);
    }

    // Filtro por precio
    if (priceFilter !== 'all') {
      filtered = filtered.filter(producto => {
        const precio = getPrecio(producto);
        switch (priceFilter) {
          case 'low':
            return precio <= 10;
          case 'medium':
            return precio > 10 && precio <= 50;
          case 'high':
            return precio > 50;
          default:
            return true;
        }
      });
    }

    // Filtro por stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(producto => {
        const stock = getStockDisponible(producto);
        switch (stockFilter) {
          case 'available':
            return stock > 5;
          case 'low':
            return stock > 0 && stock <= 5;
          case 'out':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    setFilteredProductos(filtered);
  }, [productos, searchTerm, categoryFilter, priceFilter, stockFilter]);

  const handleQuantityChange = (productoId, value) => {
    setQuantities(prev => ({
      ...prev,
      [productoId]: Math.max(0, value)
    }));
  };

  const handleAddToCart = (producto) => {
    const cantidad = quantities[producto.id];
    if (cantidad > 0) {
      const precio = producto.precio_especial || producto.precio;
      const productoParaAgregar = {
        ...producto,
        cantidad,
        precio_total: precio * cantidad,
        tipo: 'producto'
      };
      
      addProduct(productoParaAgregar);
      
      // Resetear cantidad
      setQuantities(prev => ({
        ...prev,
        [producto.id]: 0
      }));
    }
  };

  const getPrecio = (producto) => {
    return producto.precio_especial || producto.precio;
  };

  const getStockDisponible = (producto) => {
    return producto.stock_disponible || 0;
  };

  const getStockStatus = (producto) => {
    const stock = getStockDisponible(producto);
    if (stock === 0) return { status: 'error', text: 'Sin stock', color: 'red' };
    if (stock <= 5) return { status: 'warning', text: 'Stock bajo', color: 'orange' };
    return { status: 'success', text: 'Disponible', color: 'green' };
  };

  const getCartQuantity = (productId) => {
    const cartProduct = cartProducts.find(p => p.id === productId);
    return cartProduct ? cartProduct.cantidad : 0;
  };

  const isProductInCart = (productId) => {
    return cartProducts.some(p => p.id === productId);
  };

  if (loading) {
    return (
      <Card title="Productos Disponibles" loading={true}>
        <div>Cargando productos...</div>
      </Card>
    );
  }

  if (!eventoId) {
    return (
      <Card title="Productos Disponibles">
        <div className="text-center py-4">
          <Text type="secondary">Selecciona un evento para ver los productos disponibles</Text>
        </div>
      </Card>
    );
  }

  if (productos.length === 0) {
    return (
      <Card title="Productos Disponibles">
        <div className="text-center py-4">
          <Text type="secondary">No hay productos disponibles para este evento</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>Productos Disponibles</span>
          <Button 
            type="text" 
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            Filtros
          </Button>
        </div>
      } 
      className="mb-4"
    >
      {/* Filtros y búsqueda */}
      <div className="mb-4 space-y-3">
        <Search
          placeholder="Buscar productos por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Categoría"
              allowClear
            >
              <Option value="all">Todas las categorías</Option>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
            
            <Select
              value={priceFilter}
              onChange={setPriceFilter}
              placeholder="Rango de precio"
              allowClear
            >
              <Option value="all">Todos los precios</Option>
              <Option value="low">$0 - $10</Option>
              <Option value="medium">$10 - $50</Option>
              <Option value="high">$50+</Option>
            </Select>

            <Select
              value={stockFilter}
              onChange={setStockFilter}
              placeholder="Estado de stock"
              allowClear
            >
              <Option value="all">Todos</Option>
              <Option value="available">Disponible</Option>
              <Option value="low">Stock bajo</Option>
              <Option value="out">Sin stock</Option>
            </Select>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="mb-4">
        <Text type="secondary">
          Mostrando {filteredProductos.length} de {productos.length} productos
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProductos.map(producto => {
          const stockDisponible = getStockDisponible(producto);
          const precio = getPrecio(producto);
          const cantidad = quantities[producto.id] || 0;
          const stockStatus = getStockStatus(producto);
          const cartQuantity = getCartQuantity(producto.id);
          const inCart = isProductInCart(producto.id);
          
          return (
            <Card 
              key={producto.id} 
              size="small"
              hoverable
              className={`h-full transition-all duration-200 ${inCart ? 'ring-2 ring-blue-500' : ''}`}
              cover={
                producto.imagen_url ? (
                  <Image
                    alt={producto.nombre}
                    src={producto.imagen_url}
                    height={150}
                    style={{ objectFit: 'cover' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN" />
                ) : (
                  <div 
                    className="bg-gray-200 flex items-center justify-center"
                    style={{ height: 150 }}
                  >
                    <Text type="secondary">Sin imagen</Text>
                  </div>
                )
              }
              actions={[
                <Badge count={producto.es_evento ? 'Evento' : 'General'} size="small">
                  <Tag color={producto.es_evento ? 'blue' : 'green'}>
                    {producto.es_evento ? 'Evento' : 'General'}
                  </Tag>
                </Badge>
              ]}
            >
              <div className="p-2">
                <div className="flex items-start justify-between mb-2">
                  <Title level={5} className="mb-0 flex-1">{producto.nombre}</Title>
                  {inCart && (
                    <Tooltip title="En el carrito">
                      <Badge count={cartQuantity} size="small">
                        <ShoppingCartOutlined className="text-blue-500" />
                      </Badge>
                    </Tooltip>
                  )}
                </div>
                
                {producto.descripcion && (
                  <Text type="secondary" className="block mb-2 text-xs">
                    {producto.descripcion.slice(0, 80)}...
                  </Text>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <Text strong className="text-lg text-green-600">
                    ${parseFloat(precio).toFixed(2)}
                  </Text>
                  <Tag color={stockStatus.color}>
                    {stockStatus.text} ({stockDisponible})
                  </Tag>
                </div>

                {stockDisponible <= 5 && stockDisponible > 0 && (
                  <Alert
                    message="¡Stock limitado!"
                    type="warning"
                    showIcon
                    className="mb-2"
                    icon={<FireOutlined />}
                  />
                )}
                
                <div className="flex items-center justify-between">
                  <Space>
                    <Button
                      size="small"
                      icon={<MinusOutlined />}
                      onClick={() => handleQuantityChange(producto.id, cantidad - 1)}
                      disabled={cantidad <= 0}
                    />
                    <InputNumber
                      size="small"
                      min={0}
                      max={stockDisponible}
                      value={cantidad}
                      onChange={(value) => handleQuantityChange(producto.id, value)}
                      style={{ width: 60 }}
                    />
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(producto.id, cantidad + 1)}
                      disabled={cantidad >= stockDisponible}
                    />
                  </Space>
                  
                  <Button
                    type="primary"
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(producto)}
                    disabled={cantidad === 0 || stockDisponible === 0}
                  >
                    {inCart ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

export default ProductosWidget; 