import API_BASE_URL from '../../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

const fetchApi = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      } : {})
    };

    const response = await fetch(`${API_BASE_URL_WITH_API}${url}`, {
      ...options,
      headers
    });

    if (!response.ok) throw new Error(`Request error: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error(`Error in fetchApi (${url}):`, error);
    throw error;
  }
};

// Zonas
export const fetchZonas = () => fetchApi('/zonas');
export const fetchZonasPorSala = (salaId) => fetchApi(`/zonas/sala/${salaId}`);
export const fetchZonasPorRecinto = (recintoId) => fetchApi(`/zonas?recinto=${recintoId}`);

// Salas
export const fetchSalasPorRecinto = (recintoId) => fetchApi(`/salas?recinto=${recintoId}`);

// Eventos
export const fetchEventos = () => fetchApi('/events');
export const fetchEventoById = (eventoId) => fetchApi(`/events/${eventoId}`);
export const fetchEventosPorRecinto = (recintoId) => fetchApi(`/events?recinto=${recintoId}`);
export const fetchEventosPorSala = (salaId) => fetchApi(`/events?sala=${salaId}`);

// Funciones
export const fetchFuncionesPorEvento = (eventoId) => fetchApi(`/funciones?evento=${eventoId}`);

// Asientos
export const fetchAsientosComprados = (funcionId) => fetchApi(`/funciones/${funcionId}/asientos-comprados`);

// Pagos
export const fetchPagos = () => fetchApi('/pagos');
export const fetchPagoByLocator = (locator) => fetchApi(`/pagos/${locator}`);
export const getPagosPorEvento = (eventoId) => fetchApi(`/pagos?evento=${eventoId}`);

// Mapas
export const fetchMapa = async (salaId, funcionId = null) => {
  try {
    if (funcionId) {
      const resFuncion = await fetch(`${API_BASE_URL_WITH_API}/funcions/${funcionId}/mapa`);
      if (resFuncion.ok) {
        return await resFuncion.json();
      }
      if (resFuncion.status !== 404) {
        throw new Error(`Error ${resFuncion.status}`);
      }
      // Si no se encontró mapa específico para la función,
      // se intenta obtener el mapa general de la sala
    }

    const resSala = await fetch(`${API_BASE_URL_WITH_API}/salas/${salaId}/mapa`);
    if (!resSala.ok) throw new Error(`Error ${resSala.status}`);
    return await resSala.json();
  } catch (error) {
    console.error('Error al obtener el mapa:', error);
    return null;
  }
};

export const saveMapa = async (salaId, data) => {
  const response = await fetch(`${API_BASE_URL_WITH_API}/salas/${salaId}/mapa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), // Send the entire data object, not just contenido
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error saving mapa:', errorData);
    throw new Error(`Error ${response.status}: ${errorData.mensaje || response.statusText}`);
  }

  return await response.json();
};

export const getMapaPorEvento = (eventoId) => fetchApi(`/eventos/${eventoId}/mapa`);

// Plantillas
export const fetchPlantillaPrecios = (plantillaId) => fetchApi(`/plantillas/${plantillaId}`);
export const fetchPlantillasPorRecintoYSala = (recintoId, salaId) => fetchApi(`/plantillas?recinto=${recintoId}&sala=${salaId}`);
export const getPlantilla = (id) => fetchApi(`/plantillas/${id}`);

// Entradas
export const fetchEntradas = () => fetchApi('/entradas');
export const fetchEntradaById = (id) => fetchApi(`/entradas/${id}`);

// Iva
export const fetchIvas = () => fetchApi('/ivas');

// Usuarios
export const fetchUsuarios = () => fetchApi('/usuarios');

// Recintos y Salas
export const fetchRecintos = () => fetchApi('/recintos');
export const fetchSalas = () => fetchApi('/salas');

// Crear entidades
export const createEvento = (data) => fetchApi('/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createFuncion = (data) => fetchApi('/funciones', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createZona = (data) => fetchApi('/zonas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createSala = (data) => fetchApi('/salas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createRecinto = (data) => fetchApi('/recintos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createUsuario = (data) => fetchApi('/usuarios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const createEntrada = (data) => fetchApi('/entradas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
export const createIva = (data) => fetchApi('/ivas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
export const updateIva = (id, data) => fetchApi(`/ivas/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
export const deleteIva = (id) => fetchApi(`/ivas/${id}`, {
  method: 'DELETE',
});

export const createMapa = (data) => fetchApi('/mapas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// Actualizar entidades
export const updateEvento = (id, data) => fetchApi(`/events/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const updateZona = (id, data) => fetchApi(`/zonas/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const updateEntrada = (id, data) => fetchApi(`/entradas/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const updateMesa = (salaId, mesaId, data) => fetchApi(`/mesas/sala/${salaId}/${mesaId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const setSeatsBlocked = (seatIds, bloqueado) =>
  fetchApi('/seats/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds, bloqueado }),
  });

// Eliminar entidades
export const deleteEvento = (id) => fetchApi(`/events/${id}`, { method: 'DELETE' });
export const deleteZona = (id) => fetchApi(`/zonas/${id}`, { method: 'DELETE' });
export const deleteEntrada = (id) => fetchApi(`/entradas/${id}`, { method: 'DELETE' });

// Descuentos
export const fetchDescuentos = () => fetchApi('/descuentos');
export const createDescuento = (data) => fetchApi('/descuentos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
export const updateDescuento = (id, data) => fetchApi(`/descuentos/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
export const deleteDescuento = (id) => fetchApi(`/descuentos/${id}`, { method: 'DELETE' });
export const getDescuentoByCodigo = (codigo) => fetchApi(`/descuentos/code/${codigo}`);

// CMS Pages
export const fetchCmsPage = (pageId) => fetchApi(`/cms-pages/${pageId}`);
export const saveCmsPage = (pageId, widgets) =>
  fetchApi(`/cms-pages/${pageId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgets })
  });

// Abonos
export const fetchAbonosByUser = (userId) => fetchApi(`/abonos/user/${userId}`);
export const createAbono = (data) =>
  fetchApi('/abonos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
export const renewAbono = (id, data) =>
  fetchApi(`/abonos/${id}/renew`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const fetchAbonoAvailableSeats = (eventId) =>
  fetchApi(`/abonos/available/${eventId}`);
