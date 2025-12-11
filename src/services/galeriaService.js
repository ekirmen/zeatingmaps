import API_BASE_URL from '../utils/apiBase';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import logger from '../utils/logger';

const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

// 🖼️ NUEVA FUNCIONALIDAD: Conectar con tablas galeria e imagenes
export 

    if (tenantId) {
      galeriaQuery = galeriaQuery.eq('tenant_id', tenantId);
    }

    const { data: galeriaData, error: galeriaError } = await galeriaQuery;

    if (galeriaError) {
      logger.warn('Error loading galeria:', galeriaError.message);
    }

    // Cargar desde tabla imagenes
    let imagenesQuery = supabase
      .from('imagenes')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      imagenesQuery = imagenesQuery.eq('tenant_id', tenantId);
    }

    const { data: imagenesData, error: imagenesError } = await imagenesQuery;

    if (imagenesError) {
      logger.warn('Error loading imagenes:', imagenesError.message);
    }

    // Combinar datos de ambas tablas
    const allImages = [
      ...(galeriaData || []).map(img => ({ ...img, source: 'galeria' })),
      ...(imagenesData || []).map(img => ({ ...img, source: 'imagenes' }))
    ];


    return allImages;

  } catch (error) {
    logger.error('Error fetching images from database:', error);
    return [];
  }
};

// 🖼️ FUNCIONALIDAD ORIGINAL (mantener compatibilidad)
export 
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria`, {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error loading images');
  return res.json();
};

export 
  formData.append('image', file);
  formData.append('categoria', categoria);
  
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData
  });
  if (!res.ok) throw new Error('Error uploading image');
  return res.json();
};

export 
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria/${filename}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error deleting image');
  return res.json();
};
