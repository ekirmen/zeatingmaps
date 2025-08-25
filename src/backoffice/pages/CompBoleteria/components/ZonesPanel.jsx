import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Button, Typography, Spin, Tag, message, Alert } from 'antd';
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
  console.log('🚀 ZonesPanel - COMPONENTE MONTADO');
  console.log('📋 Props recibidas:', {
    selectedFuncion: !!selectedFuncion,
    selectedPlantilla: !!selectedPlantilla,
    mapa: !!mapa,
    onSelectPrice: !!onSelectPrice,
    selectedPriceId,
    selectedZonaId,
    onSelectZona: !!onSelectZona,
    onPricesLoaded: !!onPricesLoaded
  });

  const [loading, setLoading] = useState(false);
  const [priceOptions, setPriceOptions] = useState([]);
  const [activeZonaId, setActiveZonaId] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Función para extraer detalles de la plantilla
  const extractDetalles = useCallback((funcion, plantilla) => {
    console.log('🔍 extractDetalles - Iniciando extracción...');
    console.log('📋 Funcion:', funcion);
    console.log('📋 Plantilla:', plantilla);

    let detalles = [];
    let source = '';

    // PRIORIDAD 1: selectedPlantilla.detalles
    if (plantilla?.detalles) {
      source = 'selectedPlantilla.detalles';
      try {
        if (typeof plantilla.detalles === 'string') {
          detalles = JSON.parse(plantilla.detalles);
        } else {
          detalles = plantilla.detalles;
        }
        console.log('✅ Detalles extraídos desde selectedPlantilla.detalles');
      } catch (e) {
        console.error('❌ Error parsing selectedPlantilla.detalles:', e);
        detalles = [];
      }
    }
    // PRIORIDAD 2: funcion.plantilla.detalles
    else if (funcion?.plantilla?.detalles) {
      source = 'funcion.plantilla.detalles';
      try {
        if (typeof funcion.plantilla.detalles === 'string') {
          detalles = JSON.parse(funcion.plantilla.detalles);
        } else {
          detalles = funcion.plantilla.detalles;
        }
        console.log('✅ Detalles extraídos desde funcion.plantilla.detalles');
      } catch (e) {
        console.error('❌ Error parsing funcion.plantilla.detalles:', e);
        detalles = [];
      }
    }
    // PRIORIDAD 3: funcion.plantilla_entradas.detalles
    else if (funcion?.plantilla_entradas?.detalles) {
      source = 'funcion.plantilla_entradas.detalles';
      try {
        if (typeof funcion.plantilla_entradas.detalles === 'string') {
          detalles = JSON.parse(funcion.plantilla_entradas.detalles);
        } else {
          detalles = funcion.plantilla_entradas.detalles;
        }
        console.log('✅ Detalles extraídos desde funcion.plantilla_entradas.detalles');
      } catch (e) {
        console.error('❌ Error parsing funcion.plantilla_entradas.detalles:', e);
        detalles = [];
      }
    }

    console.log('📋 Detalles extraídos:', detalles);
    console.log('📋 Fuente:', source);

    return { detalles, source };
  }, []);

  const loadPriceOptions = useCallback(async () => {
    console.log('🚀 loadPriceOptions - INICIANDO');
    console.log('📋 selectedFuncion:', selectedFuncion);
    console.log('📋 selectedPlantilla:', selectedPlantilla);

    if (!selectedFuncion) {
      console.log('❌ No hay selectedFuncion');
      setPriceOptions([]);
      setDebugInfo({ error: 'No hay función seleccionada' });
      return;
    }

    setLoading(true);
    setDebugInfo({});

    try {
      // Extraer detalles de la plantilla
      const { detalles, source } = extractDetalles(selectedFuncion, selectedPlantilla);
      
      if (!Array.isArray(detalles) || detalles.length === 0) {
        console.log('❌ No hay detalles válidos en la plantilla');
        setPriceOptions([]);
        setDebugInfo({ 
          error: 'No hay detalles válidos en la plantilla',
          source,
          detalles: detalles
        });
        return;
      }

      // Obtener sala ID
      const salaId = selectedFuncion.sala?.id || selectedFuncion.sala_id || selectedFuncion.sala;
      console.log('🏢 Sala ID:', salaId);

      if (!salaId) {
        console.log('❌ No se pudo obtener el ID de la sala');
        setPriceOptions([]);
        setDebugInfo({ error: 'No se pudo obtener el ID de la sala' });
        return;
      }

      // Cargar entradas y zonas desde la BD
      console.log('📥 Cargando entradas y zonas desde BD...');
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

      if (!entradas || entradas.length === 0) {
        console.log('❌ No se pudieron cargar entradas');
        setPriceOptions([]);
        setDebugInfo({ error: 'No se pudieron cargar entradas', entradas, zonas });
        return;
      }

      if (!zonas || zonas.length === 0) {
        console.log('❌ No se pudieron cargar zonas');
        setPriceOptions([]);
        setDebugInfo({ error: 'No se pudieron cargar zonas', entradas, zonas });
        return;
      }

      // Crear mapas para búsqueda rápida
      const entradasById = new Map(entradas.map(e => [String(e.id), e]));
      const zonasById = new Map(zonas.map(z => [String(z.id), z]));

      console.log('🗺️ Mapa de entradas por ID:', Array.from(entradasById.keys()));
      console.log('🎯 Mapa de zonas por ID:', Array.from(zonasById.keys()));

      // Procesar detalles y agrupar por zona
      const zonasAgrupadas = new Map();
      let detallesProcesados = 0;
      let detallesConError = 0;

      detalles.forEach((detalle, index) => {
        console.log(`🔍 Procesando detalle ${index}:`, detalle);
        
        // Extraer campos con múltiples nombres posibles
        const zonaId = detalle.zonaId || detalle.zona_id || detalle.zona?.id || detalle.id_zona || detalle.idZona;
        const entradaId = detalle.entradaId || detalle.entrada_id || detalle.entrada?.id || detalle.id_entrada || detalle.idEntrada || detalle.productoId || detalle.producto_id;
        const precio = parseFloat(detalle.precio || detalle.price || detalle.monto || detalle.valor || 0);
        const comision = parseFloat(detalle.comision || detalle.fee || detalle.cargo || 0);

        console.log(`  - zonaId: ${zonaId}, entradaId: ${entradaId}, precio: ${precio}`);

        if (!zonaId || !entradaId) {
          console.log(`  ❌ Saltando - zonaId o entradaId faltante`);
          detallesConError++;
          return;
        }

        // Buscar zona y entrada en BD
        const zona = zonasById.get(String(zonaId));
        const entrada = entradasById.get(String(entradaId));

        if (!zona) {
          console.warn(`❌ Zona ${zonaId} no encontrada en BD`);
          detallesConError++;
          return;
        }

        if (!entrada) {
          console.warn(`❌ Entrada ${entradaId} no encontrada en BD`);
          detallesConError++;
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
          detallesProcesados++;
        } else {
          console.log(`  ⚠️ Entrada ${entradaId} ya existe en zona ${zonaId}`);
        }
      });

      console.log('🏗️ Zonas agrupadas:', zonasAgrupadas);
      console.log(`📊 Resumen: ${detallesProcesados} detalles procesados, ${detallesConError} con error`);

      // Convertir a array y calcular estadísticas
      const opciones = Array.from(zonasAgrupadas.values()).map(grupo => {
        // Calcular estadísticas de ocupación si hay mapa
        if (mapa) {
          const asientosZona = Object.values(mapa).filter(asiento => 
            String(asiento.zona_id) === String(grupo.zona.id) || String(asiento.zona) === String(grupo.zona.id)
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
      
      // Actualizar información de debug
      setDebugInfo({
        success: true,
        source,
        detallesProcesados,
        detallesConError,
        zonasEncontradas: opciones.length,
        salaId,
        entradasCargadas: entradas.length,
        zonasCargadas: zonas.length
      });

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
      setDebugInfo({ error: error.message || 'Error desconocido' });
      message.error('Error al cargar zonas y precios');
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion, selectedPlantilla, mapa, selectedZonaId, onPricesLoaded, extractDetalles]);

  // Cargar datos cuando cambie la función o plantilla
  useEffect(() => {
    if (selectedFuncion) {
      console.log('🔄 useEffect - selectedFuncion cambió, cargando datos...');
      loadPriceOptions();
    }
  }, [selectedFuncion, selectedPlantilla, loadPriceOptions]);

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

  return (
    <div className="space-y-3">
      {/* Información de Debug */}
      {debugInfo.error && (
        <Alert
          message="Error al cargar zonas"
          description={debugInfo.error}
          type="error"
          showIcon
          className="mb-3"
        />
      )}

      {debugInfo.success && (
        <Alert
          message="Zonas cargadas correctamente"
          description={`${debugInfo.zonasEncontradas} zonas encontradas, ${debugInfo.detallesProcesados} precios procesados`}
          type="success"
          showIcon
          className="mb-3"
        />
      )}

      {/* Barra de zonas */}
      <div className="flex items-center space-x-2 overflow-x-auto p-2 border rounded bg-white">
        {loading && (
          <div className="flex items-center space-x-2">
            <Spin size="small" />
            <span className="text-xs text-gray-500">Cargando zonas...</span>
          </div>
        )}

        {!loading && priceOptions.length === 0 && (
          <div className="text-xs text-gray-500 px-2 py-1">
            <div>No hay zonas configuradas en la plantilla</div>
            <div className="text-[10px] mt-1">
              Debug: {selectedFuncion ? 'Función seleccionada' : 'Sin función'} | 
              {selectedPlantilla ? 'Plantilla cargada' : 'Sin plantilla'} | 
              {selectedPlantilla?.detalles ? 'Con detalles' : 'Sin detalles'}
            </div>
            <button 
              onClick={() => {
                console.log('🔍 Debug - Datos actuales:');
                console.log('selectedFuncion:', selectedFuncion);
                console.log('selectedPlantilla:', selectedPlantilla);
                loadPriceOptions();
              }}
              className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              🔍 Debug - Recargar
            </button>
          </div>
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


