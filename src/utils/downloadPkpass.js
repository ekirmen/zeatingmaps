/**
 * Descarga un archivo .pkpass (Apple Wallet / Google Wallet) para un ticket
 */

import { buildRelativeApiUrl } from './apiConfig';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { trackTicketDownload } from './analytics';

export default async function downloadPkpass(locator, ticketId, source = 'web') {
  if (!locator && !ticketId) {
    throw new Error('Localizador no proporcionado');
  }
  
  // Construir URL usando la configuración que detecta el entorno
  let url;
  if (ticketId) {
    url = buildRelativeApiUrl(`payments/${locator}/pkpass?ticketId=${ticketId}`);
  } else {
    url = buildRelativeApiUrl(`payments/${locator}/pkpass`);
  }
  
  // Agregar parámetro source si se proporciona
  if (source) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}source=${encodeURIComponent(source)}`;
  }
    
  try {
    // Obtener token fresco de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ [PKPASS] Error obteniendo sesión:', sessionError);
      // Continuar sin token si no se puede obtener la sesión
    }

    const token = session?.access_token;

    console.log('🎫 [PKPASS] Iniciando descarga de archivo .pkpass');
    console.log('📋 Locator:', locator);
    console.log('🔗 API URL:', url);
    
    // Trackear inicio de descarga
    trackTicketDownload(locator, 'pkpass', false, 'iniciando');

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.apple.pkpass, application/octet-stream, */*',
      'Cache-Control': 'no-cache'
    };

    console.log('📤 [PKPASS] Headers enviados:', headers);

    const response = await fetch(url, { 
      headers,
      method: 'GET',
      mode: 'cors'
    });

    console.log('📥 [PKPASS] Response recibida:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Content-Type:', response.headers.get('Content-Type'));

    if (!response.ok) {
      let errorMessage = 'Error al descargar el archivo .pkpass';
      
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) {
        // Si no se puede parsear como JSON, usar el mensaje por defecto
        errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
      }
      
      console.error('❌ [PKPASS] Error en respuesta:', errorMessage);
      
      // Trackear error
      trackTicketDownload(locator || 'unknown', 'pkpass', false, errorMessage);
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('Content-Type');
    const validContent = contentType &&
      (contentType.includes('application/vnd.apple.pkpass') ||
       contentType.includes('application/zip') ||
       contentType.includes('application/octet-stream'));

    if (!validContent) {
      console.error('❌ [PKPASS] Tipo de contenido inválido:', contentType);
      toast.error('Error: Tipo de contenido inválido');
      throw new Error('Invalid content type');
    }

    console.log('✅ [PKPASS] Tipo de contenido válido, procesando .pkpass...');

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) {
      toast.error('Error: Archivo vacío');
      throw new Error('Empty file');
    }
    
    console.log('✅ [PKPASS] Archivo .pkpass recibido, tamaño:', arrayBuffer.byteLength, 'bytes');
    
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.apple.pkpass' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${locator}.pkpass`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    
    console.log('✅ [PKPASS] Archivo .pkpass descargado exitosamente');
    
    // Trackear descarga exitosa
    trackTicketDownload(locator, 'pkpass', true, null);
    
    toast.success('Archivo .pkpass descargado exitosamente. Puedes agregarlo a Apple Wallet o Google Wallet.');
    
  } catch (error) {
    let errorMessage = 'Error al descargar el archivo .pkpass';
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('❌ [PKPASS] Error descargando .pkpass:', error);
    console.error('❌ [PKPASS] Error message:', errorMessage);
    
    // Trackear error
    trackTicketDownload(locator || 'unknown', 'pkpass', false, errorMessage);
    
    toast.error(`Error al descargar .pkpass: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

