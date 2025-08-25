// API Base URL Configuration
const getApiBaseUrl = () => {
  // En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // En producción, usar la URL de producción
  return 'https://sistema.veneventos.com';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
