
import API_BASE_URL from '../../utils/apiBase';
const BASE_URL = API_BASE_URL + '/api';

// Función genérica para solicitudes GET
// Obtener plantilla de precios por ID
export const fetchPlantillaPrecios = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/plantillas/${id}`);
    if (!res.ok) throw new Error('No se pudo obtener la plantilla de precios');
    return await res.json();
  } catch (error) {
    console.error('Error al obtener la plantilla de precios:', error);
    throw error;
  }
};

const fetchStoreData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al hacer fetch a ${endpoint}:`, error);
    throw error;
  }
};

// 🔹 Obtener un evento por ID
export const getEvent = (eventId) =>
  fetchStoreData(`/events/${eventId}`);

// 🔹 Obtener funciones por evento
export const getFunciones = (eventId) =>
  fetchStoreData(`/funcions?evento=${eventId}`);

// 🔹 Obtener todas las zonas
export const getZonas = () =>
  fetchStoreData('/zonas');

// Alias utilizado en el store
export const fetchZonas = () => getZonas();

// 🔹 Obtener pagos por evento
export const getPagosPorEvento = (eventId) =>
  fetchStoreData(`/payments?evento=${eventId}`);

// 🔹 Obtener plantilla por ID
export const getPlantilla = (plantillaId) =>
  fetchStoreData(`/plantillas/${plantillaId}`);

// 🔹 Obtener mapa por evento
export const getMapaPorEvento = (eventId) =>
  fetchStoreData(`/mapa?evento=${eventId}`);

// 🔹 Obtener mapa por sala ID
export const fetchMapa = async (salaId, funcionId = null) => {
  try {
    const url = funcionId
      ? `${BASE_URL}/funcions/${funcionId}/mapa`
      : `${BASE_URL}/salas/${salaId}/mapa`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo obtener el mapa");
    return await res.json();
  } catch (error) {
    console.error('Error al obtener el mapa por sala:', error);
    throw error;
  }
};

// Obtener descuento por código
export const fetchDescuentoPorCodigo = async (codigo) => {
  const res = await fetch(`${BASE_URL}/descuentos/code/${codigo}`);
  if (!res.ok) throw new Error('Código de descuento no válido');
  return await res.json();
};

export const getCmsPage = (pageId) => fetchStoreData(`/cms-pages/${pageId}`);
