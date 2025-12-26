import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { supabase } from '../../supabaseClient';
import { fetchCanalesVenta } from '../../services/canalVentaService';

if (typeof document !== 'undefined' && document.getElementById('root')) {
  Modal.setAppElement('#root');
}

const PlantillaPrecios = () => {
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [zonas, setZonas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [detallesPrecios, setDetallesPrecios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [recinto, setRecinto] = useState(null);
  const [sala, setSala] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [canalesVenta, setCanalesVenta] = useState([]);

  /* ------------------------- CARGAR RECINTOS ------------------------- */
  useEffect(() => {
    const fetchRecintos = async () => {
      const { data, error } = await supabase.from('recintos').select('*, salas(*)');
      if (!error) {
        setRecintos(data || []);
      }
    };
    fetchRecintos();
  }, []);

  /* ------------------------- CARGAR PLANTILLAS DE PRECIOS ------------------------- */
  useEffect(() => {
    const fetchPlantillasPrecios = async () => {
      try {
        // Cargar plantillas principales
        const { data: plantillasData, error: plantillasError } = await supabase
          .from('plantillas')
          .select('*')
          .order('created_at', { ascending: false });

        if (plantillasError) {

        }

        // Cargar plantillas de precios específicas
        const { data: preciosData, error: preciosError } = await supabase
          .from('plantillas_precios')
          .select(`
            *,
            plantillas:plantilla_id(nombre, descripcion),
            zonas:zona_id(nombre, color),
            entradas:entrada_id(nombre_entrada, precio_base)
          `)
          .order('created_at', { ascending: false });

        if (preciosError) {

        }

        // Combinar datos
        const combinedPlantillas = (plantillasData || []).map(plantilla => ({
          ...plantilla,
          tipo: 'plantilla_principal',
          precios_detalle: (preciosData || []).filter(p => p.plantilla_id === plantilla.id)
        }));



        setPlantillas(combinedPlantillas);

      } catch (error) {

      }
    };

    fetchPlantillasPrecios();
  }, []);

  /* ------------------------- ACTUALIZAR SALAS ------------------------ */
  useEffect(() => {
    if (recinto) setSalas(recinto.salas || []);
  }, [recinto]);

  /* -------------------------- CARGAR ZONAS --------------------------- */
  useEffect(() => {
    if (!sala) return;
    const fetchZonas = async () => {
      const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', sala.id);
      if (!error) setZonas(data || []);
    };
    fetchZonas();
  }, [sala]);

  /* ------------------------- CARGAR ENTRADAS ------------------------- */
  useEffect(() => {
    if (!recinto) return;
    const fetchEntradas = async () => {
      try {
        // Usar la nueva función que filtra por tenant
        const { data, error } = await supabase
          .from('entradas')
          .select('*')
          .eq('recinto', recinto.id);

        if (error) {

          setEntradas([]);
          return;
        }


        if (data && data.length > 0) {
          const mapped = data.map(e => ({
            id: e.id,
            nombre: e.nombre_entrada,
            tipo: e.tipo_producto,
            tenant_id: e.tenant_id
          }));
          // Si se usa en otro lugar, podríamos setearlo; por ahora mantenemos data original
        }
        setEntradas(data || []);
      } catch (error) {

        setEntradas([]);
      }
    };
    fetchEntradas();
  }, [recinto]);

  /* ------------------------ CARGAR CANALES DE VENTA ------------------------ */
  useEffect(() => {
    const cargarCanales = async () => {
      try {
        const canales = await fetchCanalesVenta();
        setCanalesVenta(canales);

      } catch (error) {

        setCanalesVenta([]);
      }
    };
    cargarCanales();
  }, []);

  /* ------------------------ CARGAR PLANTILLAS ------------------------ */
  const cargarPlantillas = useCallback(async () => {
    if (!recinto || !sala) return;
    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .eq('recinto', recinto.id)
      .eq('sala', sala.id);

    const parsed = !error && Array.isArray(data)
      ? data.map(p => ({
        ...p,
        detalles: typeof p.detalles === 'string'
          ? JSON.parse(p.detalles)
          : Array.isArray(p.detalles)
            ? p.detalles
            : []
      }))
      : [];

    setPlantillas(parsed);
  }, [recinto, sala]);

  useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  // Recargar entradas cuando se abre el modal de edición
  useEffect(() => {
    if (modalIsOpen && editingPlantilla && (!entradas.length || !zonas.length)) {

      // Recargar entradas si no están disponibles
      if (!entradas.length && recinto) {
        const fetchEntradas = async () => {
          const { data, error } = await supabase.from('entradas').select('*').eq('recinto', recinto.id);
          setEntradas(!error ? data : []);
        };
        fetchEntradas();
      }
      // Recargar zonas si no están disponibles
      if (!zonas.length && sala) {
        const fetchZonas = async () => {
          const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', sala.id);
          setZonas(!error ? data : []);
        };
        fetchZonas();
      }
    }
  }, [modalIsOpen, editingPlantilla, entradas.length, zonas.length, recinto, sala]);

  /* -------------------- HANDLERS INPUTS DETALLE --------------------- */
  const handleInputChange = (zonaId, entradaId, field, value) => {


    const updated = [...detallesPrecios];
    const idx = updated.findIndex(d => d.zonaId === zonaId && d.entradaId === entradaId);

    // Determinar el tipo de valor y convertirlo apropiadamente
    const numeric = ['precio', 'comision', 'precioGeneral', 'orden'];
    let v;

    if (numeric.includes(field)) {
      // Para campos numéricos, convertir a número y establecer 0 si está vacío
      v = value === '' ? 0 : Number(value);
      if (isNaN(v)) v = 0;
      if (v < 0) v = 0;
    } else {
      // Para campos de texto, usar el valor tal como está
      v = value;
    }

    if (idx !== -1) {
      // Actualizar registro existente
      updated[idx] = { ...updated[idx], [field]: v };
    } else {
      // Crear nuevo registro
      updated.push({
        zonaId,
        entradaId,
        [field]: v,
        // Establecer valores por defecto para campos numéricos
        precio: field === 'precio' ? v : 0,
        comision: field === 'comision' ? v : 0,
        precioGeneral: field === 'precioGeneral' ? v : 0,
        orden: field === 'orden' ? v : 0,
        canales: field === 'canales' ? v : ''
      });
    }


    setDetallesPrecios(updated);
  };

  const handleCanalChange = (zonaId, entradaId, canalId, checked) => {


    setDetallesPrecios(prev => {
      const existing = prev.find(d => d.zonaId === zonaId && d.entradaId === entradaId);
      let canalesActuales = [];

      if (existing?.canales) {
        // Si canales es un string, convertirlo a array
        if (typeof existing.canales === 'string') {
          try {
            canalesActuales = JSON.parse(existing.canales);
          } catch {
            canalesActuales = [];
          }
        } else if (Array.isArray(existing.canales)) {
          canalesActuales = [...existing.canales];
        }
      }

      if (checked) {
        if (!canalesActuales.includes(canalId)) {
          canalesActuales.push(canalId);
        }
      } else {
        canalesActuales = canalesActuales.filter(id => id !== canalId);
      }

      if (existing) {
        return prev.map(d => d.zonaId === zonaId && d.entradaId === entradaId ? { ...d, canales: canalesActuales } : d);
      } else {
        return [...prev, { zonaId, entradaId, canales: canalesActuales }];
      }
    });
  };

  /* ----------------------- SUBMIT PLANTILLA ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que se haya ingresado un nombre
    if (!nombrePlantilla.trim()) {
      alert('Debe ingresar un nombre para la plantilla');
      return;
    }

    // Validar que se haya seleccionado recinto y sala
    if (!recinto || !sala) {
      alert('Debe seleccionar un recinto y una sala');
      return;
    }

    const detallesValidos = detallesPrecios.filter(d =>
      d.precio !== undefined &&
      d.precio !== null &&
      d.precio !== '' &&
      d.zonaId &&
      d.entradaId
    );

    if (!detallesValidos.length) {
      alert('Debe asignar al menos un precio válido');
      return;
    }

    // Validar que no se estén usando canales deshabilitados en el sistema
    const canalesDeshabilitados = [];
    detallesValidos.forEach(detalle => {
      if (detalle.canales) {
        let canalesSeleccionados = [];
        if (typeof detalle.canales === 'string') {
          try {
            canalesSeleccionados = JSON.parse(detalle.canales);
          } catch {
            canalesSeleccionados = [];
          }
        } else if (Array.isArray(detalle.canales)) {
          canalesSeleccionados = detalle.canales;
        }

        canalesSeleccionados.forEach(canalId => {
          const canal = canalesVenta.find(c => c.id === canalId);
          if (canal && !canal.activo) {
            canalesDeshabilitados.push({
              zona: zonas.find(z => z.id === detalle.zonaId)?.nombre || 'Zona desconocida',
              entrada: entradas.find(e => e.id === detalle.entradaId)?.producto || 'Entrada desconocida',
              canal: canal.nombre
            });
          }
        });
      }
    });

    if (canalesDeshabilitados.length > 0) {
      const mensaje = `No se puede guardar la plantilla. Los siguientes canales están deshabilitados en el sistema:\n\n${canalesDeshabilitados.map(item =>
        `• ${item.zona} - ${item.entrada}: ${item.canal}`
      ).join('\n')
        }\n\nLos canales deshabilitados en el sistema tienen prioridad sobre la configuración de la plantilla.`;
      alert(mensaje);
      return;
    }

    // Datos de la plantilla

    const payload = {
      nombre: nombrePlantilla.trim(),
      recinto: recinto.id,
      sala: sala.id,
      detalles: detallesValidos,
    };

    try {
      let res;
      if (editingPlantilla) {

        res = await supabase
          .from('plantillas')
          .update(payload)
          .eq('id', editingPlantilla.id)
          .select()
          .single();
      } else {

        res = await supabase
          .from('plantillas')
          .insert(payload)
          .select()
          .single();
      }

      if (res.error) {

        alert(`Error al guardar: ${res.error.message}`);
        return;
      }


      alert(`${editingPlantilla ? 'Plantilla actualizada' : 'Plantilla creada'} exitosamente con ${detallesValidos.length} configuraciones de precio`);
      closeModal();
      cargarPlantillas();
    } catch (error) {

      alert(`Error inesperado: ${error.message}`);
    }
  };

  /* ------------------------- EDITAR/ELIMINAR ------------------------ */
  const handleEditPlantilla = async (p) => {
    try {
      // Asegurar que tenemos las entradas cargadas antes de editar
      if (!entradas.length) {

        const { data: entradasData, error: entradasError } = await supabase
          .from('entradas')
          .select('*')
          .eq('recinto', recinto.id);

        if (!entradasError && entradasData) {
          setEntradas(entradasData);

        }
      }

      // Obtener la plantilla más actualizada desde la BD por si la consulta
      // inicial no incluye todos los campos de "detalles".
      const { data, error } = await supabase
        .from('plantillas')
        .select('*')
        .eq('id', p.id)
        .single();

      if (error) throw error;

      const plantilla = data || p;


      setEditingPlantilla(plantilla);
      setNombrePlantilla(plantilla.nombre);

      // Supabase puede retornar `null` si la plantilla no tiene detalles
      // También puede almacenarlos como texto JSON
      const parsedDetalles = typeof plantilla.detalles === 'string'
        ? JSON.parse(plantilla.detalles)
        : plantilla.detalles;



      // Asegurar que tenemos los detalles como array
      const detallesArray = Array.isArray(parsedDetalles) ? parsedDetalles : [];

      // Si estamos editando, inicializar con los detalles existentes
      // y agregar cualquier combinación zona-entrada que falte
      if (detallesArray.length > 0) {
        const existingDetalles = [...detallesArray];

        // Agregar combinaciones faltantes para zonas y entradas actuales
        zonas.forEach(zona => {
          entradas.forEach(entrada => {
            const exists = existingDetalles.find(d =>
              d.zonaId === zona.id && d.entradaId === entrada.id
            );
            if (!exists) {
              existingDetalles.push({
                zonaId: zona.id,
                entradaId: entrada.id,
                precio: 0,
                comision: 0,
                precioGeneral: 0,
                canales: '',
                orden: 0
              });
            }
          });
        });


        setDetallesPrecios(existingDetalles);
      } else {
        // Si no hay detalles, inicializar con todas las combinaciones
        const initialDetalles = zonas.flatMap(z =>
          entradas.map(e => ({
            zonaId: z.id,
            entradaId: e.id,
            precio: 0,
            comision: 0,
            precioGeneral: 0,
            canales: '',
            orden: 0
          }))
        );

        setDetallesPrecios(initialDetalles);
      }

      setModalIsOpen(true);
    } catch (err) {

    }
  };

  const handleDeletePlantilla = async (id) => {
    if (!window.confirm('¿Eliminar plantilla?')) return;
    const { error } = await supabase.from('plantillas').delete().eq('id', id);
    if (!error) setPlantillas(plantillas.filter(p => p.id !== id));
  };

  /* ------------------- UTILS PARA RENDER TABLA ---------------------- */
  const combinedItems = zonas.flatMap(z => entradas.map(e => ({
    zonaId: z.id,
    zona: z.nombre,
    entrada: e.producto,
    entradaId: e.id
  })));
  const currentItems = combinedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const closeModal = () => {
    setModalIsOpen(false);
    setEditingPlantilla(null);
    setNombrePlantilla('');
    setDetallesPrecios([]);
  };

  const openModal = () => {
    // Inicializar detalles con valores por defecto para todas las combinaciones zona-entrada
    const initialDetalles = zonas.flatMap(z =>
      entradas.map(e => ({
        zonaId: z.id,
        entradaId: e.id,
        precio: 0,
        comision: 0,
        precioGeneral: 0,
        canales: '',
        orden: 0
      }))
    );
    setDetallesPrecios(initialDetalles);
    setModalIsOpen(true);
  };

  const renderTableRows = () => {
    if (!zonas.length || !entradas.length) return (
      <tr>
        <td colSpan="8" className="py-4 text-center">
          {!zonas.length && !entradas.length ? 'Debes crear zonas y entradas' :
            !zonas.length ? 'Debes crear zonas' : 'Debes crear entradas'}
        </td>
      </tr>
    );

    // Debug: mostrar información de los datos


    // Si no hay currentItems, mostrar un mensaje
    if (!currentItems.length) {
      return (
        <tr>
          <td colSpan="8" className="py-4 text-center text-gray-500">
            No hay combinaciones zona-entrada disponibles
          </td>
        </tr>
      );
    }

    return currentItems.map((item, idx) => {
      const detalle = detallesPrecios.find(d => d.zonaId === item.zonaId && d.entradaId === item.entradaId) || {};

      // Buscar la entrada correspondiente para mostrar el nombre
      const entrada = entradas.find(e => e.id === item.entradaId);
      const zona = zonas.find(z => z.id === item.zonaId);


      return (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="px-6 py-3 font-medium">{zona?.nombre || item.zona || 'Zona no encontrada'}</td>
          <td className="px-6 py-3">
            <div>
              <div className="font-medium">{entrada?.nombre_entrada || entrada?.producto || item.entrada || 'Entrada no encontrada'}</div>
            </div>
          </td>
          {['precio', 'comision', 'precioGeneral'].map(f => (
            <td key={f} className="px-6 py-3">
              <input
                type="number"
                className="w-full border px-2 py-1 rounded"
                value={detalle[f] ?? ''}
                onChange={e => handleInputChange(item.zonaId, item.entradaId, f, e.target.value)}
                placeholder={f === 'precio' ? '0.00' : '0'}
                min="0"
                step={f === 'precio' ? '0.01' : '1'}
              />
            </td>
          ))}
          <td className="px-6 py-3">
            <div className="flex flex-wrap gap-1">
              {canalesVenta.map(canal => {
                // Determinar si el canal está seleccionado EN LA PLANTILLA
                let isSeleccionadoEnPlantilla = false;
                if (detalle.canales) {
                  if (typeof detalle.canales === 'string') {
                    try {
                      const canalesArray = JSON.parse(detalle.canales);
                      isSeleccionadoEnPlantilla = Array.isArray(canalesArray) && canalesArray.includes(canal.id);
                    } catch {
                      isSeleccionadoEnPlantilla = false;
                    }
                  } else if (Array.isArray(detalle.canales)) {
                    isSeleccionadoEnPlantilla = detalle.canales.includes(canal.id);
                  }
                }

                // VERIFICAR JERARQUÍA: Canal debe estar activo EN EL SISTEMA Y seleccionado EN LA PLANTILLA
                const isActivoEnSistema = canal.activo === true;
                const isActivo = isActivoEnSistema && isSeleccionadoEnPlantilla;

                // Debug: Log de la jerarquía de prioridades
                if (detalle.zonaId && detalle.entradaId) {
                  // debug omitido
                }

                // Determinar el color y estilo del botón según el estado
                const getButtonStyle = (activo, activoEnSistema, seleccionadoEnPlantilla) => {
                  if (!activoEnSistema) {
                    // Canal deshabilitado en el sistema (prioridad ALTA)
                    return "bg-red-100 hover:bg-red-200 text-red-700 border-red-300 cursor-not-allowed";
                  } else if (activo) {
                    // Canal activo en sistema Y seleccionado en plantilla
                    return "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-sm";
                  } else if (seleccionadoEnPlantilla) {
                    // Canal activo en sistema pero NO seleccionado en plantilla
                    return "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300";
                  } else {
                    // Canal activo en sistema pero NO seleccionado en plantilla
                    return "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300";
                  }
                };

                // Obtener el nombre corto del canal y el ícono
                const getCanalInfo = (nombre) => {
                  if (nombre.toLowerCase().includes('store') || nombre.toLowerCase().includes('internet')) {
                    return { short: 'Store', icon: '🛒' };
                  } else if (nombre.toLowerCase().includes('test')) {
                    return { short: 'Test', icon: '🧪' };
                  } else if (nombre.toLowerCase().includes('backoffice') || nombre.toLowerCase().includes('dashboard')) {
                    return { short: 'Dashboard', icon: '⚙️' };
                  }
                  return { short: nombre, icon: '🔗' };
                };

                const canalInfo = getCanalInfo(canal.nombre);

                return (
                  <button
                    key={canal.id}
                    type="button"
                    onClick={() => isActivoEnSistema ? handleCanalChange(item.zonaId, item.entradaId, canal.id, !isSeleccionadoEnPlantilla) : null}
                    disabled={!isActivoEnSistema}
                    className={`px-2 py-1 rounded text-xs font-medium border transition-all duration-200 flex items-center gap-1 min-w-[60px] justify-center ${getButtonStyle(isActivo, isActivoEnSistema, isSeleccionadoEnPlantilla)}`}
                    title={(() => {
                      if (!isActivoEnSistema) {
                        return `${canal.nombre} está deshabilitado en el sistema (prioridad ALTA)`;
                      } else if (isActivo) {
                        return `Desactivar ${canal.nombre} en esta plantilla`;
                      } else {
                        return `Activar ${canal.nombre} en esta plantilla`;
                      }
                    })()}
                  >
                    <span className="text-xs">{canalInfo.icon}</span>
                    <span className="text-xs">
                      {!isActivoEnSistema ? '🚫' : (isActivo ? '✓' : '○')}
                    </span>
                  </button>
                );
              })}
            </div>
          </td>
          <td className="px-6 py-3">
            <div className="flex items-center gap-2">
              {(() => {
                // Calcular el estado considerando la JERARQUÍA de prioridades
                let canalesDisponibles = 0;
                let canalesSeleccionados = 0;
                let totalCanales = canalesVenta.length;

                // Contar canales activos en el sistema
                const canalesActivosEnSistema = canalesVenta.filter(c => c.activo === true);
                canalesDisponibles = canalesActivosEnSistema.length;

                // Contar canales seleccionados en la plantilla
                if (detalle.canales) {
                  if (typeof detalle.canales === 'string') {
                    try {
                      const canalesArray = JSON.parse(detalle.canales);
                      canalesSeleccionados = Array.isArray(canalesArray) ? canalesArray.length : 0;
                    } catch {
                      canalesSeleccionados = 0;
                    }
                  } else if (Array.isArray(detalle.canales)) {
                    canalesSeleccionados = detalle.canales.length;
                  }
                }

                // Calcular porcentaje basado en canales DISPONIBLES (no total)
                const porcentajeDisponibles = canalesDisponibles > 0 ? Math.round((canalesSeleccionados / canalesDisponibles) * 100) : 0;

                let estadoColor = 'bg-red-100 text-red-800 border-red-200';
                let estadoTexto = 'Sin canales';
                let estadoIcono = '🚫';

                if (canalesDisponibles === 0) {
                  // No hay canales activos en el sistema
                  estadoColor = 'bg-red-100 text-red-800 border-red-200';
                  estadoTexto = 'Sistema sin canales';
                  estadoIcono = '🚫';
                } else if (porcentajeDisponibles === 100) {
                  // Todos los canales disponibles están seleccionados
                  estadoColor = 'bg-green-100 text-green-800 border-green-200';
                  estadoTexto = '100% activos';
                  estadoIcono = '✅';
                } else if (porcentajeDisponibles > 50) {
                  // Más de la mitad de canales disponibles están seleccionados
                  estadoColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  estadoTexto = `${porcentajeDisponibles}% activos`;
                  estadoIcono = '⚠️';
                } else if (porcentajeDisponibles > 0) {
                  // Menos de la mitad de canales disponibles están seleccionados
                  estadoColor = 'bg-orange-100 text-orange-800 border-orange-200';
                  estadoTexto = `${porcentajeDisponibles}% activos`;
                  estadoIcono = '🔶';
                } else {
                  // Ningún canal disponible está seleccionado
                  estadoColor = 'bg-red-100 text-red-800 border-red-200';
                  estadoTexto = '0% activos';
                  estadoIcono = '❌';
                }

                return (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${estadoColor}`}>
                      {estadoIcono} {estadoTexto}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({canalesSeleccionados}/{canalesDisponibles})
                    </span>
                  </div>
                );
              })()}
            </div>
          </td>
          <td className="px-6 py-3">
            <input
              type="number"
              className="w-full border px-2 py-1 rounded"
              value={detalle.orden ?? ''}
              onChange={e => handleInputChange(item.zonaId, item.entradaId, 'orden', e.target.value)}
              placeholder="1"
              min="0"
            />
          </td>

        </tr>
      );
    });
  };

  /* ------------------------------ UI ------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plantillas de Precios</h1>
            <p className="text-lg text-gray-600">
              Gestiona los precios base, comisiones y canales para tus eventos
            </p>
          </div>
        </div>

        {/* Selectores de Recinto y Sala */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Selector Recinto */}
              <div className="w-full">
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Seleccionar Recinto *
                </label>
                <select
                  value={recinto?.id || ''}
                  onChange={e => {
                    const r = recintos.find(r => String(r.id) === e.target.value);
                    setRecinto(r);
                    setSala(null);
                  }}
                  className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="" disabled style={{ color: '#999' }}>Seleccionar Recinto</option>
                  {recintos.map(r => (
                    <option key={r.id} value={r.id} style={{ color: '#333' }}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector Sala */}
              {recinto && (
                <div className="w-full">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Seleccionar Sala *
                  </label>
                  <select
                    value={sala?.id || ''}
                    onChange={e => setSala(salas.find(s => String(s.id) === e.target.value))}
                    className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="" disabled style={{ color: '#999' }}>Seleccionar Sala</option>
                    {salas.map(s => (
                      <option key={s.id} value={s.id} style={{ color: '#333' }}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Acción: Añadir Plantilla */}
            {recinto && sala && (
              <div className="flex items-center gap-3 flex-shrink-0 mt-4 lg:mt-0 lg:self-end">
                <button
                  onClick={openModal}
                  disabled={!recinto || !sala}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm transition-all duration-200 font-semibold flex items-center justify-center gap-2 whitespace-nowrap min-h-[48px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir Plantilla
                </button>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          {(!recinto || !sala) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Instrucciones</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Selecciona un <strong>Recinto</strong></li>
                  <li>Selecciona una <strong>Sala</strong></li>
                  <li>Crea o edita las plantillas de precios disponibles</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Listado de Plantillas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Plantillas Guardadas</h3>
          </div>

          {!plantillas.length ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 text-base">
                {recinto && sala
                  ? 'No hay plantillas creadas para esta sala. Crea una nueva para comenzar.'
                  : 'Selecciona un recinto y una sala para ver las plantillas.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plantillas.map(p => (
                <div key={p.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:text-blue-700 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.666V14h-6v-3.334H5V18h14v-7.334h-2.143zM6 7H5v3.334h1V7zm12 0h-1v3.334h1V7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {p.detalles?.length || 0} Zonas
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{p.nombre}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {p.descripcion || 'Sin descripción'}
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleEditPlantilla(p)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePlantilla(p.id)}
                        className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal" overlayClassName="modal-overlay">
        <div className="bg-white p-6 rounded shadow max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{editingPlantilla ? 'Editar' : 'Crear'} Plantilla</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" className="border p-2 w-full" placeholder="Nombre" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)} required />

            {/* Información de debug y resumen de canales */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Total de combinaciones zona-entrada:</span> {combinedItems.length}
                </div>
                <div>
                  <span className="font-medium">Detalles configurados:</span> {detallesPrecios.length}
                </div>
                <div>
                  <span className="font-medium">Detalles con precio:</span> {detallesPrecios.filter(d => d.precio > 0).length}
                </div>
                <div>
                  <span className="font-medium">Canales disponibles:</span> {canalesVenta.length}
                </div>
              </div>

              {/* Resumen de canales */}
              {canalesVenta.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="font-medium mb-2">Resumen de canales:</div>

                  <div className="flex flex-wrap gap-2">
                    {canalesVenta.map(canal => {
                      const canalInfo = (() => {
                        if (canal.nombre.toLowerCase().includes('store') || canal.nombre.toLowerCase().includes('internet')) {
                          return { short: 'Store', icon: '🛒' };
                        } else if (canal.nombre.toLowerCase().includes('test')) {
                          return { short: 'Test', icon: '🧪' };
                        } else if (canal.nombre.toLowerCase().includes('backoffice') || canal.nombre.toLowerCase().includes('dashboard')) {
                          return { short: 'Dashboard', icon: '⚙️' };
                        }
                        return { short: canal.nombre, icon: '🔗' };
                      })();

                      const estadoColor = canal.activo
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200';
                      const estadoIcono = canal.activo ? '✅' : '🚫';
                      const estadoTexto = canal.activo ? 'Activo' : 'Inactivo';

                      return (
                        <span key={canal.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${estadoColor}`}>
                          <span>{canalInfo.icon}</span>
                          <span>{canalInfo.short}</span>
                          <span className="font-medium">{estadoIcono} {estadoTexto}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Resumen de estado del sistema */}
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Estado del sistema:</span> {
                      canalesVenta.filter(c => c.activo).length === 0
                        ? '🚫 Sin canales activos'
                        : `${canalesVenta.filter(c => c.activo).length}/${canalesVenta.length} canales activos`
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Zona', 'Entrada', 'Precio', 'Comisión', 'Precio Gen', 'Canales', 'Estado', 'Orden'].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="border px-4 py-2" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingPlantilla ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </Modal>

      <style>{`
        .modal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:1200px;background:transparent;border:none;outline:none;}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:1000}
      `}</style>
    </div>
  );
};

export default PlantillaPrecios;
