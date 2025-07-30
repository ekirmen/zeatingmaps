import API_BASE_URL from './apiBase';
import { toast } from 'react-hot-toast';

export default async function downloadTicket(locator) {
  if (!locator) throw new Error('Invalid locator');
  const url = `${API_BASE_URL}/api/payments/${locator}/download`;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Debe iniciar sesi\u00f3n para descargar el ticket');
      throw new Error('Missing auth token');
    }

    console.log('Downloading ticket for locator:', locator);
    console.log('API URL:', url);

    const response = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('Content-Type');
    if (!response.ok) {
      let errorMessage = 'Failed to download ticket';
      if (contentType?.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data?.error || errorMessage;
          console.error('API Error:', data);
        } catch (e) {
          console.error('Error parsing JSON response:', e);
        }
      }
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const validContent = contentType &&
      (contentType.includes('application/pdf') ||
       contentType.includes('application/octet-stream'));

    if (!validContent) {
      console.error('Invalid content type:', contentType);
      toast.error('No se pudo descargar el ticket - tipo de contenido inválido');
      throw new Error('Invalid content type');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) {
      toast.error('No se pudo descargar el ticket - archivo vacío');
      throw new Error('Empty PDF');
    }
    
    console.log('PDF size:', arrayBuffer.byteLength, 'bytes');
    
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${locator}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    
    console.log('Ticket downloaded successfully');
    return true;
  } catch (err) {
    console.error('Error downloading ticket:', err);
    toast.error(`Error al descargar ticket: ${err.message}`);
    return false;
  }
}
