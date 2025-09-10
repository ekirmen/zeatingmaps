import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Select, Space, Typography, Divider, Alert, Spin, Row, Col, Badge } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, MinusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

const GridSaleMode = ({ evento, funcion, onAddToCart, onRemoveFromCart, cartItems = [], loading = false }) => {
  const [zonas, setZonas] = useState([]);
  const [precios, setPrecios] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [selectedZona, setSelectedZona] = useState(null);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [error, setError] = useState(null);

  // Cargar zonas y precios del evento
  useEffect(() => {
    if (!evento?.id || !funcion?.id) return;
    
    loadZonasAndPrecios();
  }, [evento?.id, funcion?.id]);

  const loadZonasAndPrecios = async () => {
    try {
      setLoadingZonas(true);
      setError(null);

      // Usar endpoint de Vercel para cargar zonas y precios
      const response = await fetch('/api/grid-sale/load-zonas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ evento })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error cargando zonas');
      }

      setZonas(result.data.zonas || []);
      setPrecios(result.data.precios || {});

      // Inicializar cantidades
      const cantidadesIniciales = {};
      result.data.zonas?.forEach(zona => {
        cantidadesIniciales[zona.id] = 0;
      });
      setCantidades(cantidadesIniciales);

    } catch (err) {
      console.error('Error cargando zonas y precios:', err);
      setError('Error al cargar información de venta');
    } finally {
      setLoadingZonas(false);
    }
  };

  const handleCantidadChange = (zonaId, cantidad) => {
    setCantidades(prev => ({
      ...prev,
      [zonaId]: Math.max(0, cantidad)
    }));
  };

  const handleAddToCart = (zona) => {
    const cantidad = cantidades[zona.id] || 0;
    if (cantidad <= 0) return;

    const precio = precios[zona.id];
    if (!precio) {
      setError('No hay precio configurado para esta zona');
      return;
    }

    const item = {
      id: `grid_${zona.id}_${funcion.id}`,
      zona_id: zona.id,
      zona_nombre: zona.nombre,
      funcion_id: funcion.id,
      precio: precio.precio,
      cantidad: cantidad,
      tipo: 'grid',
      descripcion: `${zona.nombre} - ${funcion.nombre || 'Función'}`,
      fecha: funcion.fecha,
      hora: funcion.hora
    };

    onAddToCart(item);
    
    // Limpiar cantidad después de agregar
    setCantidades(prev => ({
      ...prev,
      [zona.id]: 0
    }));

    setError(null);
  };

  const handleRemoveFromCart = (zonaId) => {
    const itemId = `grid_${zonaId}_${funcion.id}`;
    onRemoveFromCart(itemId);
  };

  const getCantidadEnCarrito = (zonaId) => {
    const itemId = `grid_${zonaId}_${funcion.id}`;
    const item = cartItems.find(item => item.id === itemId);
    return item ? item.cantidad : 0;
  };

  const getTotalPrecio = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.precio * item.cantidad);
    }, 0);
  };

  const getTotalCantidad = () => {
    return cartItems.reduce((total, item) => {
      return total + item.cantidad;
    }, 0);
  };

  if (loadingZonas) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
        <Text className="ml-2">Cargando zonas y precios...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadZonasAndPrecios}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (!zonas || zonas.length === 0) {
    return (
      <Alert
        message="No hay zonas configuradas"
        description="Este evento no tiene zonas de venta configuradas. Contacta al organizador."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="grid-sale-mode">
      <div className="mb-6">
        <Title level={3} className="flex items-center gap-2">
          <ShoppingCartOutlined />
          Selecciona tus entradas
        </Title>
        <Text type="secondary">
          Elige la cantidad de entradas que deseas para cada zona
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {zonas.map(zona => {
          const precio = precios[zona.id];
          const cantidadEnCarrito = getCantidadEnCarrito(zona.id);
          const cantidadActual = cantidades[zona.id] || 0;

          return (
            <Col xs={24} sm={12} lg={8} key={zona.id}>
              <Card
                className={`zona-card ${cantidadEnCarrito > 0 ? 'zona-selected' : ''}`}
                hoverable
                actions={[
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddToCart(zona)}
                    disabled={cantidadActual <= 0 || !precio}
                    loading={loading}
                  >
                    Agregar al Carrito
                  </Button>
                ]}
              >
                <div className="zona-content">
                  <div className="zona-header mb-4">
                    <Title level={4} className="mb-1">
                      {zona.nombre}
                    </Title>
                    {zona.descripcion && (
                      <Text type="secondary" className="text-sm">
                        {zona.descripcion}
                      </Text>
                    )}
                  </div>

                  <div className="zona-precio mb-4">
                    {precio ? (
                      <div className="text-center">
                        <Text className="text-2xl font-bold text-green-600">
                          ${precio.precio ? precio.precio.toLocaleString() : '0'}
                        </Text>
                        {precio.descripcion && (
                          <div className="text-sm text-gray-500 mt-1">
                            {precio.descripcion}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert
                        message="Precio no configurado"
                        type="warning"
                        size="small"
                      />
                    )}
                  </div>

                  <div className="zona-cantidad mb-4">
                    <Space direction="vertical" className="w-full">
                      <Text strong>Cantidad:</Text>
                      <InputNumber
                        min={0}
                        max={zona.aforo || 999}
                        value={cantidadActual}
                        onChange={(value) => handleCantidadChange(zona.id, value)}
                        className="w-full"
                        size="large"
                        addonBefore={<MinusOutlined />}
                        addonAfter={<PlusOutlined />}
                      />
                      {zona.aforo && (
                        <Text type="secondary" className="text-xs">
                          Disponible: {zona.aforo} entradas
                        </Text>
                      )}
                    </Space>
                  </div>

                  {cantidadEnCarrito > 0 && (
                    <div className="zona-carrito">
                      <Badge count={cantidadEnCarrito} color="green">
                        <Button
                          type="link"
                          onClick={() => handleRemoveFromCart(zona.id)}
                          className="text-green-600"
                        >
                          En carrito: {cantidadEnCarrito}
                        </Button>
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Resumen del carrito */}
      {cartItems.length > 0 && (
        <Card className="mt-6 cart-summary">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCartOutlined />
              <Text strong>
                {getTotalCantidad()} entradas seleccionadas
              </Text>
            </div>
            <div className="text-right">
              <Text className="text-xl font-bold text-green-600">
                Total: ${(getTotalPrecio() || 0).toLocaleString()}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="mt-4 info-card">
        <div className="flex items-start gap-2">
          <InfoCircleOutlined className="text-blue-500 mt-1" />
          <div>
            <Text strong className="block mb-1">
              Información importante:
            </Text>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Las entradas son válidas solo para la fecha y hora seleccionada</li>
              <li>• Una vez confirmado el pago, no se pueden realizar cambios</li>
              <li>• Presenta tu comprobante en la entrada del evento</li>
              <li>• Para dudas, contacta al organizador del evento</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GridSaleMode;
