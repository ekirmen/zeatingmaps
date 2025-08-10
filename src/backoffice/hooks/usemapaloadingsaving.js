import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { message } from 'antd';
import realtimeService from '../services/realtimeService';
import { saveMapa, fetchMapa } from '../services/apibackoffice';
import { syncSeatsForSala } from '../services/apibackoffice';

export const useMapaLoadingSaving = () => {
  const { salaId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const lastSavedElements = useRef(null); // Referencia para evitar recargas innecesarias

  // Configurar Realtime usando Edge Functions
  useEffect(() => {
    if (!salaId) return;

    console.log('[RealtimeService] Configurando suscripción para sala:', salaId);

    // Suscribirse a cambios usando el servicio personalizado
    realtimeService.subscribeToSala(salaId, (updatedData) => {
      console.log('[RealtimeService] Cambio detectado en mapas:', updatedData);
      
      // Solo procesar si no es nuestro propio cambio
      if (updatedData && updatedData.updated_at !== lastSavedAt) {
        console.log('[RealtimeService] Cambio externo detectado, considerando recarga...');
        // Aquí podrías implementar la lógica para recargar el mapa
        // Por ahora, solo notificamos el cambio
        message.info('El mapa ha sido actualizado por otro usuario');
      }
    });

    // Cleanup al desmontar
    return () => {
      console.log('[RealtimeService] Desuscribiendo de sala:', salaId);
      realtimeService.unsubscribeFromSala(salaId);
    };
  }, [salaId, lastSavedAt]);

  const transformarParaGuardar = (elements) => {
    console.log('[transformarParaGuardar] Elementos recibidos:', elements);
    
    const mesas = elements.filter(el => el.type === 'mesa');
    console.log('[transformarParaGuardar] Mesas encontradas:', mesas.length);
    
    const contenido = mesas.map(mesa => {
      console.log('[transformarParaGuardar] Procesando mesa:', mesa);
      
      const sillas = elements
        .filter(el => el.type === 'silla' && el.parentId === mesa._id)
        .map(silla => ({
          _id: silla._id,
          nombre: silla.nombre || '',
          posicion: silla.posicion || { x: 0, y: 0 },
          width: silla.width || 20,
          height: silla.height || 20,
          zona: silla.zonaId || silla.zona?.id || null,
          estado: silla.estado || 'disponible'
        }));
      
      console.log('[transformarParaGuardar] Sillas de la mesa:', sillas.length);
      
      return {
        _id: mesa._id,
        nombre: mesa.nombre || '',
        posicion: mesa.posicion || { x: 0, y: 0 },
        width: mesa.width || 100,
        height: mesa.height || 100,
        radius: mesa.radius || null,
        shape: mesa.shape || 'rect',
        zona: mesa.zonaId || mesa.zona?.id || null,
        sillas: sillas
      };
    });

    console.log('[transformarParaGuardar] Contenido final:', contenido);
    return contenido;
  };

  const loadMapa = useCallback(async (salaId, setElements, setZones) => {
    if (!salaId) return;
    
    console.log('[loadMapa] Cargando mapa para sala:', salaId);
    setIsLoading(true);
    
    try {
      const data = await fetchMapa(salaId);
      console.log('[loadMapa] Datos recibidos:', data);
      
      if (!data || !data.contenido) {
        console.log('[loadMapa] No hay datos de mapa, inicializando vacío');
        setElements([]);
        setZones([]);
        return;
      }

      // Cargar zonas si no están disponibles
      let zonasCargadas = data.zonas || [];
      if (zonasCargadas.length === 0) {
        try {
          const zonasResponse = await fetch(`/api/zonas?salaId=${salaId}`);
          if (zonasResponse.ok) {
            zonasCargadas = await zonasResponse.json();
          }
        } catch (error) {
          console.warn('[loadMapa] Error cargando zonas:', error);
        }
      }

      // Transformar elementos del mapa
      const elementosCrudos = (data.contenido || []).reduce((acc, mesa) => {
        // Create mesa with all necessary properties
        const mesaConZona = {
          ...mesa,
          type: 'mesa',
          shape: mesa.shape || (mesa.radius ? 'circle' : 'rect'),
          radius: mesa.radius || mesa.width / 2,
          width: mesa.width || mesa.radius * 2,
          height: mesa.height || mesa.radius * 2,
          posicion: mesa.posicion || { x: 0, y: 0 },
          zona: ['string', 'number'].includes(typeof mesa.zona)
            ? zonasCargadas.find(z => z.id === mesa.zona)
            : mesa.zona,
          zonaId: ['string', 'number'].includes(typeof mesa.zona)
            ? mesa.zona
            : mesa.zona?.id || null,
        };

        // Transform sillas array
        const sillas = (mesa.sillas || []).map(silla => ({
          ...silla,
          type: 'silla',
          parentId: mesa._id,
          width: silla.width || 20,
          height: silla.height || 20,
          nombre: silla.nombre || '',
          label: silla.nombre || '',      // Add label for display
          labelPlacement: 'top',          // Position label above chair
          labelStyle: {
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '5px'
          },
          zona: ['string', 'number'].includes(typeof silla.zona)
            ? zonasCargadas.find(z => z.id === silla.zona)
            : silla.zona,
          zonaId: ['string', 'number'].includes(typeof silla.zona)
            ? silla.zona
            : silla.zona?.id || null,
        }));

        return [...acc, mesaConZona, ...sillas];
      }, []);

      console.log('[loadMapa] Elementos transformados:', elementosCrudos.length);
      
      // Guardar referencia de los elementos cargados para evitar recargas innecesarias
      lastSavedElements.current = JSON.stringify(elementosCrudos);
      
      setZones(zonasCargadas);
      setElements(elementosCrudos);
    } catch (error) {
      console.error('Error al cargar el mapa:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async (salaId, elements, zones) => {
    if (!salaId || !elements) {
      console.error('[handleSave] Datos insuficientes para guardar');
      return;
    }

    // Verificar si realmente hay cambios que guardar
    const currentElementsString = JSON.stringify(elements);
    if (lastSavedElements.current === currentElementsString) {
      console.log('[handleSave] No hay cambios que guardar, saltando guardado');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[handleSave] Iniciando guardado para sala:', salaId);
      
      const dataToSave = {
        contenido: transformarParaGuardar(elements),
        zonas: zones || []
      };
      
      console.log('[handleSave] Datos a guardar:', dataToSave);
      
      await saveMapa(salaId, dataToSave);
      
      // Sincronizar seats después de guardar el mapa
      await syncSeatsForSala(salaId);
      
      const now = new Date().toISOString();
      setLastSavedAt(now);
      
      // Actualizar referencia de elementos guardados
      lastSavedElements.current = currentElementsString;
      
      // Notificar el cambio a otros clientes usando el servicio de Realtime
      await realtimeService.notifyChange(salaId, {
        action: 'mapa_updated',
        timestamp: now,
        salaId: salaId
      });
      
      console.log('[handleSave] Mapa guardado correctamente');
      message.success('Mapa guardado correctamente');
      
    } catch (error) {
      console.error('[handleSave] Error al guardar:', error);
      message.error('Error al guardar el mapa');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    isLoading,
    isSaving,
    lastSavedAt,
    loadMapa,
    handleSave,
    transformarParaGuardar
  };
};
