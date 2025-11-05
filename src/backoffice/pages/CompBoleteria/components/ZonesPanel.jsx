import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Button, Typography, Spin, Tag, message, Alert } from 'antd';
import { supabase } from '../../../../supabaseClient';
import logger from '../../../../utils/logger';

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
  // Safety check for required props
  if (typeof onSelectPrice !== 'function') {
    onSelectPrice = () => {};
  }
  if (typeof onSelectZona !== 'function') {
    onSelectZona = () => {};
  }

  const [loading, setLoading] = useState(false);
  const [priceOptions, setPriceOptions] = useState([]);
  const [activeZonaId, setActiveZonaId] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Función para extraer detalles de la plantilla
  const extractDetalles = useCallback((funcion, plantilla) => {
    logger.log('🔍 extractDetalles - Iniciando extracción...');
    // Debug logs removed for production performance

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
        logger.log('✅ Detalles extraídos desde selectedPlantilla.detalles');
      } catch (e) {
        logger.error('❌ Error parsing selectedPlantilla.detalles:', e);
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
        logger.log('✅ Detalles extraídos desde funcion.plantilla.detalles');
      } catch (e) {
        logger.error('❌ Error parsing funcion.plantilla.detalles:', e);
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
        logger.log('✅ Detalles extraídos desde funcion.plantilla_entradas.detalles');
      } catch (e) {
        logger.error('❌ Error parsing funcion.plantilla_entradas.detalles:', e);
        detalles = [];
      }
    }

    logger.log('📋 Detalles extraídos:', detalles?.length || 0);
    logger.log('📋 Fuente:', source);

    return { detalles, source };
  }, []);

  const loadPriceOptions = useCallback(async () => {
    logger.log('🚀 loadPriceOptions - INICIANDO');
    // Debug logs removed for production performance

    if (!selectedFuncion) {
      logger.log('❌ No hay selectedFuncion');
      setPriceOptions([]);
      setDebugInfo({ error: 'No hay función seleccionada' });
      return;
    }

    setLoading(true);
    setDebugInfo({});

    try {
      // Extraer detalles de la plantilla
      const { detalles, source } = extractDetalles(selectedFuncion, selectedPlantilla);
      
      logger.log('📋 Detalles extraídos:', detalles?.length || 0);
      logger.log('📋 Fuente de detalles:', source);
      
      if (!Array.isArray(detalles) || detalles.length === 0) {
        logger.log('❌ No hay detalles válidos en la plantilla');
        setPriceOptions([]);
        setDebugInfo({ 
          error: 'No hay detalles válidos en la plantilla',
          source,
          detalles: detalles,
          selectedPlantilla: selectedPlantilla,
          selectedFuncionPlantilla: selectedFuncion.plantilla
        });
        return;
      }

      // Obtener sala ID
      const salaId = selectedFuncion.sala?.id || selectedFuncion.sala_id || selectedFuncion.sala;
      logger.log('🏢 Sala ID:', salaId);

      if (!salaId) {
        logger.log('❌ No se pudo obtener el ID de la sala');
        setPriceOptions([]);
        setDebugInfo({ error: 'No se pudo obtener el ID de la sala' });
        return;
      }

      // Cargar entradas y zonas desde la BD
      logger.log('📥 Cargando entradas y zonas desde BD...');
      
      // Consulta de entradas
      const entradasQuery = supabase.from('entradas').select('*').order('nombre_entrada');
      // Debug log removed for production performance
      
      // Consulta de zonas con más logging
      const zonasQuery = supabase
        .from('zonas')
        .select('*')
        .eq('sala_id', String(salaId))
        .order('nombre');
      
      // Debug logs removed for production performance

      const [{ data: entradas, error: entradasError }, { data: zonas, error: zonasError }] = await Promise.all([
        entradasQuery,
        zonasQuery,
      ]);

      logger.log('📦 Resultado entradas:', { data: entradas?.length || 0, error: entradasError });
      logger.log('🎯 Resultado zonas:', { data: zonas?.length || 0, error: zonasError });

      if (entradasError) {
        logger.error('❌ Error cargando entradas:', entradasError);
        setPriceOptions([]);
        setDebugInfo({ error: `Error cargando entradas: ${entradasError.message}` });
        return;
      }

      if (zonasError) {
        logger.error('❌ Error cargando zonas:', zonasError);
        setPriceOptions([]);
        setDebugInfo({ error: `Error cargando zonas: ${zonasError.message}` });
        return;
      }

      logger.log('✅ Consultas exitosas - Entradas:', entradas?.length || 0, 'Zonas:', zonas?.length || 0);

      if (!entradas || entradas.length === 0) {
        logger.log('❌ No se pudieron cargar entradas');
        setPriceOptions([]);
        setDebugInfo({ error: 'No se pudieron cargar entradas', entradas, zonas });
        return;
      }

      if (!zonas || zonas.length === 0) {
        logger.log('❌ No se pudieron cargar zonas');
        logger.log('🔍 Intentando consulta alternativa...');
        
        // Intentar consulta alternativa sin filtros
        try {
          const { data: todasLasZonas, error: errorTodas } = await supabase
            .from('zonas')
            .select('*')
            .order('nombre');
          
          logger.log('🔍 Todas las zonas en la BD:', todasLasZonas?.length || 0);
          logger.log('🔍 Error consulta alternativa:', errorTodas);
          
          if (todasLasZonas && todasLasZonas.length > 0) {
            logger.log('🔍 Zonas disponibles en la BD:', todasLasZonas?.length || 0);
          }
        } catch (e) {
          logger.error('❌ Error en consulta alternativa:', e);
        }
        
        setPriceOptions([]);
        setDebugInfo({ 
          error: 'No se pudieron cargar zonas', 
          salaId,
          entradas, 
          zonas,
          sugerencia: 'Verificar que la sala tenga zonas asignadas o que el campo sala_id/sala en la tabla zonas sea correcto'
        });
        return;
      }

      // Crear mapas para búsqueda rápida
      const entradasById = new Map(entradas.map(e => [String(e.id), e]));
      const zonasById = new Map(zonas.map(z => [String(z.id), z]));

      logger.log('🗺️ Mapa de entradas por ID:', Array.from(entradasById.keys()).length);
      logger.log('🎯 Mapa de zonas por ID:', Array.from(zonasById.keys()).length);

      // Procesar detalles y agrupar por zona
      const zonasAgrupadas = new Map();
      let detallesProcesados = 0;
      let detallesConError = 0;

      detalles.forEach((detalle, index) => {
        logger.log(`🔍 Procesando detalle ${index}`);
        
        // Validar que detalle no sea null/undefined
        if (!detalle || typeof detalle !== 'object') {
          logger.warn(`❌ Detalle ${index} es null/undefined o no es un objeto`);
          detallesConError++;
          return;
        }
        
        // Extraer campos con múltiples nombres posibles
        const zonaId = detalle.zonaId || detalle.zona_id || detalle.zona?.id || detalle.id_zona || detalle.idZona;
        const entradaId = detalle.entradaId || detalle.entrada_id || detalle.entrada?.id || detalle.id_entrada || detalle.idEntrada || detalle.productoId || detalle.producto_id;
        const precio = parseFloat(detalle.precio || detalle.price || detalle.monto || detalle.valor || 0);
        const comision = parseFloat(detalle.comision || detalle.fee || detalle.cargo || 0);

        logger.log(`  - zonaId: ${zonaId}, entradaId: ${entradaId}, precio: ${precio}`);

        if (!zonaId || !entradaId) {
          logger.log(`  ❌ Saltando - zonaId o entradaId faltante`);
          detallesConError++;
          return;
        }

        // Buscar zona y entrada en BD
        const zona = zonasById.get(String(zonaId));
        const entrada = entradasById.get(String(entradaId));

        if (!zona) {
          logger.warn(`❌ Zona ${zonaId} no encontrada en BD`);
          detallesConError++;
          return;
        }

        if (!entrada) {
          logger.warn(`❌ Entrada ${entradaId} no encontrada en BD`);
          detallesConError++;
          return;
        }

        // Validar que zona y entrada tengan las propiedades necesarias
        if (!zona.nombre) {
          logger.warn(`❌ Zona ${zonaId} no tiene nombre`);
          detallesConError++;
          return;
        }

        if (!entrada.nombre_entrada) {
          logger.warn(`❌ Entrada ${entradaId} no tiene nombre_entrada`);
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
          logger.log(`  ✅ Precio agregado a zona ${zonaId}`);
          detallesProcesados++;
        } else {
          logger.log(`  ⚠️ Entrada ${entradaId} ya existe en zona ${zonaId}`);
        }
      });

      logger.log('🏗️ Zonas agrupadas:', zonasAgrupadas?.length || 0);
      logger.log(`📊 Resumen: ${detallesProcesados} detalles procesados, ${detallesConError} con error`);

      // Convertir a array y calcular estadísticas
      const opciones = Array.from(zonasAgrupadas.values()).map(grupo => {
        // Calcular estadísticas de ocupación si hay mapa
        if (mapa) {
          const asientosZona = Object.values(mapa).filter(asiento => 
            String(asiento.zona_id) === String(grupo.zona.id)
          );
          
          grupo.total = asientosZona.length;
          grupo.vendidos = asientosZona.filter(a => a.estado === 'vendido' || a.estado === 'reservado').length;
          grupo.reservados = asientosZona.filter(a => a.estado === 'reservado').length;
          grupo.ocupacion = grupo.total > 0 ? Math.round((grupo.vendidos / grupo.total) * 100) : 0;
        }

        return grupo;
      });

      logger.log('🎯 Opciones de precio finales:', opciones?.length || 0);
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

      logger.log('✅ loadPriceOptions completado exitosamente');

    } catch (error) {
      logger.error('💥 Error cargando opciones de precio:', error);
      setPriceOptions([]);
      setDebugInfo({ error: error.message || 'Error desconocido' });
      message.error('Error al cargar zonas y precios');
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion, selectedPlantilla, onPricesLoaded, extractDetalles]); // Removido mapa y selectedZonaId

  // Cargar datos cuando cambie la función o plantilla
  useEffect(() => {
    if (selectedFuncion && !dataLoaded) {
      setDataLoaded(true);
      loadPriceOptions();
    }
  }, [selectedFuncion, selectedPlantilla, dataLoaded]); // Solo se ejecuta una vez

  // Resetear dataLoaded cuando cambie la función para permitir recarga
  useEffect(() => {
    if (selectedFuncion) {
      setDataLoaded(false);
    }
  }, [selectedFuncion?.id]); // Solo cuando cambie el ID de la función

  // Sync external selectedZonaId → internal activeZonaId
  useEffect(() => {
    if (selectedZonaId && selectedZonaId !== activeZonaId) {
      if (priceOptions.find(o => o.zona.id === selectedZonaId)) {
        setActiveZonaId(selectedZonaId);
      }
    }
  }, [selectedZonaId, activeZonaId, priceOptions]);

  // Actualizar estadísticas cuando cambie el mapa (sin recargar todo)
  useEffect(() => {
    if (mapa && priceOptions.length > 0) {
      logger.log('🔄 Mapa cambió, actualizando estadísticas...');
      const opcionesActualizadas = priceOptions.map(grupo => {
        // Calcular estadísticas de ocupación si hay mapa
        const asientosZona = Object.values(mapa).filter(asiento => 
          String(asiento.zona_id) === String(grupo.zona.id)
        );
        
        grupo.total = asientosZona.length;
        grupo.vendidos = asientosZona.filter(a => a.estado === 'vendido' || a.estado === 'reservado').length;
        grupo.reservados = asientosZona.filter(a => a.estado === 'reservado').length;
        grupo.ocupacion = grupo.total > 0 ? Math.round((grupo.vendidos / grupo.total) * 100) : 0;
        
        return grupo;
      });
      
      setPriceOptions([...opcionesActualizadas]);
    }
  }, [mapa]); // Solo depende del mapa

  const activeZona = activeZonaId ? priceOptions.find(o => o.zona.id === activeZonaId) : null;

  if (!selectedFuncion) return null;

  return (
    <div className="space-y-3">
      {/* Información de Debug */}
      {debugInfo.error && (
        <Alert
          message="Error al cargar zonas"
          description={
            <div>
              <div className="mb-2">{debugInfo.error}</div>
              {debugInfo.salaId && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Sala ID:</strong> {debugInfo.salaId}
                </div>
              )}
              {debugInfo.sugerencia && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Sugerencia:</strong> {debugInfo.sugerencia}
                </div>
              )}
              {debugInfo.entradas && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Entradas cargadas:</strong> {Array.isArray(debugInfo.entradas) ? debugInfo.entradas.length : 'Error'}
                </div>
              )}
              {debugInfo.zonas && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Zonas cargadas:</strong> {Array.isArray(debugInfo.zonas) ? debugInfo.zonas.length : 'Error'}
                </div>
              )}
            </div>
          }
          type="error"
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

        {!loading && priceOptions.length === 0 && !debugInfo.error && (
          <div className="text-xs text-gray-500 px-2 py-1">
            <div>No hay zonas configuradas en la plantilla</div>
            <div className="text-[10px] mt-1">
              Debug: {selectedFuncion ? 'Función seleccionada' : 'Sin función'} | 
              {selectedPlantilla ? 'Plantilla cargada' : 'Sin plantilla'} | 
              {selectedPlantilla?.detalles ? 'Con detalles' : 'Sin detalles'}
            </div>
            <button 
              onClick={() => {
                logger.log('🔍 Debug - Datos actuales');
                setDataLoaded(false); // Resetear para permitir recarga
                loadPriceOptions();
              }}
              className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              🔍 Debug - Recargar
            </button>
            
            <button 
              onClick={async () => {
                logger.log('🔍 Debug - Probar consultas de BD...');
                const salaId = selectedFuncion.sala?.id || selectedFuncion.sala_id || selectedFuncion.sala;
                logger.log('🏢 Sala ID:', salaId);
                
                // Probar consulta de entradas
                const { data: entradas, error: entradasError } = await supabase
                  .from('entradas')
                  .select('*')
                  .order('nombre_entrada');
                logger.log('📦 Entradas (sin filtro):', { data: entradas?.length || 0, error: entradasError });
                
                // Probar consulta de zonas sin filtro
                const { data: zonas, error: zonasError } = await supabase
                  .from('zonas')
                  .select('*')
                  .order('nombre');
                logger.log('🎯 Zonas (sin filtro):', { data: zonas?.length || 0, error: zonasError });
                
                // Probar consulta de zonas con filtro
                if (salaId) {
                  const { data: zonasFiltradas, error: zonasFiltradasError } = await supabase
                    .from('zonas')
                    .select('*')
                    .eq('sala_id', String(salaId))
                    .order('nombre');
                  logger.log('🎯 Zonas filtradas por sala:', { data: zonasFiltradas?.length || 0, error: zonasFiltradasError });
                }
              }}
              className="mt-2 ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            >
              🗄️ Debug - Consultas BD
            </button>
          </div>
        )}

        {!loading && priceOptions.length > 0 && (
          priceOptions.map((zonaData) => (
            <div
              key={zonaData.zona.id}
              className={`px-3 py-2 rounded cursor-pointer whitespace-nowrap border ${
                activeZonaId === zonaData.zona.id ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => {
                setActiveZonaId(zonaData.zona.id);
                if (typeof onSelectZona === 'function') {
                  onSelectZona(zonaData.zona.id);
                } else {
                  logger.error('onSelectZona is not a function:', typeof onSelectZona);
                }
              }}
            >
              <div className="text-xs font-semibold" style={{ color: zonaData.zona.color || '#333' }}>
                {zonaData.zona.nombre}
              </div>
              <div className="text-[10px] text-gray-500">Ocupación: {zonaData.ocupacion || 0}%</div>
            </div>
          ))
        )}
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
            {activeZona.precios
              .filter((opt) => opt && opt.entrada && opt.entrada.nombre_entrada && activeZona.zona && activeZona.zona.nombre)
              .map((opt) => {
                return (
                  <div
                    key={opt.id}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-50 ${
                      selectedPriceId === opt.id ? 'bg-purple-50 ring-1 ring-purple-300' : ''
                    }`}
                    onClick={() => {
                      if (typeof onSelectPrice === 'function') {
                        onSelectPrice(opt);
                      } else {
                        logger.error('onSelectPrice is not a function:', typeof onSelectPrice);
                      }
                    }}
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
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesPanel;


