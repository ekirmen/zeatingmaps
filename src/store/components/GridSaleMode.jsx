import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Select, Space, Typography, Divider, Alert, Spin, Row, Col, Badge, Tag } from 'antd';
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

      // 1) Cargar zonas reales desde la tabla public.zonas por sala_id
      const { data: zonasData, error: zonasError } = await supabase
        .from('zonas')
        .select('id, nombre, aforo, color, numerada, sala_id')
        .eq('sala_id', evento.sala)
        .order('nombre');

      if (zonasError) throw zonasError;
      const zonasReal = zonasData || [];
      setZonas(zonasReal);

      // 2) Cargar precios desde plantillas y mapear por zona
      const { data: plantillasData, error: plantillasError } = await supabase
        .from('plantillas')
        .select('*')
        .eq('recinto', evento.recinto)
        .eq('sala', evento.sala)
        .limit(1);

      if (plantillasError) throw plantillasError;

      const preciosMap = {};
      if (plantillasData && plantillasData.length > 0) {
        const plantilla = plantillasData[0];
        let detalles = [];
        try {
          detalles = typeof plantilla.detalles === 'string' ? JSON.parse(plantilla.detalles) : (plantilla.detalles || []);
        } catch (_) {
          detalles = [];
        }
        detalles.forEach(d => {
          const zonaId = d.zonaId || d.zona_id || d.zona;
          if (zonaId != null) {
            preciosMap[zonaId] = {
              precio: Number(d.precio) || 0,
              descripcion: d.descripcion || '',
              orden: typeof d.orden === 'number' ? d.orden : undefined,
            };
          }
        });
      }

      setPrecios(preciosMap);

      // 3) Inicializar cantidades
      const cantidadesIniciales = {};
      zonasReal.forEach(zona => {
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
      nombreZona: zona.nombre,
      nombre: zona.nombre,
      funcion_id: funcion.id,
      precio: Number(precio.precio) || 0,
      cantidad: cantidad,
      tipo: 'grid',
      descripcion: `${zona.nombre} - ${funcion?.nombre || 'Función'}`,
      fecha: funcion?.fechaCelebracion || funcion?.fecha || null,
      hora: funcion?.hora || null
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

  const increaseCantidad = (zonaId) => {
    setCantidades(prev => ({
      ...prev,
      [zonaId]: Math.max(0, (prev[zonaId] || 0) + 1)
    }));
  };

  const decreaseCantidad = (zonaId) => {
    setCantidades(prev => ({
      ...prev,
      [zonaId]: Math.max(0, (prev[zonaId] || 0) - 1)
    }));
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
      <Row gutter={[16, 16]}>
        {[...zonas].sort((a, b) => {
          const ordenA = precios[a.id]?.orden;
          const ordenB = precios[b.id]?.orden;
          if (typeof ordenA === 'number' || typeof ordenB === 'number') {
            if (typeof ordenA !== 'number') return 1;
            if (typeof ordenB !== 'number') return -1;
            if (ordenA !== ordenB) return ordenA - ordenB;
          }
          const precioA = (precios[a.id]?.precio ?? (typeof a.precio === 'number' ? a.precio : (Array.isArray(a.precios) ? a.precios[0]?.precio : undefined))) ?? Number.MAX_SAFE_INTEGER;
          const precioB = (precios[b.id]?.precio ?? (typeof b.precio === 'number' ? b.precio : (Array.isArray(b.precios) ? b.precios[0]?.precio : undefined))) ?? Number.MAX_SAFE_INTEGER;
          if (a?.nombre && b?.nombre && a.nombre !== b.nombre) {
            return a.nombre.localeCompare(b.nombre);
          }
          return precioA - precioB;
        }).map(zona => {
          let precioData = precios[zona.id] || zona.precio || (Array.isArray(zona.precios) ? zona.precios[0] : null);
          if (typeof precioData === 'number') precioData = { precio: precioData };
          const precio = precioData;
          const cantidadEnCarrito = getCantidadEnCarrito(zona.id);
          const cantidadActual = cantidades[zona.id] || 0;
          const aforoNum = typeof zona.aforo === 'number' ? zona.aforo : Number(zona.aforo || 0);
          const isAgotado = aforoNum <= 0;

          return (
            <Col xs={24} sm={24} md={24} lg={24} key={zona.id}>
              <Card className={`zona-card ${cantidadEnCarrito > 0 ? 'zona-selected' : ''}`} hoverable>
                <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                  <div className="flex items-baseline gap-2 min-w-[100px]">
                    <Text strong>ZONA:</Text>
                    <Title level={4} className="mb-0">
                      {zona.nombre}
                    </Title>
                    {zona.descripcion && (
                      <Text type="secondary" className="text-sm">
                        {zona.descripcion}
                      </Text>
                    )}
                  </div>

                  <div className="min-w-[140px] flex items-baseline justify-center gap-2">
                    <Text strong>PRECIO:</Text>
                    {isAgotado ? (
                      <Tag color="red">AGOTADO</Tag>
                    ) : precio ? (
                      <Text className="text-2xl font-bold text-green-600">
                        ${precio.precio ? precio.precio.toLocaleString() : '0'}
                      </Text>
                    ) : (
                      <Tag color="red">Sin precio</Tag>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Text strong>CANTIDAD:</Text>
                    <Button icon={<MinusOutlined />} onClick={() => decreaseCantidad(zona.id)} disabled={isAgotado || cantidadActual <= 0} />
                    <InputNumber
                      min={0}
                      max={aforoNum > 0 ? aforoNum : 0}
                      value={cantidadActual}
                      onChange={(value) => handleCantidadChange(zona.id, value)}
                      className="w-24"
                      size="large"
                      disabled={isAgotado}
                    />
                    <Button icon={<PlusOutlined />} onClick={() => increaseCantidad(zona.id)} disabled={isAgotado} />
                    {Number.isFinite(aforoNum) && (
                      isAgotado ? (
                        <Text type="danger" className="text-xs ml-2 text-red-600">
                          AGOTADO
                        </Text>
                      ) : (
                        <Text type="secondary" className="text-xs ml-2">
                          Disponible: {aforoNum} entradas
                        </Text>
                      )
                    )}
                  </div>

                  <div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddToCart(zona)}
                      disabled={isAgotado || cantidadActual <= 0 || !precio || !(precio?.precio > 0)}
                      loading={loading}
                    >
                      Agregar al Carrito
                    </Button>
                  </div>

                  {cantidadEnCarrito > 0 && (
                    <Badge count={cantidadEnCarrito} color="green">
                      <Button type="link" onClick={() => handleRemoveFromCart(zona.id)} className="text-green-600">
                        En carrito: {cantidadEnCarrito}
                      </Button>
                    </Badge>
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
