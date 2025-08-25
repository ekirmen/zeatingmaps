import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Button, Typography, Spin, Tag, message } from 'antd';
import { supabase } from '../../../../supabaseClient';

const { Text } = Typography;

const ZonesPanel = ({
  selectedFuncion,
  selectedPlantilla,
  mapa,
  onSelectPrice,
  selectedPriceId,
  selectedZonaId,
  onSelectZona,
}) => {
  const [loading, setLoading] = useState(false);
  const [zonesMap, setZonesMap] = useState({}); // zonaId -> { zona, options: [], stats }
  const [activeZonaId, setActiveZonaId] = useState(null);

  const computeMapStatsByZone = useCallback(() => {
    const stats = {}; // zonaId -> { total, vendidos, reservados }
    const contenido = Array.isArray(mapa?.contenido) ? mapa.contenido : [];
    contenido.forEach((elemento) => {
      (elemento.sillas || []).forEach((silla) => {
        const zid = String(silla?.zona?.id || silla?.zonaId || silla?.zona || '');
        if (!zid) return;
        if (!stats[zid]) stats[zid] = { total: 0, vendidos: 0, reservados: 0 };
        stats[zid].total += 1;
        if (silla.estado === 'vendido' || silla.estado === 'pagado') stats[zid].vendidos += 1;
        if (silla.estado === 'reservado') stats[zid].reservados += 1;
      });
    });
    return stats;
  }, [mapa]);

  const loadData = useCallback(async () => {
    if (!selectedFuncion) return;
    setLoading(true);
    try {
      // Resolver plantilla
      let plantilla = selectedPlantilla;
      let funcion = selectedFuncion;
      if (!plantilla) {
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('*, plantilla(*)')
          .eq('id', selectedFuncion.id)
          .single();
        if (funcionError) throw funcionError;
        funcion = funcionData;
        plantilla = funcionData?.plantilla;
      }
      if (!plantilla) return;

      // Entradas y zonas
      const [{ data: entradas }, { data: zonas }] = await Promise.all([
        supabase.from('entradas').select('*').order('nombre_entrada'),
        supabase
          .from('zonas')
          .select('*')
          .eq('sala_id', funcion.sala?.id || funcion.sala_id || funcion.sala)
          .order('nombre'),
      ]);

      const entradasById = new Map((entradas || []).map((e) => [String(e.id), e]));
      const zonasById = new Map((zonas || []).map((z) => [String(z.id), z]));

      let detalles = [];
      try {
        detalles = Array.isArray(plantilla.detalles)
          ? plantilla.detalles
          : JSON.parse(plantilla.detalles || '[]');
      } catch (e) {
        detalles = [];
      }

      const statsByZona = computeMapStatsByZone();

      const map = {};
      for (const d of detalles) {
        const zonaKey = String(d.zonaId ?? d.zona?.id ?? d.zona ?? '');
        const prodKey = String(d.productoId ?? d.producto?.id ?? d.producto ?? '');
        if (!zonaKey || !prodKey || d.precio == null) continue;
        const zona = zonasById.get(zonaKey);
        const entrada = entradasById.get(prodKey);
        if (!zona || !entrada) continue;
        if (!map[zonaKey]) {
          const st = statsByZona[zonaKey] || { total: 0, vendidos: 0, reservados: 0 };
          const ocup = st.total > 0 ? Math.round(((st.vendidos + st.reservados) / st.total) * 100) : 0;
          map[zonaKey] = {
            zona,
            stats: { ...st, ocupacion: ocup },
            options: [],
          };
        }
        map[zonaKey].options.push({
          id: `${entrada.id}_${zona.id}`,
          entrada,
          zona,
          precio: Number(d.precio),
          comision: Number(d.comision || 0),
          color: zona.color || entrada.color || '#5C1473',
        });
      }

      setZonesMap(map);
      if (!activeZonaId) {
        const first = Object.keys(map)[0];
        if (first) setActiveZonaId(first);
      }
    } catch (error) {
      console.error('Error loading zones panel:', error);
      message.error('Error al cargar zonas y precios');
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion, selectedPlantilla, computeMapStatsByZone, activeZonaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync external selectedZonaId → internal activeZonaId
  useEffect(() => {
    if (selectedZonaId && selectedZonaId !== activeZonaId) {
      if (zonesMap[selectedZonaId]) {
        setActiveZonaId(selectedZonaId);
      }
    }
  }, [selectedZonaId, activeZonaId, zonesMap]);

  const zonaEntries = useMemo(() => Object.entries(zonesMap), [zonesMap]);
  const activeZona = activeZonaId ? zonesMap[activeZonaId] : null;

  if (!selectedFuncion) return null;
  if (loading) {
    return (
      <div className="py-6 text-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de zonas */}
      <div className="flex items-center space-x-2 overflow-x-auto p-2 border rounded bg-white">
        {zonaEntries.length === 0 && (
          <div className="text-xs text-gray-500 px-2 py-1">No hay zonas configuradas en la plantilla</div>
        )}
        {zonaEntries.map(([zonaId, data]) => (
          <div
            key={zonaId}
            className={`px-3 py-2 rounded cursor-pointer whitespace-nowrap border ${
              activeZonaId === zonaId ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => {
              setActiveZonaId(zonaId);
              if (onSelectZona) onSelectZona(zonaId);
            }}
          >
            <div className="text-xs font-semibold" style={{ color: data.zona.color || '#333' }}>
              {data.zona.nombre}
            </div>
            <div className="text-[10px] text-gray-500">Ocupación: {data.stats.ocupacion}%</div>
          </div>
        ))}
      </div>

      {/* Opciones de precio de la zona activa */}
      {activeZona && (
        <div className="border rounded bg-white">
          <div className="px-3 py-2 border-b text-sm font-medium flex items-center justify-between">
            <span>Zona: {activeZona.zona.nombre}</span>
            <span className="text-gray-500 text-xs">
              Aforo {activeZona.stats.total} | Vendidos {activeZona.stats.vendidos} | Reservados {activeZona.stats.reservados}
            </span>
          </div>
          <div className="divide-y">
            {activeZona.options.map((opt) => (
              <div
                key={opt.id}
                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-50 ${
                  selectedPriceId === opt.id ? 'bg-purple-50 ring-1 ring-purple-300' : ''
                }`}
                onClick={() => onSelectPrice(opt)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }}></div>
                  <div>
                    <div className="font-medium">{opt.entrada.nombre_entrada}</div>
                    <div className="text-gray-500">{activeZona.zona.nombre}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${opt.precio.toFixed(2)}</div>
                  {opt.comision > 0 && <div className="text-gray-500">+${opt.comision.toFixed(2)} comisión</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesPanel;


