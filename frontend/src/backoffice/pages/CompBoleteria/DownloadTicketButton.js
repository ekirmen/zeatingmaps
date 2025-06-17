import React from 'react';
import { message, Button } from 'antd';

const DownloadTicketButton = ({ paymentId }) => {
  const handleDownload = async () => {
    // Validate paymentId format
    if (!paymentId || typeof paymentId !== 'string' || paymentId.length !== 24) {
      message.error('Invalid ticket ID format');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/${paymentId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 404) {
        message.error('Ticket not found');
        return;
      }

      if (!response.ok) {
        throw new Error('Error downloading ticket');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('Ticket downloaded successfully');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      message.error(error.message);
    }
  };

  return (
    <Button type="default" variant="outlined" block onClick={handleDownload}>
      Descargar Ticket
    </Button>
  );
};

export default DownloadTicketButton;