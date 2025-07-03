import React, { useEffect, useState } from 'react';
import { NotificationManager } from 'react-notifications';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const BuyEvent = () => {
  const { id } = useParams(); // id puede ser slug o ID
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setEvento(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  if (loading) {
    return <div>Cargando detalles del evento para la compra...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!evento) {
    return <div>No se encontró el evento.</div>;
  }

  return (
    <div className="buy-event">
      <h1>Comprar Entrada para: {evento.nombre}</h1>
      <p><strong>Sector:</strong> {evento.sector}</p>
      <p><strong>Recinto:</strong> {evento.recinto}</p>
      <p><strong>Sala:</strong> {evento.sala}</p>

      {/* Aquí puedes agregar el formulario de compra o la lógica de compra */}
      <button
        onClick={() => NotificationManager.success('Compra realizada con éxito')}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Confirmar Compra
      </button>
    </div>
  );
};

export default BuyEvent;