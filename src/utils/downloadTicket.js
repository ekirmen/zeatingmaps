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

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = response.headers.get('Content-Type');
    if (!response.ok) {
      let errorMessage = 'Failed to download ticket';
      if (contentType?.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data?.error || errorMessage;
        } catch {
          // ignore JSON parse errors
        }
      }
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    if (!contentType?.includes('application/pdf')) {
      toast.error('No se pudo descargar el ticket');
      throw new Error('Invalid content type');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) {
      toast.error('No se pudo descargar el ticket');
      throw new Error('Empty PDF');
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${locator}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.error('Error downloading ticket:', err);
    // Fallback for CORS issues: open in new tab
    window.open(url, '_blank');
    return false;
  }
}
