import React, { useCallback, useEffect, useState } from 'react';
import { Card, Typography, Space, InputNumber, Button, Tag, Image, Input, Badge, Empty } from '../../../../utils/antdComponents';
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';

const { Title, Text } = Typography;

const PaquetesWidget = ({ eventoId, onPackageAdded }) => {
  const [paquetes, setPaquetes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');


  const loadPaquetes = useCallback(async () => {
    if (!eventoId) return;
    setLoading(true);
    try {
      const { data: paquetesEvento, error: errorEvento } = await supabase
        .from('paquetes_eventos')
        .select('*, paquetes (*)')
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
      unicos.forEach((p) => { initialQty[p.id] = 0; });

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

  useEffect(() => { loadPaquetes(); }, [loadPaquetes]);

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

  const handleAdd = (paquete) => {
    const quantity = quantities[paquete.id] || 1;
    if (!onPackageAdded || quantity <= 0) return;
    onPackageAdded(paquete, quantity);
    setQuantities((prev) => ({ ...prev, [paquete.id]: 0 }));
  };

  if (!eventoId) {
    return (
      <Card title="Paquetes">
        <Text type="secondary">Selecciona un evento para ver paquetes.</Text>
      </Card>
    );
  }

  return (
    <div className="paquetes-widget">
      <div className="flex items-center justify-between mb-3">
        <Title level={4} className="mb-0">Paquetes del evento</Title>
        <Space>
          <Badge count={filtered.length} />
          <Input
            size="small"
            placeholder="Buscar"
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      </div>

      {filtered.length === 0 ? (
        <Empty description="No hay paquetes disponibles" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((paquete) => {
            const precio = paquete.precio_especial || paquete.precio || 0;
            const disponible = paquete.stock_disponible ?? 0;
            const qty = quantities[paquete.id] || 0;
            return (
              <Card key={paquete.id} size="small" hoverable loading={loading}
                cover={paquete.imagen_url ? (
                  <Image src={paquete.imagen_url} alt={paquete.nombre} height={120} style={{ objectFit: 'cover' }} />
                ) : null}
              >
                <Space direction="vertical" className="w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <Title level={5} className="mb-0">{paquete.nombre}</Title>
                      {paquete.descripcion && (
                        <Text type="secondary" className="text-xs block">{paquete.descripcion.slice(0, 80)}</Text>
                      )}
                    </div>
                    <Tag color={paquete.es_evento ? 'blue' : 'green'}>{paquete.es_evento ? 'Evento' : 'General'}</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text strong className="text-lg text-green-600">${precio.toFixed(2)}</Text>
                    <Tag color={disponible > 0 ? 'success' : 'red'}>Disponibles: {disponible}</Tag>
                  </div>
                  <div className="flex items-center justify-between">
                    <InputNumber
                      min={0}
                      max={disponible || undefined}
                      value={qty}
                      onChange={(val) => setQuantities((prev) => ({ ...prev, [paquete.id]: Math.max(0, val || 0) }))}
                      size="small"
                    />
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleAdd(paquete)}
                      disabled={qty === 0 || disponible === 0}
                    >
                      Agregar
                    </Button>
                  </div>
                </Space>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaquetesWidget;


