import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchAbonosByUser, createAbono } from '../../services/abonoService';
import { fetchEventos as fetchEventosSupabase } from '../../services/supabaseEventoService';
import LazySeatingMap from '../../components/LazySeatingMap';
import { useMapData } from './CompBoleteria/hooks/useMapData';

const Abonos = () => {
  const [userId, setUserId] = useState('');
  const [seatId, setSeatId] = useState('');
  const [selectedSeatLabel, setSelectedSeatLabel] = useState('');
  const [packageType, setPackageType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [abonos, setAbonos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedFuncionId, setSelectedFuncionId] = useState('');
  const [seatError, setSeatError] = useState('');

  const selectedEvent = useMemo(() => {
    return eventos.find(e => `${e.id}` === `${selectedEventId}`) || null;
  }, [eventos, selectedEventId]);

  const selectedFuncion = useMemo(() => {
    const funcion = funciones.find(f => `${f.id || f._id}` === `${selectedFuncionId}`);
    if (!funcion) return null;
    return {
      ...funcion,
      sala: funcion.sala || funcion.sala_id || funcion.salaId || selectedEvent?.sala || selectedEvent?.sala_id || null,
    };
  }, [funciones, selectedFuncionId, selectedEvent]);

  const { mapa } = useMapData(selectedFuncion);

  useEffect(() => {
    const loadEventos = async () => {
      try {
        const data = await fetchEventosSupabase();
        setEventos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando eventos', err);
        setEventos([]);
      }
    };

    loadEventos();
  }, []);

  useEffect(() => {
    const loadFunciones = async () => {
      setFunciones([]);
      setSelectedFuncionId('');
      if (!selectedEventId) return;

      try {
        const { data, error } = await supabase
          .from('funciones')
          .select('*')
          .eq('evento_id', selectedEventId)
          .order('fecha_celebracion', { ascending: true });

        if (error) throw error;
        setFunciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando funciones', err);
        setFunciones([]);
      }
    };

    loadFunciones();
  }, [selectedEventId]);

  useEffect(() => {
    setSeatId('');
    setSelectedSeatLabel('');
    setSeatError('');
  }, [selectedFuncionId]);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setAbonos([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const data = await fetchAbonosByUser(userId, token);
        setAbonos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading abonos', err);
        setAbonos([]);
      }
    };
    load();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!seatId) {
      setSeatError('Selecciona un asiento en el mapa antes de crear el abono');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await createAbono(
        {
          usuario_id: userId,
          seat_id: seatId,
          package_type: packageType,
          start_date: startDate,
          end_date: endDate,
        },
        token,
      );
      setSeatId('');
      setSelectedSeatLabel('');
      setPackageType('');
      setStartDate('');
      setEndDate('');
      const data = await fetchAbonosByUser(userId, token);
      setAbonos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Create abono error', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestión de Abonos</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 space-y-4 mb-6">
        <div>
          <label className="block mb-1">Usuario ID</label>
          <input className="border p-2 w-full" value={userId} onChange={e => setUserId(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Evento</label>
          <select
            className="border p-2 w-full"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            <option value="">Selecciona un evento</option>
            {eventos.map(evento => (
              <option key={evento.id} value={evento.id}>{evento.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Función</label>
          <select
            className="border p-2 w-full"
            value={selectedFuncionId}
            onChange={e => setSelectedFuncionId(e.target.value)}
            disabled={!selectedEventId}
          >
            <option value="">Selecciona una función</option>
            {funciones.map(funcion => (
              <option key={funcion.id} value={funcion.id}>
                {new Date(funcion.fecha_celebracion).toLocaleString('es-ES')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Asiento seleccionado</label>
          <div className="border p-3 rounded bg-gray-50 text-sm">
            {seatId ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selectedSeatLabel || seatId}</div>
                  <div className="text-gray-500">ID: {seatId}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSeatId('');
                    setSelectedSeatLabel('');
                  }}
                  className="text-blue-600 text-sm"
                >
                  Limpiar selección
                </button>
              </div>
            ) : (
              <span className="text-gray-500">Selecciona un asiento desde el mapa</span>
            )}
          </div>
          {seatError && <p className="text-red-600 text-sm mt-1">{seatError}</p>}
        </div>
        <div>
          <label className="block mb-1">Tipo de Paquete</label>
          <input className="border p-2 w-full" value={packageType} onChange={e => setPackageType(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Fecha Inicio</label>
          <input type="date" className="border p-2 w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Fecha Fin</label>
          <input type="date" className="border p-2 w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Crear Abono</button>
      </form>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Mapa de asientos</h3>
        {selectedFuncion ? (
          mapa ? (
            <div className="border rounded overflow-hidden">
              <LazySeatingMap
                funcionId={selectedFuncion.id || selectedFuncion._id}
                mapa={mapa}
                zonas={mapa?.zonas || []}
                onSeatToggle={(seat) => {
                  const selectedId = seat?._id || seat?.id;
                  if (!selectedId) return;
                  setSeatId(selectedId);
                  setSelectedSeatLabel(seat?.nombre || seat?.label || seat?.displayName || 'Asiento seleccionado');
                  setSeatError('');
                }}
                onSeatError={msg => setSeatError(msg || '')}
                selectedSeats={seatId ? [seatId] : []}
                modoVenta={false}
              />
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Cargando mapa...</div>
          )
        ) : (
          <div className="text-gray-500 text-sm">Selecciona un evento y una función para ver el mapa.</div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">Abonos del Usuario</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Seat</th>
            <th className="py-2 px-4 text-left">Tipo</th>
            <th className="py-2 px-4 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {abonos.map(a => (
            <tr key={a._id} className="border-t">
              <td className="py-2 px-4">{a.seat?.nombre || a.seat}</td>
              <td className="py-2 px-4">{a.packageType}</td>
              <td className="py-2 px-4">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Abonos;
