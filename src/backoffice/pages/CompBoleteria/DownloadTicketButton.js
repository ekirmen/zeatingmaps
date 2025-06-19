import React from 'react';
import { message, Button } from 'antd';
import { supabase } from '../../../backoffice/services/supabaseClient';

const DownloadTicketButton = ({ paymentId }) => {
  const handleDownload = async () => {
    if (!paymentId) {
      message.error('ID de ticket no válido');
      return;
    }

    try {
      const { data, error } = await supabase
        .storage
        .from('tickets') // nombre del bucket
        .download(`ticket_${paymentId}.pdf`);

      if (error) {
        console.error(error);
        message.error('Error al descargar el ticket');
        return;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('Ticket descargado con éxito');
    } catch (err) {
      console.error('Error:', err);
      message.error('Fallo en la descarga');
    }
  };

  return (
    <Button type="default" block onClick={handleDownload}>
      Descargar Ticket
    </Button>
  );
};

export default DownloadTicketButton;
