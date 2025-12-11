// Configuración de la API que funciona en desarrollo y producción
const getApiConfig = () => {
  // En desarrollo, usar localhost

    return {
      baseUrl: 'http://localhost:3000',
      apiPath: '/api'
    };
  }
  
  // En producción (Vercel), usar la URL actual
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    return {
      baseUrl: currentOrigin,
      apiPath: '/api'
    };
  }
  
  // Fallback para servidor
  return {
    baseUrl: '',
    apiPath: '/api'
  };
};

export const apiConfig = getApiConfig();

// Función para construir URLs de API
export 
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}${apiPath}/${cleanEndpoint}`;
};

// Función para construir URLs relativas (para Vercel)
export 
  return `/api/${cleanEndpoint}`;
};

export default apiConfig;
