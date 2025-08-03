import React, { useState, useEffect } from 'react';
import { Card, Button, Image, Typography, Space, InputNumber, message } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;

const ProductosWidget = ({ eventoId, onProductAdded }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (eventoId) {
      loadProductos();
    }
  }, [eventoId]);

  const loadProductos = async () => {
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
        stock_disponible: pe.stock_disponible
      })) || [];

      const productosCombinados = [...productosEventoData, ...productosGenerales];
      
      // Eliminar duplicados y establecer cantidades iniciales
      const productosUnicos = productosCombinados.filter((producto, index, self) => 
        index === self.findIndex(p => p.id === producto.id)
      );

      setProductos(productosUnicos);
      
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
  };

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
      
      onProductAdded(productoParaAgregar);
      message.success(`${cantidad} ${producto.nombre} agregado al carrito`);
      
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

  if (loading) {
    return (
      <Card title="Productos Disponibles" loading={true}>
        <div>Cargando productos...</div>
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
    <Card title="Productos Disponibles" className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map(producto => {
          const stockDisponible = getStockDisponible(producto);
          const precio = getPrecio(producto);
          const cantidad = quantities[producto.id] || 0;
          
          return (
            <Card 
              key={producto.id} 
              size="small"
              hoverable
              className="h-full"
              cover={
                producto.imagen_url ? (
                  <Image
                    alt={producto.nombre}
                    src={producto.imagen_url}
                    height={150}
                    style={{ objectFit: 'cover' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  />
                ) : (
                  <div 
                    className="bg-gray-200 flex items-center justify-center"
                    style={{ height: 150 }}
                  >
                    <Text type="secondary">Sin imagen</Text>
                  </div>
                )
              }
            >
              <div className="p-2">
                <Title level={5} className="mb-2">{producto.nombre}</Title>
                
                {producto.descripcion && (
                  <Text type="secondary" className="block mb-2">
                    {producto.descripcion.slice(0, 60)}...
                  </Text>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <Text strong className="text-lg">
                    ${parseFloat(precio).toFixed(2)}
                  </Text>
                  <Text type="secondary">
                    Stock: {stockDisponible}
                  </Text>
                </div>
                
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
                    Agregar
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