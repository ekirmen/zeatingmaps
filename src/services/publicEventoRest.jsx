const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Fetch public events directly from the Supabase REST endpoint.
 * Only active events are returned.
 */
export const fetchPublicEventos = async () => {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Supabase URL o anon key no definidos');
  }

  const url = `${SUPABASE_URL}/rest/v1/eventos?select=*&activo=eq.true`;
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al cargar eventos: ${res.statusText}`);
  }

  return res.json();
};

