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
  const [priceOptions, setPriceOptions] = useState([]);
  const [activeZonaId, setActiveZonaId] = useState(null);

  const loadPriceOptions = useCallback(async () => {
    console.log('🔍 loadPriceOptions iniciado con funcion:', selectedFuncion);
    
    if (!selectedFuncion?.plantilla?.detalles && !selectedFuncion?.plantilla_entradas) {
      console.log('❌ No hay plantilla.detalles ni plantilla_entradas');
      setPriceOptions([]);
      return;
    }

    try {
      // Cargar entradas y zonas de la BD
      const salaId = selectedFuncion.sala?.id || selectedFuncion.sala_id || selectedFuncion.sala;
      console.log('🏢 Sala ID:', salaId);
      
      const [{ data: entradas }, { data: zonas }] = await Promise.all([
        supabase.from('entradas').select('*').order('nombre_entrada'),
        supabase
          .from('zonas')
          .select('*')
          .or(`sala_id.eq.${String(salaId)},sala.eq.${String(salaId)}`)
          .order('nombre'),
      ]);

      console.log('📦 Entradas cargadas:', entradas);
      console.log('🎯 Zonas cargadas:', zonas);

      if (!entradas || !zonas) {
        console.log('❌ No se pudieron cargar entradas o zonas');
        return;
      }

      // Crear mapas para búsqueda rápida
      const entradasById = new Map(entradas.map(e => [e.id, e]));
      const zonasById = new Map(zonas.map(z => [z.id, z]));

      console.log('🗺️ Mapa de entradas por ID:', Array.from(entradasById.keys()));
      console.log('🎯 Mapa de zonas por ID:', Array.from(zonasById.keys()));

      // Obtener detalles de la plantilla
      let detalles = [];
      let detallesSource = '';
      
      if (selectedFuncion.plantilla?.detalles) {
        detallesSource = 'plantilla.detalles';
        try {
          detalles = typeof selectedFuncion.plantilla.detalles === 'string' 
            ? JSON.parse(selectedFuncion.plantilla.detalles) 
            : selectedFuncion.plantilla.detalles;
        } catch (e) {
          console.error('❌ Error parsing plantilla.detalles:', e);
          detalles = [];
        }
      } else if (selectedFuncion.plantilla_entradas?.detalles) {
        detallesSource = 'plantilla_entradas.detalles';
        try {
          detalles = typeof selectedFuncion.plantilla_entradas.detalles === 'string' 
            ? JSON.parse(selectedFuncion.plantilla_entradas.detalles) 
            : selectedFuncion.plantilla_entradas.detalles;
        } catch (e) {
          console.error('❌ Error parsing plantilla_entradas.detalles:', e);
          detalles = [];
        }
      }

      console.log('📋 Detalles cargados desde:', detallesSource);
      console.log('📋 Contenido de detalles:', detalles);

      if (!Array.isArray(detalles)) {
        console.error('❌ detalles no es un array:', detalles);
        setPriceOptions([]);
        return;
      }

      // Agrupar por zona física
      const zonasAgrupadas = new Map();
      
      detalles.forEach((detalle, index) => {
        console.log(`🔍 Procesando detalle ${index}:`, detalle);
        
        const zonaId = detalle.zonaId;
        const entradaId = detalle.entradaId;
        const precio = detalle.precio || 0;
        const comision = detalle.comision || 0;

        console.log(`  - zonaId: ${zonaId}, entradaId: ${entradaId}, precio: ${precio}`);

        if (!zonaId || !entradaId) {
          console.log(`  ❌ Saltando - zonaId o entradaId faltante`);
          return;
        }

        // Buscar zona y entrada en BD
        const zona = zonasById.get(zonaId);
        const entrada = entradasById.get(entradaId);

        console.log(`  - Zona encontrada:`, zona);
        console.log(`  - Entrada encontrada:`, entrada);

        if (!zona) {
          console.warn(`❌ Zona ${zonaId} no encontrada en BD`);
          return;
        }

        if (!entrada) {
          console.warn(`❌ Entrada ${entradaId} no encontrada en BD`);
          return;
        }

        // Agrupar por zona
        if (!zonasAgrupadas.has(zonaId)) {
          zonasAgrupadas.set(zonaId, {
            zona,
            precios: [],
            total: 0,
            vendidos: 0,
            reservados: 0
          });
        }

        const zonaGrupo = zonasAgrupadas.get(zonaId);
        
        // Evitar duplicados de entrada por zona
        const entradaExistente = zonaGrupo.precios.find(p => p.entradaId === entradaId);
        if (!entradaExistente) {
          zonaGrupo.precios.push({
            id: `${zonaId}-${entradaId}`,
            zonaId: zonaId,
            entradaId: entradaId,
            zona: zona,
            entrada: entrada,
            precio: precio,
            comision: comision,
            color: zona.color || entrada.color || '#6366f1'
          });
          console.log(`  ✅ Precio agregado a zona ${zonaId}`);
        } else {
          console.log(`  ⚠️ Entrada ${entradaId} ya existe en zona ${zonaId}`);
        }
      });

      console.log('🏗️ Zonas agrupadas:', zonasAgrupadas);

      // Convertir a array y calcular estadísticas
      const opciones = Array.from(zonasAgrupadas.values()).map(grupo => {
        // Calcular estadísticas de ocupación si hay mapa
        if (mapa) {
          const asientosZona = Object.values(mapa).filter(asiento => 
            asiento.zona_id === grupo.zona.id || asiento.zona === grupo.zona.id
          );
          
          grupo.total = asientosZona.length;
          grupo.vendidos = asientosZona.filter(a => a.estado === 'vendido' || a.estado === 'reservado').length;
          grupo.reservados = asientosZona.filter(a => a.estado === 'reservado').length;
          grupo.ocupacion = grupo.total > 0 ? Math.round((grupo.vendidos / grupo.total) * 100) : 0;
        }

        return grupo;
      });

      console.log('🎯 Opciones de precio finales:', opciones);
      setPriceOptions(opciones);
      
      // Restaurar selección previa si existe
      if (selectedZonaId && !opciones.find(o => o.zona.id === selectedZonaId)) {
        setActiveZonaId(opciones[0]?.zona.id || null);
      } else if (selectedZonaId) {
        setActiveZonaId(selectedZonaId);
      }

      // Notificar al padre que los precios están cargados
      if (onPricesLoaded) {
        onPricesLoaded(opciones);
      }

    } catch (error) {
      console.error('💥 Error cargando opciones de precio:', error);
      setPriceOptions([]);
    }
  }, [selectedFuncion, mapa, selectedZonaId, onPricesLoaded]);

  useEffect(() => {
    if (selectedFuncion) {
      loadPriceOptions();
    }
  }, [loadPriceOptions]);

  // Sync external selectedZonaId → internal activeZonaId
  useEffect(() => {
    if (selectedZonaId && selectedZonaId !== activeZonaId) {
      if (priceOptions.find(o => o.zona.id === selectedZonaId)) {
        setActiveZonaId(selectedZonaId);
      }
    }
  }, [selectedZonaId, activeZonaId, priceOptions]);

  const activeZona = activeZonaId ? priceOptions.find(o => o.zona.id === activeZonaId) : null;

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
        {priceOptions.length === 0 && (
          <div className="text-xs text-gray-500 px-2 py-1">No hay zonas configuradas en la plantilla</div>
        )}
        {priceOptions.map((zonaData) => (
          <div
            key={zonaData.zona.id}
            className={`px-3 py-2 rounded cursor-pointer whitespace-nowrap border ${
              activeZonaId === zonaData.zona.id ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => {
              setActiveZonaId(zonaData.zona.id);
              if (onSelectZona) onSelectZona(zonaData.zona.id);
            }}
          >
            <div className="text-xs font-semibold" style={{ color: zonaData.zona.color || '#333' }}>
              {zonaData.zona.nombre}
            </div>
            <div className="text-[10px] text-gray-500">Ocupación: {zonaData.ocupacion || 0}%</div>
          </div>
        ))}
      </div>

      {/* Opciones de precio de la zona activa */}
      {activeZona && (
        <div className="border rounded bg-white">
          <div className="px-3 py-2 border-b text-sm font-medium flex items-center justify-between">
            <span>Zona: {activeZona.zona.nombre}</span>
            <span className="text-gray-500 text-xs">
              Aforo {activeZona.total} | Vendidos {activeZona.vendidos} | Reservados {activeZona.reservados}
            </span>
          </div>
          <div className="divide-y">
            {activeZona.precios.map((opt) => (
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


