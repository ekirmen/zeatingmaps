import React from 'react';
import { message, Button } from 'antd';
import downloadTicket from '../../../utils/downloadTicket';

const DownloadTicketButton = ({ locator }) => {
  const handleDownload = async () => {
    if (!locator) {
      message.error('ID de ticket no válido');
      return;
    }

    try {
      await downloadTicket(locator);
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
