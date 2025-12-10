import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Typography, Space, InputNumber, Tag, Image, Input, Badge, Empty } from '../../utils/antdComponents';
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useCartStore } from '../cartStore';

const { Title, Text } = Typography;

const PaquetesWidget = ({ eventoId }) => {
  const [paquetes, setPaquetes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const { addProduct, products } = useCartStore();

  const loadPaquetes = useCallback(async () => {
    if (!eventoId) {
      setPaquetes([]);
      setFiltered([]);
      return;
    }
    setLoading(true);
    try {
      const { data: paquetesEvento, error: errorEvento } = await supabase
        .from('paquetes_eventos')
        .select(`*, paquetes (*)`)
        .eq('evento_id', eventoId)
        .eq('activo', true);

      if (errorEvento) {
      }

      const { data: paquetesGenerales, error: errorGenerales } = await supabase
        .from('paquetes')
        .select('*')
        .eq('activo', true);

      if (errorGenerales) {
      }

      const paquetesEventoData = paquetesEvento?.map((p) => ({
        ...p.paquetes,
        precio_especial: p.precio_especial,
        stock_disponible: p.stock_disponible ?? p.paquetes?.stock_disponible,
        vendidos: p.vendidos ?? p.paquetes?.vendidos,
        es_evento: true,
      })) || [];

      const paquetesGeneralesData = paquetesGenerales?.map((p) => ({
        ...p,
        es_evento: false,
      })) || [];

      const combinados = [...paquetesEventoData, ...paquetesGeneralesData];
      const unicos = combinados.filter((pkg, idx, self) => idx === self.findIndex((p) => p.id === pkg.id));

      const initialQty = {};
      unicos.forEach((p) => {
        initialQty[p.id] = 0;
      });

      setPaquetes(unicos);
      setFiltered(unicos);
      setQuantities(initialQty);
    } catch (err) {
      console.error('Error cargando paquetes', err);
      setPaquetes([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    loadPaquetes();
  }, [loadPaquetes]);

  useEffect(() => {
    let data = [...paquetes];
    if (search) {
      data = data.filter((p) =>
        (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(data);
  }, [search, paquetes]);

  const handleQuantityChange = (id, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, value || 0),
    }));
  };

  const addToCart = (paquete) => {
    const cantidad = quantities[paquete.id] || 1;
    if (cantidad <= 0) return;

    const precio = paquete.precio_especial || paquete.precio || 0;
    const payload = {
      ...paquete,
      id: `paquete-${paquete.id}`,
      tipo: 'paquete',
      cantidad,
      precio_total: precio * cantidad,
    };

    addProduct(payload);
    setQuantities((prev) => ({ ...prev, [paquete.id]: 0 }));
  };

  if (!eventoId) {
    return (
      <Card title="Paquetes">
        <Text type="secondary">Selecciona un evento para ver paquetes disponibles.</Text>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span>Paquetes disponibles</span>
          <Badge count={filtered.length} />
        </div>
      }
      extra={
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar paquetes"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
      }
      loading={loading}
    >
      {filtered.length === 0 ? (
        <Empty description="No hay paquetes configurados para este evento" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((paquete) => {
            const precio = paquete.precio_especial || paquete.precio || 0;
            const disponible = paquete.stock_disponible ?? 0;
            const enCarrito = products.some((p) => p.id === `paquete-${paquete.id}`);
            const qty = quantities[paquete.id] || 0;

            return (
              <Card
                key={paquete.id}
                size="small"
                hoverable
                cover={
                  paquete.imagen_url ? (
                    <Image src={paquete.imagen_url} alt={paquete.nombre} height={140} style={{ objectFit: 'cover' }} />
                  ) : null
                }
              >
                <Space direction="vertical" className="w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <Title level={5} className="mb-0">{paquete.nombre}</Title>
                      {paquete.descripcion && (
                        <Text type="secondary" className="text-xs block">
                          {paquete.descripcion.slice(0, 80)}
                        </Text>
                      )}
                    </div>
                    <Tag color={paquete.es_evento ? 'blue' : 'green'}>{paquete.es_evento ? 'Evento' : 'General'}</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text strong className="text-lg text-green-600">${precio.toFixed(2)}</Text>
                    <Tag color={disponible > 0 ? 'success' : 'red'}>Disponibles: {disponible}</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <Space>
                      <InputNumber
                        min={0}
                        max={disponible || undefined}
                        value={qty}
                        onChange={(val) => handleQuantityChange(paquete.id, val)}
                        size="small"
                      />
                    </Space>
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => addToCart(paquete)}
                      disabled={disponible === 0 || qty === 0}
                    >
                      {enCarrito ? 'Actualizar' : 'Agregar'}
                    </Button>
                  </div>
                </Space>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default PaquetesWidget;


