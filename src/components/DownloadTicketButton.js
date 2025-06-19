const DownloadTicketButton = ({ paymentId }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/${paymentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket_${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
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