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
  const [funciones, setFunciones] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingFuncion, setEditingFuncion] = useState(null);
  const [nuevaFuncion, setNuevaFuncion] = useState({
    fechaCelebracion: '',
    plantilla: '',
    inicioVenta: '',
    finVenta: '',
    pagoAPlazos: false,
    permitirReservasWeb: false,
  });

  const getEventoNombre = (eventoId) => {
    // Buscar en la lista de eventos cargados
    const evento = eventos.find((e) => e.id === eventoId);
    if (evento) return evento.nombre;
    
    // Si no está en la lista, mostrar el ID del evento
    return eventoId ? `Evento ${eventoId}` : 'Evento desconocido';
  };

  const getPlantillaNombre = (plantillaId) => {
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    return plantilla ? plantilla.nombre : 'Plantilla eliminada';
  };

  const formatFecha = (date) => {
    return formatDateString(date);
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
        evento,
        sala(*),
        plantilla(*)
      `);

    // Si hay un evento seleccionado, filtrar por ese evento
    if (eventoSeleccionado) {
      const eventoId = eventoSeleccionado?.id || eventoSeleccionado?._id || eventoSeleccionado;
      console.log('Filtrando por evento:', eventoId);
      query = query.eq('evento', eventoId);
    }
    // Si hay una sala seleccionada, filtrar por esa sala
    else if (salaSeleccionada) {
      query = query.eq('sala', salaSeleccionada.id);
    }
    // Si hay un recinto seleccionado, filtrar por las salas de ese recinto
    else if (recintoSeleccionado) {
      const salaIds = recintoSeleccionado.salas.map(s => s.id);
      query = query.in('sala', salaIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener funciones:', error);
      console.error('Query details:', {
        recintoSeleccionado: recintoSeleccionado?.id,
        salaSeleccionada: salaSeleccionada?.id,
        eventoSeleccionado: eventoSeleccionado
      });
    } else {
      console.log('Funciones cargadas:', data?.length || 0);
      console.log('Primera función:', data?.[0]);
      setFunciones(data || []);
    }
  }, [eventoSeleccionado, salaSeleccionada, recintoSeleccionado]);

  useEffect(() => {
    fetchFunciones();
  }, [fetchFunciones]);

    // Cargar todas las funciones al inicio si no hay filtros
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
            evento,
            sala(*),
            plantilla(*)
          `);

        if (error) {
          console.error('Error al obtener todas las funciones:', error);
        } else {
          console.log('Todas las funciones cargadas:', data?.length || 0);
          setFunciones(data || []);
        }
      };

      fetchAllFunciones();
    }
  }, [recintoSeleccionado, salaSeleccionada, eventoSeleccionado]);
  

  useEffect(() => {
    const fetchPlantillas = async () => {
      if (recintoSeleccionado && salaSeleccionada) {
        const { data, error } = await supabase
          .from('plantillas')
          .select('*')
          .eq('recinto', recintoSeleccionado.id)
          .eq('sala', salaSeleccionada.id);

        if (error) {
          console.error('Error al obtener plantillas:', error);
        } else {
          setPlantillas(data);
        }
      }
    };

    fetchPlantillas();
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Destructuring para evitar warnings de variables no utilizadas
    // const { evento, sala, plantilla } = nuevaFuncion;
    const funcionData = {
      fecha_celebracion: nuevaFuncion.fechaCelebracion,
      inicio_venta: nuevaFuncion.inicioVenta,
      fin_venta: nuevaFuncion.finVenta,
      pago_a_plazos: nuevaFuncion.pagoAPlazos,
      permitir_reservas_web: nuevaFuncion.permitirReservasWeb,
      evento: eventoSeleccionado,
      sala: salaSeleccionada.id,
      plantilla: nuevaFuncion.plantilla,
    };
  
    try {
      // Intentar obtener el usuario autenticado, pero no fallar si no está disponible
      let creadopor = null;
      try {
        const {
          data: userData,
          error: userError
        } = await supabase.auth.getUser();
  
        if (!userError && userData?.user?.id) {
          creadopor = userData.user.id;
        }
      } catch (authError) {
        console.warn('No se pudo obtener el usuario autenticado:', authError);
        // Continuar sin el usuario autenticado
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
  
      // limpiar
      setModalIsOpen(false);
      setEditingFuncion(null);
      setNuevaFuncion({
        fechaCelebracion: '',
        plantilla: '',
        inicioVenta: '',
        finVenta: '',
        pagoAPlazos: false,
        permitirReservasWeb: false,
      });
  
                 // Recargar las funciones con los filtros actuales
         fetchFunciones();
    } catch (error) {
      console.error('Error al guardar función:', error);
      alert('Ocurrió un error');
    }
  };
  

  const handleEdit = (funcion) => {
    setEditingFuncion(funcion);
    setNuevaFuncion({
      fechaCelebracion: funcion.fechaCelebracion?.split('T')[0] || '',
      plantilla: funcion.plantilla || '',
      inicioVenta: funcion.inicioVenta?.split('T')[0] || '',
      finVenta: funcion.finVenta?.split('T')[0] || '',
      pagoAPlazos: funcion.pagoAPlazos || false,
      permitirReservasWeb: funcion.permitirReservasWeb || false,
    });
    setModalIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta función?')) return;

    const { error } = await supabase.from('funciones').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar');
    } else {
             // Recargar las funciones con los filtros actuales
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
             // Recargar las funciones con los filtros actuales
       fetchFunciones();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Gestión de Funciones</h2>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col">
          <label>Recinto</label>
          <select
            value={recintoSeleccionado ? recintoSeleccionado.id : ''}
            onChange={(e) => {
              const recinto = recintos.find(r => String(r.id) === e.target.value);
              setRecintoSeleccionado(recinto);
              setSalaSeleccionada(null);
            }}
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
          <div className="flex flex-col">
            <label>Sala</label>
            <select
              value={salaSeleccionada ? salaSeleccionada.id : ''}
              onChange={(e) => {
                const sala = recintoSeleccionado.salas.find(s => String(s.id) === e.target.value);
                setSalaSeleccionada(sala);
              }}
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

        {!salaSeleccionada && (
          <p className="text-sm text-gray-600">
            Seleccione un recinto y una sala para filtrar las funciones, o deje sin seleccionar para ver todas las funciones
          </p>
        )}

        {salaSeleccionada && (
          <div className="flex flex-col">
            <label>Evento</label>
            <select
              value={eventoSeleccionado || ''}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar Evento</option>
              {eventos.map(evento => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>
            {eventos.length === 0 && (
              <span className="text-sm text-gray-500 mt-1">
                No hay eventos para la sala seleccionada
              </span>
            )}
          </div>
        )}

        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setModalIsOpen(true)}>
          Nueva Función
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th>Fecha Celebración</th>
            <th>Evento</th>
            <th>Sala</th>
            <th>Plantilla</th>
            <th>Inicio Venta</th>
            <th>Fin Venta</th>
            <th>Pago a plazos</th>
            <th>Reservas web</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {funciones.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500">
                {recintoSeleccionado || salaSeleccionada || eventoSeleccionado 
                  ? 'No se encontraron funciones con los filtros seleccionados'
                  : 'No hay funciones creadas. Crea una nueva función para comenzar.'
                }
              </td>
            </tr>
          ) : (
            funciones.map(funcion => (
              <tr key={funcion.id}>
                <td>{formatFecha(funcion.fechaCelebracion)}</td>
                <td>{getEventoNombre(funcion.evento)}</td>
                <td>{funcion.sala?.nombre || 'Sala desconocida'}</td>
                <td>{getPlantillaNombre(funcion.plantilla)}</td>
                <td>{formatFecha(funcion.inicioVenta)}</td>
                <td>{formatFecha(funcion.finVenta)}</td>
                <td>{funcion.pagoAPlazos ? 'Sí' : 'No'}</td>
                <td>{funcion.permitirReservasWeb ? 'Sí' : 'No'}</td>
                <td className="space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => handleEdit(funcion)}>
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(funcion.id)}>
                    Eliminar
                  </button>
                  <button className="text-gray-600 hover:underline" onClick={() => handleDuplicate(funcion.id)}>
                    Duplicar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setEditingFuncion(null);
          setNuevaFuncion({
            fechaCelebracion: '',
            plantilla: '',
            inicioVenta: '',
            finVenta: '',
            pagoAPlazos: false,
            permitirReservasWeb: false,
          });
        }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          {editingFuncion ? 'Editar Función' : 'Nueva Función'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label>Fecha Celebración</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.fechaCelebracion}
              onChange={(e) =>
                setNuevaFuncion({ ...nuevaFuncion, fechaCelebracion: e.target.value })
              }
              required
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label>Plantilla</label>
            <select
              className="border rounded p-2"
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

          <div className="flex flex-col space-y-1">
            <label>Inicio Venta</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.inicioVenta}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, inicioVenta: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label>Fin Venta</label>
            <input
              type="date"
              className="border rounded p-2"
              value={nuevaFuncion.finVenta}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, finVenta: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevaFuncion.pagoAPlazos}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, pagoAPlazos: e.target.checked })}
            />
            <label>Pago a plazos</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevaFuncion.permitirReservasWeb}
              onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, permitirReservasWeb: e.target.checked })}
            />
            <label>Permite reservas a clientes web</label>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="text-red-600 hover:underline" onClick={() => setModalIsOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
              {editingFuncion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Funciones;
