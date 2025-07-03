import downloadTicket from '../utils/downloadTicket';

const DownloadTicketButton = ({ paymentId }) => {
  const handleDownload = async () => {
    try {
      await downloadTicket(paymentId);
    } catch (error) {
      console.error('Error downloading ticket:', error);
    }
  };

  return (
    <button onClick={handleDownload}>
      Descargar Ticket
    </button>
  );
};

export default DownloadTicketButton;