// Configuración de la API para sistema.veneventos.com
const getApiConfig = () => {

  return {
    baseUrl: 'https://sistema.veneventos.com',
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

// Función para verificar la conectividad
export 
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: `${response.status}: ${response.statusText}` };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para diagnosticar problemas de configuración
export 
  
  if (!process.env.NODE_ENV) {
    issues.push('NODE_ENV no está definido');
  }
  
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.REACT_APP_VERCEL_ENV
  ) {
    issues.push('VERCEL_ENV no está definido en producción');
  }
  
  const config = getApiConfig();
  
  if (!config.baseUrl) {
    issues.push('baseUrl no está definido');
  }
  
  if (!config.apiPath) {
    issues.push('apiPath no está definido');
  }
  
  return { hasIssues: issues.length > 0, issues };
};

export default apiConfig;
