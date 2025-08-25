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
  onPricesLoaded,
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
        // Fallback: si sigue sin plantilla, intentar por columna plantilla_entradas
        if (!plantilla && funcionData?.plantilla_entradas) {
          const { data: plantillaData } = await supabase
            .from('plantillas')
            .select('*')
            .eq('id', funcionData.plantilla_entradas)
            .single();
          if (plantillaData) plantilla = plantillaData;
        }
      }
      if (!plantilla) return;

      // Entradas y zonas
      const salaId = funcion.sala?.id || funcion.sala_id || funcion.sala;
      const [{ data: entradas }, { data: zonas }] = await Promise.all([
        supabase.from('entradas').select('*').order('nombre_entrada'),
        supabase
          .from('zonas')
          .select('*')
          .or(`sala_id.eq.${String(salaId)},sala.eq.${String(salaId)}`)
          .order('nombre'),
      ]);

      const entradasById = new Map((entradas || []).map((e) => [String(e.id), e]));
      const zonasById = new Map((zonas || []).map((z) => [String(z.id), z]));

      // Normalizar detalles desde múltiples estructuras posibles
      const normalizeDetalles = (raw) => {
        let base = raw;
        if (typeof base === 'string') {
          try { base = JSON.parse(base); } catch { base = []; }
        }
        // si ya es array
        if (Array.isArray(base)) return base;
        // si es objeto con distintas llaves
        if (base && typeof base === 'object') {
          if (Array.isArray(base.detalles)) return base.detalles;
          if (Array.isArray(base.precios)) return base.precios;
          if (Array.isArray(base.items)) return base.items;
        }
        return [];
      };

      const detalles = normalizeDetalles(plantilla.detalles);

      const statsByZona = computeMapStatsByZone();

      const map = {};
      const readFirst = (obj, keys) => {
        for (const k of keys) {
          const v = obj?.[k];
          if (v !== undefined && v !== null && v !== '') return v;
        }
        return undefined;
      };

      const toNumber = (v) => {
        const n = Number(v);
        return isNaN(n) ? null : n;
      };

      for (const d of detalles) {
        const zonaCandidate = readFirst(d, ['zonaId', 'zona_id', 'zona', 'id_zona', 'idZona']);
        const prodCandidate = readFirst(d, ['productoId', 'producto_id', 'producto', 'id_producto', 'entrada', 'entrada_id', 'idEntrada', 'productId']);
        const priceCandidate = readFirst(d, ['precio', 'price', 'monto', 'valor', 'importe', 'precioUnitario', 'precio_unitario']);
        const feeCandidate = readFirst(d, ['comision', 'fee', 'cargo']);

        const zonaKey = zonaCandidate !== undefined ? String(zonaCandidate?.id ?? zonaCandidate) : '';
        const prodKey = prodCandidate !== undefined ? String(prodCandidate?.id ?? prodCandidate) : '';
        const precioNum = toNumber(priceCandidate);
        const comisionNum = toNumber(feeCandidate) || 0;

        if (!zonaKey || !prodKey || precioNum === null) continue;
        let zona = zonasById.get(zonaKey);
        // Permitir fallback cuando la entrada no existe en tabla 'entradas'
        let entrada = entradasById.get(prodKey);
        if (!zona) {
          // Crear zona virtual si no existe en BD para poder agrupar
          zona = { id: zonaKey, nombre: `Zona ${zonaKey}`, color: null };
        }
        if (!entrada) {
          // Crear entrada virtual usando nombres presentes en el detalle
          const entradaNombre = readFirst(d, ['entradaNombre', 'nombreEntrada', 'nombre_entrada', 'nombre']) || `Entrada ${prodKey}`;
          entrada = { id: prodKey, nombre_entrada: entradaNombre };
        }
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
          precio: precioNum,
          comision: comisionNum,
          color: zona.color || entrada.color || '#5C1473',
        });
      }

      setZonesMap(map);
      if (onPricesLoaded) {
        try {
          onPricesLoaded(map);
        } catch {}
      }
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


