import React, { useMemo, useCallback, forwardRef } from 'react';
import { Card, Typography, Space, Tag, Button, Empty, Divider, message, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ProductosWidget from './components/ProductosWidget';
import PaquetesWidget from './components/PaquetesWidget';
import formatDateString from '../../../utils/formatDateString';

const { Title, Text } = Typography;
const { Option } = Select;

const parseDetalles = (selectedPlantilla, selectedFuncion) => {
  const detalleSources = [
    selectedPlantilla?.detalles,
    selectedFuncion?.plantilla?.detalles,
    selectedFuncion?.plantilla_entradas?.detalles
  ];

  for (const rawDetalles of detalleSources) {
    if (!rawDetalles) continue;

    try {
      const parsed = typeof rawDetalles === 'string' ? JSON.parse(rawDetalles) : rawDetalles;
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
    }
  }

  return [];
};

const ZonesAndPricesSimple = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  onFunctionSelect,
  carrito = [],
  setCarrito,
  selectedPlantilla,
  setSelectedPlantilla,
  zonas = [],
  mapa = null,
  plantillas = [],
}, ref) => {
  const detallesPlantilla = useMemo(
    () => parseDetalles(selectedPlantilla, selectedFuncion),
    [selectedPlantilla, selectedFuncion]
  );

  const mapaStats = useMemo(() => {
    if (!mapa || !mapa.contenido) {
      return null;
    }

    // Si el contenido es un array, procesarlo directamente
    // Si es un objeto, buscar la propiedad 'elementos'
    const elementos = Array.isArray(mapa.contenido)
      ? mapa.contenido
      : mapa.contenido.elementos || [];

    if (!Array.isArray(elementos)) {
      return null;
    }

    let totalAsientos = 0;
    elementos.forEach((elemento) => {
      if (Array.isArray(elemento?.sillas)) {
        totalAsientos += elemento.sillas.length;
      } else if (elemento?.type === 'silla') {
        totalAsientos += 1;
      }
    });

    return {
      totalAsientos
    };
  }, [mapa]);

  const zonasMap = useMemo(() => {
    const map = new Map();
    (zonas || []).forEach((zona) => {
      const id = zona?.id || zona?._id || zona?.zonaId;
      if (id) {
        map.set(id, zona);
      }
    });
    return map;
  }, [zonas]);

  const zoneGroups = useMemo(() => {
    if (!Array.isArray(detallesPlantilla) || detallesPlantilla.length === 0) {
      return [];
    }

    const grouped = new Map();

    detallesPlantilla.forEach((detalle, index) => {
      const zonaId = detalle?.zonaId || detalle?.zona?.id || detalle?.zona || null;
      if (!zonaId) {
        return;
      }

      const zonaInfo = zonasMap.get(zonaId) || {};
      const current = grouped.get(zonaId) || {
        zonaId,
        zonaNombre: zonaInfo?.nombre || detalle?.zona?.nombre || `Zona ${zonaId}`,
        zonaColor: zonaInfo?.color || detalle?.zona?.color || undefined,
        capacidad: zonaInfo?.capacidad || zonaInfo?.capacidad_total || null,
        precios: []
      };

      current.precios.push({
        id: detalle?.id || detalle?.priceId || `detalle-${zonaId}-${current.precios.length}`,
        nombre: detalle?.nombre || detalle?.entrada?.nombre_entrada || detalle?.titulo || detalle?.tipoEntrada || 'Entrada general',
        tipo: detalle?.tipoEntrada || detalle?.tipo || 'general',
        precio: Number(detalle?.precio) || 0,
        comision: Number(detalle?.comision) || 0,
        moneda: detalle?.moneda || 'USD',
        descripcion: detalle?.descripcion || '',
        raw: detalle
      });

      grouped.set(zonaId, current);
    });

    return Array.from(grouped.values());
  }, [detallesPlantilla, zonasMap]);

  const handlePlantillaChange = useCallback((plantillaId) => {
    if (!setSelectedPlantilla) return;
    const nuevaPlantilla = plantillas.find((plantilla) => (plantilla.id || plantilla._id) === plantillaId);
    if (nuevaPlantilla) {
      setSelectedPlantilla(nuevaPlantilla);
    }
  }, [plantillas, setSelectedPlantilla]);

  const handleAddPriceToCart = useCallback((zonaInfo, priceInfo) => {
    if (!setCarrito) return;

    const nombreEntrada = priceInfo.nombre || `${zonaInfo.zonaNombre} - ${priceInfo.tipo}`;
    const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;
    const funcionFecha = selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion || null;

    const newItem = {
      _id: `manual-${zonaInfo.zonaId}-${priceInfo.id}-${uuidv4()}`,
      sillaId: null,
      nombre: nombreEntrada,
      nombreZona: zonaInfo.zonaNombre,
      zona: zonaInfo.zonaNombre,
      zonaId: zonaInfo.zonaId,
      precio: priceInfo.precio,
      tipoPrecio: priceInfo.tipo,
      descuentoNombre: priceInfo.raw?.descuentoNombre || priceInfo.raw?.descuento || '',
      funcionId,
      funcionFecha,
      nombreMesa: '',
      precioInfo: priceInfo.raw || null,
      isManual: true,
      timestamp: Date.now(),
      modoVenta: 'boleteria'
    };

    setCarrito((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, newItem];
    });

    message.success(`${nombreEntrada} agregado al carrito`);
  }, [selectedFuncion, setCarrito]);

  const handleProductAdded = useCallback((producto, quantity) => {
    if (!setCarrito || !producto) return;

    const count = Math.max(1, quantity || 1);
    const baseNombre = producto.nombre || 'Producto';
    const baseZona = producto.categoria || 'Productos';
    const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;
    const funcionFecha = selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion || null;

    const items = Array.from({ length: count }).map((_, index) => ({
      _id: `producto-${producto.id || index}-${uuidv4()}`,
      sillaId: null,
      nombre: baseNombre,
      nombreZona: baseZona,
      zona: baseZona,
      zonaId: `producto-${producto.id || baseNombre}`,
      precio: Number(producto.precio) || 0,
      tipoPrecio: 'producto',
      descuentoNombre: '',
      funcionId,
      funcionFecha,
      nombreMesa: '',
      productoId: producto.id,
      isProduct: true,
      timestamp: Date.now() + index,
      modoVenta: 'boleteria'
    }));

    setCarrito((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, ...items];
    });

    message.success(count === 1 ? `${baseNombre} agregado al carrito` : `${count} unidades agregadas al carrito`);
  }, [selectedFuncion, setCarrito]);

  const handlePackageAdded = useCallback((paquete, quantity) => {
    if (!setCarrito || !paquete) return;
    const count = Math.max(1, quantity || 1);
    const baseNombre = paquete.nombre || 'Paquete';
    const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;
    const funcionFecha = selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion || null;

    const items = Array.from({ length: count }).map((_, index) => ({
      _id: `paquete-${paquete.id || index}-${uuidv4()}`,
      sillaId: null,
      nombre: baseNombre,
      nombreZona: 'Paquetes',
      zona: 'Paquetes',
      zonaId: `paquete-${paquete.id || baseNombre}`,
      precio: Number(paquete.precio_especial || paquete.precio || 0),
      tipoPrecio: 'paquete',
      descuentoNombre: '',
      funcionId,
      funcionFecha,
      nombreMesa: '',
      paqueteId: paquete.id,
      isProduct: true,
      timestamp: Date.now() + index,
      modoVenta: 'boleteria',
    }));

    setCarrito((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, ...items];
    });

    message.success(count === 1 ? `${baseNombre} agregado al carrito` : `${count} unidades agregadas al carrito`);
  }, [selectedFuncion, setCarrito]);

  const selectedEventId = selectedEvent?.id || selectedEvent?._id || undefined;
  const selectedFunctionId = selectedFuncion?.id || selectedFuncion?._id || undefined;
  const selectedPlantillaId = selectedPlantilla?.id || selectedPlantilla?._id || undefined;

  return (
    <div className="h-full flex flex-col" ref={ref}>
      <div className="p-4 border-b bg-white">
        <Title level={4} className="!mb-0">🎫 Gestión de Zonas y Precios</Title>
        <Text type="secondary">Selecciona el evento, la función y los precios que deseas vender en boletería.</Text>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card size="small" title="Selección de evento y función">
          <Space direction="vertical" className="w-full" size="middle">
            <div>
              <Text className="block text-xs text-gray-500 mb-1">Evento</Text>
              <Select
                showSearch
                placeholder="Selecciona un evento"
                value={selectedEventId}
                onChange={value => onEventSelect && onEventSelect(value)}
                optionFilterProp="children"
                className="w-full"
              >
                {eventos.map(evento => (
                  <Option key={evento.id || evento._id} value={evento.id || evento._id}>
                    {evento.nombre}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Text className="block text-xs text-gray-500">Función</Text>
                {typeof onShowFunctions === 'function' && funciones.length > 1 && (
                  <Button type="link" size="small" onClick={onShowFunctions}>
                    Ver listado completo
                  </Button>
                )}
              </div>
              <Select
                showSearch
                placeholder={selectedEvent ? 'Selecciona una función' : 'Selecciona primero un evento'}
                value={selectedFunctionId}
                onChange={value => onFunctionSelect && onFunctionSelect(value)}
                disabled={!selectedEvent}
                optionFilterProp="children"
                className="w-full"
              >
                {funciones.map(funcion => {
                  const id = funcion.id || funcion._id;
                  const label = funcion.nombre || formatDateString(funcion.fechaCelebracion || funcion.fecha_celebracion);
                  return (
                    <Option key={id} value={id}>
                      {label}
                    </Option>
                  );
                })}
              </Select>
            </div>

            {plantillas.length > 0 && (
              <div>
                <Text className="block text-xs text-gray-500 mb-1">Plantilla de precios</Text>
                <Select
                  value={selectedPlantillaId}
                  onChange={handlePlantillaChange}
                  placeholder="Selecciona una plantilla"
                  allowClear
                  className="w-full"
                >
                  {plantillas.map(plantilla => (
                    <Option key={plantilla.id || plantilla._id} value={plantilla.id || plantilla._id}>
                      {plantilla.nombre || `Plantilla ${plantilla.id || plantilla._id}`}
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <Divider className="!my-2" />

            <Space size="small" wrap>
              <Tag color="blue">Eventos disponibles: {eventos.length}</Tag>
              <Tag color="purple">Funciones cargadas: {funciones.length}</Tag>
              <Tag color="green">En carrito: {carrito.length}</Tag>
              {zonas.length > 0 && <Tag color="geekblue">Zonas: {zonas.length}</Tag>}
              {mapaStats?.totalAsientos && (
                <Tag color="cyan">Asientos en mapa: {mapaStats.totalAsientos}</Tag>
              )}
            </Space>
          </Space>
        </Card>

        <Card
          size="small"
          title="Zonas y precios configurados"
          extra={selectedFuncion && zoneGroups.length === 0 ? <Tag color="orange">Sin detalles en la plantilla</Tag> : null}
        >
          {!selectedFuncion && (
            <Empty description="Selecciona una función para ver las zonas disponibles" />
          )}

          {selectedFuncion && zoneGroups.length === 0 && (
            <Empty description="No se encontraron precios configurados en la plantilla" />
          )}

          <Space direction="vertical" size="middle" className="w-full">
            {zoneGroups.map((zona) => (
              <Card
                key={zona.zonaId}
                size="small"
                className="bg-gray-50"
                title={
                  <div className="flex items-center justify-between">
                    <span>{zona.zonaNombre}</span>
                    <Space size="small">
                      {zona.capacidad && (
                        <Tag color="default">Capacidad: {zona.capacidad}</Tag>
                      )}
                      {zona.zonaColor && (
                        <Tag color={zona.zonaColor}>
                          Color
                        </Tag>
                      )}
                    </Space>
                  </div>
                }
              >
                <Space direction="vertical" size="small" className="w-full">
                  {zona.precios.map((precio) => (
                    <Card
                      key={precio.id}
                      size="small"
                      className="border border-dashed"
                      bodyStyle={{ padding: '12px' }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <Text className="font-medium text-gray-700">{precio.nombre}</Text>
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold text-green-600">${precio.precio.toFixed(2)}</span>
                            {precio.comision > 0 && (
                              <span className="ml-2">+ comisión ${precio.comision.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 capitalize">
                            Tipo: {precio.tipo}
                          </div>
                          {precio.descripcion && (
                            <div className="text-xs text-gray-500 mt-1">{precio.descripcion}</div>
                          )}
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddPriceToCart(zona, precio)}
                        >
                          Añadir rápido
                        </Button>
                      </div>
                    </Card>
                  ))}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {selectedEvent && (
          <Card size="small" title="Productos del evento">
            <ProductosWidget
              eventoId={selectedEvent?.id || selectedEvent?._id}
              onProductAdded={handleProductAdded}
            />
          </Card>
        )}
        {selectedEvent && (
          <Card size="small" title="Paquetes del evento" className="mt-4">
            <PaquetesWidget
              eventoId={selectedEvent?.id || selectedEvent?._id}
              onPackageAdded={handlePackageAdded}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default forwardRef(ZonesAndPricesSimple);
