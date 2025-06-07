
const BASE_URL = 'http://localhost:5000/api';

// Función genérica para solicitudes GET
export const fetchPlantillaPrecios = async () => {
  // tu lógica aquí
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
export const fetchMapa = async (salaId) => {
  try {
    const res = await fetch(`${BASE_URL}/salas/${salaId}`);
    if (!res.ok) throw new Error("No se pudo obtener el mapa");
    return await res.json();
  } catch (error) {
    console.error('Error al obtener el mapa por sala:', error);
    throw error;
  }
};
