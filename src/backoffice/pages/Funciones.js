import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { useRecinto } from '../contexts/RecintoContext';
import { supabase } from '../../supabaseClient';
import { syncSeatsForSala } from '../services/apibackoffice';
import formatDateString from '../../utils/formatDateString';

const Funciones = () => {
  const { recintoSeleccionado, salaSeleccionada, setRecintoSeleccionado, setSalaSeleccionada, recintos } = useRecinto();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillasComisiones, setPlantillasComisiones] = useState([]);
  const [plantillasProductos, setPlantillasProductos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingFuncion, setEditingFuncion] = useState(null);
  const [nuevaFuncion, setNuevaFuncion] = useState({
    fechaCelebracion: '',
    plantilla: '',
    plantillaComisiones: '',
    plantillaProducto: '',
    inicioVenta: '',
    finVenta: '',
    pagoAPlazos: false,
    permitirReservasWeb: false,
    tiempoCaducidadReservas: -120, // 2 horas por defecto
  });

  const getEventoNombre = (eventoId) => {
    const evento = eventos.find((e) => e.id === eventoId);
    if (evento) return evento.nombre;
    return eventoId ? `Evento ${eventoId}` : 'Evento desconocido';
  };

  const getPlantillaNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const getPlantillaComisionesNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillasComisiones.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const getPlantillaProductoNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillasProductos.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const formatFecha = (date) => {
    return formatDateString(date);
  };

  const getTiempoCaducidadText = (minutos) => {
    if (minutos === 0) return 'En la fecha de celebración';
    if (minutos < 0) {
      const horas = Math.abs(minutos) / 60;
      const dias = horas / 24;
      if (dias >= 1) return `${Math.floor(dias)} días`;
      if (horas >= 1) return `${Math.floor(horas)} horas`;
      return `${Math.abs(minutos)} minutos`;
    } else {
      const horas = minutos / 60;
      const dias = horas / 24;
      if (dias >= 1) return `${Math.floor(dias)} días`;
      if (horas >= 1) return `${Math.floor(horas)} horas`;
      return `${minutos} minutos`;
    }
  };

  // Fetch eventos when sala changes
  useEffect(() => {
    const fetchEventos = async () => {
      if (salaSeleccionada && recintoSeleccionado) {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('recinto', recintoSeleccionado.id)
          .eq('sala', salaSeleccionada.id);

        if (error) {
          console.error('Error al obtener eventos:', error);
        } else {
          setEventos(data);
          setEventoSeleccionado(null);
        }
      } else {
        setEventos([]);
      }
    };

    fetchEventos();
  }, [recintoSeleccionado, salaSeleccionada]);

  const fetchFunciones = useCallback(async () => {
    let query = supabase
      .from('funciones')
      .select(`
        id,
        fechaCelebracion:fecha_celebracion,
        inicioVenta:inicio_venta,
        finVenta:fin_venta,
        pagoAPlazos:pago_a_plazos,
        permitirReservasWeb:permitir_reservas_web,
        tiempoCaducidadReservas:tiempo_caducidad_reservas,
        fechaLiberacionReservas:fecha_liberacion_reservas,
        evento,
        sala(*),
        plantilla(*),
        plantillaComisiones:plantilla_comisiones(*),
        plantillaProducto:plantilla_producto(*)
      `);

    if (eventoSeleccionado) {
      const eventoId = eventoSeleccionado?.id || eventoSeleccionado?._id || eventoSeleccionado;
      query = query.eq('evento', eventoId);
    } else if (salaSeleccionada) {
      query = query.eq('sala', salaSeleccionada.id);
    } else if (recintoSeleccionado) {
      const salaIds = recintoSeleccionado.salas.map(s => s.id);
      query = query.in('sala', salaIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener funciones:', error);
    } else {
      setFunciones(data || []);
    }
  }, [eventoSeleccionado, salaSeleccionada, recintoSeleccionado]);

  useEffect(() => {
    fetchFunciones();
  }, [fetchFunciones]);

  useEffect(() => {
    if (!recintoSeleccionado && !salaSeleccionada && !eventoSeleccionado) {
      const fetchAllFunciones = async () => {
        const { data, error } = await supabase
          .from('funciones')
          .select(`
            id,
            fechaCelebracion:fecha_celebracion,
            inicioVenta:inicio_venta,
            finVenta:fin_venta,
            pagoAPlazos:pago_a_plazos,
            permitirReservasWeb:permitir_reservas_web,
            tiempoCaducidadReservas:tiempo_caducidad_reservas,
            fechaLiberacionReservas:fecha_liberacion_reservas,
            evento,
            sala(*),
            plantilla(*),
            plantillaComisiones:plantilla_comisiones(*),
            plantillaProducto:plantilla_producto(*)
          `);

        if (error) {
          console.error('Error al obtener todas las funciones:', error);
        } else {
          setFunciones(data || []);
        }
      };

      fetchAllFunciones();
    }
  }, [recintoSeleccionado, salaSeleccionada, eventoSeleccionado]);

  useEffect(() => {
    const fetchPlantillas = async () => {
      const { data, error } = await supabase
        .from('plantillas')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas:', error);
      } else {
        setPlantillas(data || []);
      }
    };

    fetchPlantillas();
  }, []);

  useEffect(() => {
    const fetchPlantillasComisiones = async () => {
      const { data, error } = await supabase
        .from('plantillas_comisiones')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas de comisiones:', error);
      } else {
        setPlantillasComisiones(data || []);
      }
    };

    fetchPlantillasComisiones();
  }, []);

  useEffect(() => {
    const fetchPlantillasProductos = async () => {
      const { data, error } = await supabase
        .from('plantillas_productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas de productos:', error);
      } else {
        setPlantillasProductos(data || []);
      }
    };

    fetchPlantillasProductos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calcular fecha de liberación de reservas
    let fechaLiberacionReservas = null;
    if (nuevaFuncion.fechaCelebracion && nuevaFuncion.tiempoCaducidadReservas !== null) {
      const fechaCelebracion = new Date(nuevaFuncion.fechaCelebracion);
      const minutos = nuevaFuncion.tiempoCaducidadReservas;
      fechaLiberacionReservas = new Date(fechaCelebracion.getTime() + (minutos * 60 * 1000));
    }

    const funcionData = {
      fecha_celebracion: nuevaFuncion.fechaCelebracion,
      inicio_venta: nuevaFuncion.inicioVenta,
      fin_venta: nuevaFuncion.finVenta,
      pago_a_plazos: nuevaFuncion.pagoAPlazos,
      permitir_reservas_web: nuevaFuncion.permitirReservasWeb,
      tiempo_caducidad_reservas: nuevaFuncion.tiempoCaducidadReservas,
      fecha_liberacion_reservas: fechaLiberacionReservas,
      evento: eventoSeleccionado,
      sala: salaSeleccionada.id,
      plantilla: nuevaFuncion.plantilla,
      plantilla_comisiones: nuevaFuncion.plantillaComisiones || null,
      plantilla_producto: nuevaFuncion.plantillaProducto || null,
    };

    try {
      let creadopor = null;
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData?.user?.id) {
          creadopor = userData.user.id;
        }
      } catch (authError) {
        console.warn('No se pudo obtener el usuario autenticado:', authError);
      }

      if (editingFuncion) {
        const { error } = await supabase
          .from('funciones')
          .update(funcionData)
          .eq('id', editingFuncion.id);

        if (error) throw error;
        alert('Función actualizada');
        if (salaSeleccionada?.id) {
          await syncSeatsForSala(salaSeleccionada.id);
        }
      } else {
        const insertData = { ...funcionData };
        if (creadopor) {
          insertData.creadopor = creadopor;
        }

        const { error } = await supabase.from('funciones').insert([insertData]);
        if (error) throw error;
        alert('Función creada');
        if (salaSeleccionada?.id) {
          await syncSeatsForSala(salaSeleccionada.id);
        }
      }

      setModalIsOpen(false);
      setEditingFuncion(null);
      fetchFunciones();
    } catch (error) {
      console.error('Error al guardar función:', error);
      alert('Ocurrió un error');
    }
  };

  const handleEdit = (funcion) => {
    setEditingFuncion(funcion);

    let plantillaId = '';
    if (funcion.plantilla) {
      if (typeof funcion.plantilla === 'object' && funcion.plantilla.id) {
        plantillaId = funcion.plantilla.id;
      } else {
        plantillaId = funcion.plantilla;
      }
    }

    let plantillaComisionesId = '';
    if (funcion.plantillaComisiones) {
      if (typeof funcion.plantillaComisiones === 'object' && funcion.plantillaComisiones.id) {
        plantillaComisionesId = funcion.plantillaComisiones.id;
      } else {
        plantillaComisionesId = funcion.plantillaComisiones;
      }
    }

    let plantillaProductoId = '';
    if (funcion.plantillaProducto) {
      if (typeof funcion.plantillaProducto === 'object' && funcion.plantillaProducto.id) {
        plantillaProductoId = funcion.plantillaProducto.id;
      } else {
        plantillaProductoId = funcion.plantillaProducto;
      }
    }

    setNuevaFuncion({
      fechaCelebracion: funcion.fechaCelebracion?.split('T')[0] || '',
      plantilla: plantillaId,
      plantillaComisiones: plantillaComisionesId,
      plantillaProducto: plantillaProductoId,
      inicioVenta: funcion.inicioVenta?.split('T')[0] || '',
      finVenta: funcion.finVenta?.split('T')[0] || '',
      pagoAPlazos: funcion.pagoAPlazos || false,
      permitirReservasWeb: funcion.permitirReservasWeb || false,
      tiempoCaducidadReservas: funcion.tiempoCaducidadReservas || -120,
    });
    setModalIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta función?')) return;

    const { error } = await supabase.from('funciones').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar');
    } else {
      fetchFunciones();
    }
  };

  const handleDuplicate = async (id) => {
    const { data, error } = await supabase.from('funciones').select('*').eq('id', id).single();
    if (error || !data) {
      alert('No se pudo duplicar');
      return;
    }

    const { id: _, ...duplicatedData } = data;
    const { error: insertError } = await supabase.from('funciones').insert([duplicatedData]);
    if (insertError) {
      alert('Error al duplicar');
    } else {
      if (duplicatedData.sala) {
        await syncSeatsForSala(duplicatedData.sala);
      }
      fetchFunciones();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Funciones</h1>
                <p className="text-sm text-gray-600 mt-1">Administra las funciones de tus eventos</p>
              </div>
              <button 
                onClick={() => {
                  setEditingFuncion(null);
                  setNuevaFuncion({
                    fechaCelebracion: '',
                    plantilla: '',
                    plantillaComisiones: '',
                    plantillaProducto: '',
                    inicioVenta: '',
                    finVenta: '',
                    pagoAPlazos: false,
                    permitirReservasWeb: false,
                    tiempoCaducidadReservas: -120,
                  });
                  setModalIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + Nueva Función
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recinto</label>
                <select
                  value={recintoSeleccionado ? recintoSeleccionado.id : ''}
                  onChange={(e) => {
                    const recinto = recintos.find(r => String(r.id) === e.target.value);
                    setRecintoSeleccionado(recinto);
                    setSalaSeleccionada(null);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Recinto</option>
                  {recintos.map(recinto => (
                    <option key={recinto.id} value={recinto.id}>
                      {recinto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {recintoSeleccionado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <select
                    value={salaSeleccionada ? salaSeleccionada.id : ''}
                    onChange={(e) => {
                      const sala = recintoSeleccionado.salas.find(s => String(s.id) === e.target.value);
                      setSalaSeleccionada(sala);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Sala</option>
                    {recintoSeleccionado.salas.map(sala => (
                      <option key={sala.id} value={sala.id}>
                        {sala.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {salaSeleccionada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                  <select
                    value={eventoSeleccionado || ''}
                    onChange={(e) => setEventoSeleccionado(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Evento</option>
                    {eventos.map(evento => (
                      <option key={evento.id} value={evento.id}>
                        {evento.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setRecintoSeleccionado(null);
                    setSalaSeleccionada(null);
                    setEventoSeleccionado(null);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Celebración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sala
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Precios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Comisiones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liberación Reservas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funciones.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                      {recintoSeleccionado || salaSeleccionada || eventoSeleccionado 
                        ? 'No se encontraron funciones con los filtros seleccionados'
                        : 'No hay funciones creadas. Crea una nueva función para comenzar.'
                      }
                    </td>
                  </tr>
                ) : (
                  funciones.map(funcion => (
                    <tr key={funcion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.fechaCelebracion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEventoNombre(funcion.evento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {funcion.sala?.nombre || 'Sala desconocida'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaNombre(funcion.plantilla)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaComisionesNombre(funcion.plantillaComisiones)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaProductoNombre(funcion.plantillaProducto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.inicioVenta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.finVenta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {funcion.tiempoCaducidadReservas !== null 
                          ? getTiempoCaducidadText(funcion.tiempoCaducidadReservas)
                          : 'No configurado'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {funcion.pagoAPlazos && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pago a plazos
                            </span>
                          )}
                          {funcion.permitirReservasWeb && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Reservas web
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(funcion)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(funcion.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Eliminar
                          </button>
                          <button 
                            onClick={() => handleDuplicate(funcion.id)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Duplicar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setEditingFuncion(null);
        }}
        className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {editingFuncion ? 'Editar Función' : 'Nueva Función'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Celebración *
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.fechaCelebracion}
                  onChange={(e) =>
                    setNuevaFuncion({ ...nuevaFuncion, fechaCelebracion: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inicio Venta *
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.inicioVenta}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, inicioVenta: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fin Venta *
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.finVenta}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, finVenta: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Precios *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.plantilla}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, plantilla: e.target.value })}
                  required
                >
                  <option value="">Seleccionar Plantilla</option>
                  {plantillas.map(plantilla => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Comisiones
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.plantillaComisiones}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, plantillaComisiones: e.target.value })}
                >
                  <option value="">Seleccionar Plantilla</option>
                  {plantillasComisiones.map(plantilla => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Producto
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaFuncion.plantillaProducto}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, plantillaProducto: e.target.value })}
                >
                  <option value="">Seleccionar Plantilla</option>
                  {plantillasProductos.map(plantilla => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha de liberación de reservas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de liberación de reservas
                <span className="ml-1 text-gray-500">
                  <i className="fas fa-question-circle" title="Tiempo antes o después de la fecha de celebración para liberar reservas"></i>
                </span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={nuevaFuncion.tiempoCaducidadReservas}
                onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, tiempoCaducidadReservas: parseInt(e.target.value) })}
                required
              >
                <optgroup label="Antes de la fecha de celebración">
                  <option value="0">En la fecha de celebración</option>
                  <option value="-5">5 minutos</option>
                  <option value="-10">10 minutos</option>
                  <option value="-15">15 minutos</option>
                  <option value="-30">30 minutos</option>
                  <option value="-45">45 minutos</option>
                  <option value="-60">60 minutos</option>
                  <option value="-90">90 minutos</option>
                  <option value="-120">2 horas</option>
                  <option value="-180">3 horas</option>
                  <option value="-240">4 horas</option>
                  <option value="-360">6 horas</option>
                  <option value="-480">8 horas</option>
                  <option value="-720">12 horas</option>
                  <option value="-1440">1 día</option>
                  <option value="-2880">2 días</option>
                  <option value="-4320">3 días</option>
                  <option value="-5760">4 días</option>
                  <option value="-7200">5 días</option>
                  <option value="-10080">7 días</option>
                  <option value="-14400">10 días</option>
                  <option value="-28800">20 días</option>
                </optgroup>
                <optgroup label="Después de la fecha de compra">
                  <option value="1440">1 día</option>
                  <option value="2880">2 días</option>
                  <option value="4320">3 días</option>
                  <option value="5760">4 días</option>
                  <option value="7200">5 días</option>
                  <option value="10080">7 días</option>
                  <option value="14400">10 días</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pagoAPlazos"
                  checked={nuevaFuncion.pagoAPlazos}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, pagoAPlazos: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pagoAPlazos" className="ml-2 block text-sm text-gray-900">
                  Pago a plazos
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="permitirReservasWeb"
                  checked={nuevaFuncion.permitirReservasWeb}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, permitirReservasWeb: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="permitirReservasWeb" className="ml-2 block text-sm text-gray-900">
                  Permite reservas a clientes web
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => setModalIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingFuncion ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Funciones;
