const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Only active events are returned.
 */
export const getActiveEventsPublic = async () => {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Missing Supabase configuration');
    return [];
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
