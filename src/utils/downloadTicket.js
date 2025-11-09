import { buildRelativeApiUrl } from './apiConfig';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { trackTicketDownload, trackApiError } from './analytics';

export default async function downloadTicket(locator, ticketId) {
  if (!locator && !ticketId) throw new Error('Invalid locator');
  
  // Construir URL usando la configuración que detecta el entorno
  let url;
  if (ticketId) {
    url = buildRelativeApiUrl(`tickets/${ticketId}/download`);
  } else {
    url = buildRelativeApiUrl(`payments/${locator}/download`);
  }
    
  try {
    // Obtener token fresco de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ [DOWNLOAD] Error obteniendo sesión:', sessionError);
      // Continuar sin token si no se puede obtener la sesión
    }

    const token = session?.access_token;

    console.log('🚀 [DOWNLOAD] Iniciando descarga de ticket');
    console.log('📋 Locator:', locator);
    console.log('🔗 API URL:', url);
    console.log('🔑 Token obtenido:', token ? '✅ Presente' : '❌ Faltante');
    console.log('🔑 Token length:', token ? token.length : 0);
    
    // Trackear inicio de descarga
    trackTicketDownload(locator, 'download', false, 'iniciando');

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/pdf, application/json, */*',
      'Cache-Control': 'no-cache'
    };

    console.log('📤 [DOWNLOAD] Headers enviados:', headers);

    const response = await fetch(url, { 
      headers,
      method: 'GET',
      mode: 'cors'
    });

    console.log('📥 [DOWNLOAD] Response recibida:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('Content-Type');
    console.log('- Content-Type:', contentType);

    if (!response.ok) {
      let errorMessage = 'Failed to download ticket';
      console.error('❌ [DOWNLOAD] Response not OK:', response.status, response.statusText);
      
      // Manejar diferentes tipos de respuesta de error
      if (contentType?.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data?.error || data?.details || errorMessage;
          console.error('❌ [DOWNLOAD] API Error Details:', data);
        } catch (e) {
          console.error('❌ [DOWNLOAD] Error parsing JSON response:', e);
        }
      } else if (contentType?.includes('text/html')) {
        console.error('❌ [DOWNLOAD] API devolvió HTML en lugar de JSON/PDF');
        
        // Intentar leer el contenido HTML para debug
        try {
          const htmlContent = await response.text();
          console.error('❌ [DOWNLOAD] Contenido HTML recibido (primeros 500 chars):', htmlContent.substring(0, 500));
          
          if (htmlContent.includes('Error') || htmlContent.includes('error')) {
            errorMessage = 'Error del servidor - API devolvió página de error HTML';
          } else if (htmlContent.includes('<!doctype html>')) {
            errorMessage = 'Error del servidor - API devolvió HTML en lugar de PDF';
          } else {
            errorMessage = 'Error del servidor - Respuesta inesperada del servidor';
          }
        } catch (e) {
          console.error('❌ [DOWNLOAD] Error leyendo contenido HTML:', e);
          errorMessage = 'Error del servidor - API devolvió HTML en lugar de PDF';
        }
      } else if (response.status === 404) {
        errorMessage = 'Endpoint no encontrado (404) - Verificar configuración de API';
        console.error('❌ [DOWNLOAD] Endpoint 404 - URL:', url);
      } else {
        errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
      }
      
      // Trackear error de descarga
      trackTicketDownload(locator, 'download', false, errorMessage);
      trackApiError(url, response.status, errorMessage);
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const validContent = contentType &&
      (contentType.includes('application/pdf') ||
       contentType.includes('application/octet-stream'));

    if (!validContent) {
      console.error('❌ [DOWNLOAD] Invalid content type:', contentType);
      console.error('❌ [DOWNLOAD] Content-Type recibido:', contentType);
      console.error('❌ [DOWNLOAD] Response headers completos:', Object.fromEntries(response.headers.entries()));
      
      if (contentType?.includes('text/html')) {
        // Intentar leer el contenido HTML para debug
        try {
          const htmlContent = await response.text();
          console.error('❌ [DOWNLOAD] Contenido HTML recibido (primeros 500 chars):', htmlContent.substring(0, 500));
          
          if (htmlContent.includes('Error') || htmlContent.includes('error')) {
            toast.error('Error del servidor - API devolvió página de error HTML');
            throw new Error('Server returned HTML error page instead of PDF');
          } else {
            toast.error('Error del servidor - API devolvió HTML en lugar de PDF');
            throw new Error('Server returned HTML instead of PDF');
          }
        } catch (e) {
          console.error('❌ [DOWNLOAD] Error leyendo contenido HTML:', e);
          toast.error('Error del servidor - API devolvió HTML en lugar de PDF');
          throw new Error('Server returned HTML instead of PDF');
        }
      } else {
        toast.error('No se pudo descargar el ticket - tipo de contenido inválido');
        throw new Error('Invalid content type');
      }
    }

    console.log('✅ [DOWNLOAD] Content-Type válido, procesando PDF...');

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) {
      toast.error('No se pudo descargar el ticket - archivo vacío');
      throw new Error('Empty PDF');
    }
    
    console.log('✅ [DOWNLOAD] PDF recibido, tamaño:', arrayBuffer.byteLength, 'bytes');
    
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${locator}.pdf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    
    console.log('✅ [DOWNLOAD] Ticket descargado exitosamente');
    
    // Trackear descarga exitosa
    trackTicketDownload(locator, 'download', true, null);
    
    toast.success('Ticket descargado exitosamente');
    
  } catch (error) {
    // Manejar errores correctamente, asegurándose de que el mensaje sea un string
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : error?.message || JSON.stringify(error) || 'Error desconocido al descargar el ticket';
    
    console.error('❌ [DOWNLOAD] Error descargando ticket:', error);
    console.error('❌ [DOWNLOAD] Error name:', error?.name || 'Unknown');
    console.error('❌ [DOWNLOAD] Error message:', errorMessage);
    console.error('❌ [DOWNLOAD] Error stack:', error?.stack || 'No stack available');
    
    // Trackear error de descarga
    trackTicketDownload(locator || 'unknown', 'download', false, errorMessage);
    
    // Mostrar toast de error si no se mostró antes
    if (!errorMessage.includes('Server returned') && !errorMessage.includes('Invalid content type')) {
      toast.error(`Error al descargar el ticket: ${errorMessage}`);
    }
    
    // Lanzar un nuevo error con el mensaje correcto
    throw new Error(errorMessage);
  }
}
