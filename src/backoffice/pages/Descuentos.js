import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [maxUsos, setMaxUsos] = useState('');
  const [eventos, setEventos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [zoneDetails, setZoneDetails] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDescuentos();
    fetchEventos();
  }, []);

  const fetchDescuentos = async () => {
    const { data, error } = await supabase.from('descuentos').select('*, evento:eventos (nombre), detalles:detalles_descuento (*, zona:zona (nombre))');
    if (error) return console.error('Error al cargar descuentos:', error);
    setDescuentos(data);
  };

  const fetchEventos = async () => {
    const { data, error } = await supabase.from('eventos').select('*');
    if (error) return console.error('Error al cargar eventos:', error);
    setEventos(data);
  };

  useEffect(() => {
    const loadZonas = async () => {
      if (!eventoId) return setZonas([]);
      const { data: evento } = await supabase.from('eventos').select('sala').eq('id', eventoId).single();
      if (evento?.sala) {
        const { data, error } = await supabase.from('zonas').select('*').eq('sala', evento.sala);
        if (!error) setZonas(data);
      }
    };
    loadZonas();
  }, [eventoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const detalles = Object.entries(zoneDetails).map(([zonaId, det]) => ({ zona: zonaId, tipo: det.tipo, valor: Number(det.cantidad) }));
    const dto = {
      nombreCodigo: codigo,
      fechaInicio,
      fechaFinal,
      evento: eventoId,
      maxUsos: maxUsos ? Number(maxUsos) : 0,
    };
    
    if (editingId) {
      const { error } = await supabase.from('descuentos').update(dto).eq('id', editingId);
      if (!error) {
        await supabase.from('detalles_descuento').delete().eq('descuento', editingId);
        await supabase.from('detalles_descuento').insert(detalles.map(d => ({ ...d, descuento: editingId })));
        fetchDescuentos();
        resetForm();
        alert('Descuento actualizado');
      }
    } else {
      const { data, error } = await supabase.from('descuentos').insert([dto]).select().single();
      if (!error && data) {
        await supabase.from('detalles_descuento').insert(detalles.map(d => ({ ...d, descuento: data.id })));
        fetchDescuentos();
        resetForm();
        alert('Descuento creado');
      }
    }
  };

  const resetForm = () => {
    setCodigo('');
    setFechaInicio('');
    setFechaFinal('');
    setEventoId('');
    setMaxUsos('');
    setZoneDetails({});
    setEditingId(null);
  };

  const handleEdit = (d) => {
    setCodigo(d.nombreCodigo);
    setFechaInicio(d.fechaInicio?.slice(0, 10));
    setFechaFinal(d.fechaFinal?.slice(0, 10));
    setEventoId(d.evento?.id || d.evento);
    setMaxUsos(d.maxUsos ?? '');
    const detalles = {};
    (d.detalles || []).forEach(dt => {
      const id = dt.zona?.id || dt.zona;
      detalles[id] = { tipo: dt.tipo, cantidad: dt.valor };
    });
    setZoneDetails(detalles);
    setEditingId(d.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    await supabase.from('detalles_descuento').delete().eq('descuento', id);
    await supabase.from('descuentos').delete().eq('id', id);
    fetchDescuentos();
  };

  const toggleZona = (zonaId) => {
    setZoneDetails(prev => {
      if (prev[zonaId]) {
        const { [zonaId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [zonaId]: { tipo: 'monto', cantidad: '' } };
    });
  };

  return (
    <div className="p-6">
      {/* UI igual al anterior */}
      {/* Puedes mantener tu renderizado JSX como ya lo tienes */}
    </div>
  );
};

export default Descuentos;
