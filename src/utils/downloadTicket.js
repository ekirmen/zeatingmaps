import API_BASE_URL from './apiBase';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default async function downloadTicket(locator) {
  if (!locator) throw new Error('Invalid locator');
  const url = `${API_BASE_URL}/api/payments/${locator}/download`;
  try {
    // Obtener token fresco de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error obteniendo sesión:', sessionError);
      // Continuar sin token si no se puede obtener la sesión
    }

    const token = session?.access_token;

    console.log('Token obtenido de Supabase:', token ? '✅ Válido' : '❌ Faltante');

    console.log('🚀 [DOWNLOAD] Iniciando descarga de ticket');
    console.log('📋 Locator:', locator);
    console.log('🔗 API URL:', url);
    console.log('🔑 Token obtenido:', token ? '✅ Presente' : '❌ Faltante');
    console.log('🔑 Token length:', token ? token.length : 0);

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await fetch(url, { headers });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('Content-Type');
    if (!response.ok) {
      let errorMessage = 'Failed to download ticket';
      console.error('Response not OK:', response.status, response.statusText);
      
      if (contentType?.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data?.error || data?.details || errorMessage;
          console.error('API Error Details:', data);
        } catch (e) {
          console.error('Error parsing JSON response:', e);
        }
      } else if (contentType?.includes('text/html')) {
        console.error('API devolvió HTML en lugar de JSON/PDF');
        errorMessage = 'Error del servidor - API devolvió HTML';
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const validContent = contentType &&
      (contentType.includes('application/pdf') ||
       contentType.includes('application/octet-stream'));

    if (!validContent) {
      console.error('Invalid content type:', contentType);
      console.error('Content-Type recibido:', contentType);
      console.error('Response headers completos:', Object.fromEntries(response.headers.entries()));
      
      if (contentType?.includes('text/html')) {
        toast.error('Error del servidor - API devolvió HTML en lugar de PDF');
        throw new Error('Server returned HTML instead of PDF');
      } else {
        toast.error('No se pudo descargar el ticket - tipo de contenido inválido');
        throw new Error('Invalid content type');
      }
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
    console.error('❌ [DOWNLOAD] Error descargando ticket:', err);
    console.error('❌ [DOWNLOAD] Error name:', err.name);
    console.error('❌ [DOWNLOAD] Error message:', err.message);
    console.error('❌ [DOWNLOAD] Error stack:', err.stack);
    
    let userMessage = 'Error al descargar ticket';
    
    if (err.message?.includes('Server returned HTML')) {
      userMessage = 'Error del servidor - Contacte al administrador';
    } else if (err.message?.includes('Invalid content type')) {
      userMessage = 'Error del servidor - Formato de respuesta inválido';
    } else {
      userMessage = `Error al descargar ticket: ${err.message}`;
    }
    
    toast.error(userMessage);
    return false;
  }
}
