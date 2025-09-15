import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from '../../supabaseClient';
import { v5 as uuidv5 } from 'uuid';



const handleError = (error) => {
  if (error) {
    console.error('Supabase error:', error.message);
    throw new Error(error.message);
  }
};

// Helper: verifica si una columna existe - versión simplificada sin information_schema
async function hasColumn(tableName, columnName) {
  // Para cms_pages, sabemos que created_at existe según el schema
  if (tableName === 'cms_pages') {
    if (columnName === 'created_at') return true;
    if (columnName === 'updated_at') return false; // No existe en el schema actual
    return false;
  }
  return false;
}

// === ZONAS ===
export const fetchZonas = async () => {
  // Obtener tenant_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener tenant_id del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile?.tenant_id) {
    throw new Error('Usuario sin tenant_id válido');
  }

  // Filtrar zonas por tenant_id del usuario
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('tenant_id', profile.tenant_id);
  
  handleError(error);
  return data;
};

export const fetchZonasPorSala = async (salaId) => {
  console.log('🔍 [fetchZonasPorSala] Iniciando búsqueda de zonas para sala:', salaId);
  
  // Obtener tenant_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ [fetchZonasPorSala] Usuario no autenticado');
    throw new Error('Usuario no autenticado');
  }
  
  console.log('✅ [fetchZonasPorSala] Usuario autenticado:', user.id);

  // Obtener tenant_id del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  console.log('🔍 [fetchZonasPorSala] Perfil obtenido:', { profile, error: profileError });
  
  if (profileError || !profile?.tenant_id) {
    console.error('❌ [fetchZonasPorSala] Usuario sin tenant_id válido');
    throw new Error('Usuario sin tenant_id válido');
  }
  
  console.log('✅ [fetchZonasPorSala] Tenant ID:', profile.tenant_id);

  // Filtrar zonas por sala_id y tenant_id del usuario
  console.log('🔍 [fetchZonasPorSala] Buscando zonas en tabla zonas...');
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('sala_id', salaId)
    .eq('tenant_id', profile.tenant_id);
  
  console.log('🔍 [fetchZonasPorSala] Resultado búsqueda zonas:', { data, error });
  
  if (error) {
    console.error('❌ [fetchZonasPorSala] Error al buscar zonas:', error);
    console.error('❌ [fetchZonasPorSala] Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
  }
  
  handleError(error);
  console.log('✅ [fetchZonasPorSala] Zonas retornadas:', data);
  return data;
};

export const createZona = async (data) => {
  const client = supabaseAdmin || supabase;
  
  // Si no se proporciona tenant_id, obtenerlo de la sala
  if (!data.tenant_id && data.sala_id) {
    try {
      // Obtener el tenant_id de la sala
      const { data: salaData, error: salaError } = await client
        .from('salas')
        .select('recintos!inner(tenant_id)')
        .eq('id', data.sala_id)
        .single();
      
      if (salaError) {
        console.error('[createZona] Error al obtener tenant_id de la sala:', salaError);
      } else if (salaData?.recintos?.tenant_id) {
        data.tenant_id = salaData.recintos.tenant_id;
        console.log('[createZona] Tenant_id asignado automáticamente:', data.tenant_id);
      } else {
        console.warn('[createZona] No se pudo obtener tenant_id de la sala');
      }
    } catch (error) {
      console.error('[createZona] Error al procesar tenant_id:', error);
    }
  }
  
  // Crear la zona con tenant_id
  const { data: result, error } = await client.from('zonas').insert(data).single();
  handleError(error);
  return result;
};

export const updateZona = async (id, data) => {
  const client = supabaseAdmin || supabase;
  
  // Si no se proporciona tenant_id, obtenerlo de la zona existente o de la sala
  if (!data.tenant_id) {
    try {
      // Primero intentar obtener el tenant_id de la zona existente
      const { data: zonaExistente, error: zonaError } = await client
        .from('zonas')
        .select('tenant_id, sala_id')
        .eq('id', id)
        .single();
      
      if (zonaError) {
        console.error('[updateZona] Error al obtener zona existente:', zonaError);
      } else if (zonaExistente?.tenant_id) {
        data.tenant_id = zonaExistente.tenant_id;
        console.log('[updateZona] Tenant_id obtenido de zona existente:', data.tenant_id);
      } else if (zonaExistente?.sala_id) {
        // Si la zona no tiene tenant_id, obtenerlo de la sala
        const { data: salaData, error: salaError } = await client
          .from('salas')
          .select('recintos!inner(tenant_id)')
          .eq('id', zonaExistente.sala_id)
          .single();
        
        if (salaError) {
          console.error('[updateZona] Error al obtener tenant_id de la sala:', salaError);
        } else if (salaData?.recintos?.tenant_id) {
          data.tenant_id = salaData.recintos.tenant_id;
          console.log('[updateZona] Tenant_id asignado automáticamente:', data.tenant_id);
        }
      }
    } catch (error) {
      console.error('[updateZona] Error al procesar tenant_id:', error);
    }
  }
  
  // Actualizar la zona con tenant_id
  const { data: result, error } = await client.from('zonas').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteZona = async (id) => {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('zonas').delete().eq('id', id);
  handleError(error);
};

// === SALAS Y RECINTOS ===
export const fetchRecintos = async () => {
  const { data, error } = await supabase.from('recintos').select('*, salas(*)');
  handleError(error);
  return data;
};

export const createRecinto = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('recintos').insert(data).single();
  handleError(error);
  return result;
};

export const fetchSalas = async () => {
  const { data, error } = await supabase.from('salas').select('*');
  handleError(error);
  return data;
};

export const fetchSalasPorRecinto = async (recintoId) => {
  const { data, error } = await supabase.from('salas').select('*').eq('recinto_id', recintoId);
  handleError(error);
  return data;
};

export const fetchSalaById = async (salaId) => {
  const { data, error } = await supabase.from('salas').select('*').eq('id', salaId).single();
  handleError(error);
  return data;
};

export const createSala = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('salas').insert(data).single();
  handleError(error);
  return result;
};

// === EVENTOS ===
export const fetchEventos = async () => {
  const { data, error } = await supabase.from('eventos').select('*');
  handleError(error);
  return data;
};

export const fetchEventoById = async (id) => {
  const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single();
  handleError(error);
  return data;
};

export const createEvento = async (data) => {
  try {
    const client = supabaseAdmin || supabase;
    
    // Crear el evento
    const { data: result, error } = await client.from('eventos').insert(data).single();
    handleError(error);
    
    // Crear automáticamente la página CMS para el evento
    if (result) {
      console.log('🔧 [createEvento] Evento creado, creando página CMS...');
      const cmsPage = await createCmsPageForEvent(result);
      if (cmsPage) {
        console.log('✅ [createEvento] Página CMS creada exitosamente para evento:', result.nombre);
      } else {
        console.warn('⚠️ [createEvento] No se pudo crear la página CMS para evento:', result.nombre);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ [createEvento] Error creando evento:', error);
    throw error;
  }
};

export const updateEvento = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('eventos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const deleteEvento = async (id) => {
  const client = supabaseAdmin || supabase;
  const { error } = await client.from('eventos').delete().eq('id', id);
  handleError(error);
};

// === FUNCIONES ===
export const fetchFuncionesPorEvento = async (eventoId) => {
  const { data, error } = await supabase
    .from('funciones')
    .select('id, fecha_celebracion, inicio_venta, fin_venta, sala_id, evento_id')
    .eq('evento_id', eventoId);
  handleError(error);
  return data;
};

export const createFuncion = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('funciones').insert(data).single();
  handleError(error);
  return result;
};

// === MAPAS ===
export const fetchMapa = async (salaId, funcionId = null) => {
  if (!salaId) {
    console.error('❌ [fetchMapa] salaId es null/undefined');
    return null;
  }

  console.log('🔍 [fetchMapa] Iniciando búsqueda de mapa para sala:', salaId);
  console.log('🔍 [fetchMapa] Tipo de salaId:', typeof salaId);
  console.log('🔍 [fetchMapa] FuncionId:', funcionId);

  try {
    // Cargar el mapa
    console.log('🔍 [fetchMapa] Buscando mapa en tabla mapas...');
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();
    
    console.log('🔍 [fetchMapa] Resultado búsqueda mapa:', { mapa, error: mapaError });
    
    if (mapaError) {
      console.error('❌ [fetchMapa] Error al buscar mapa:', mapaError);
      console.error('❌ [fetchMapa] Error details:', {
        code: mapaError.code,
        message: mapaError.message,
        details: mapaError.details,
        hint: mapaError.hint
      });
      throw mapaError;
    }
    
    if (!mapa) {
      console.warn('⚠️ [fetchMapa] No se encontró mapa para sala:', salaId);
      return null;
    }
    
    console.log('✅ [fetchMapa] Mapa encontrado:', mapa);
    
    // Cargar las zonas de la sala
    console.log('🔍 [fetchMapa] Buscando zonas para sala:', salaId);
    const { data: zonas, error: zonasError } = await supabase
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId);
    
    console.log('🔍 [fetchMapa] Resultado búsqueda zonas:', { zonas, error: zonasError });
    
    if (zonasError) {
      console.warn('⚠️ [fetchMapa] Error al cargar zonas, continuando sin zonas:', zonasError);
    }
    
    // Cargar asientos reservados/vendidos si se proporciona funcionId
    let reservedSeats = {};
    if (funcionId) {
      console.log('🔍 [fetchMapa] Cargando asientos reservados para función:', funcionId);
      reservedSeats = await loadReservedSeats(funcionId);
    }
    
    // Aplicar estados de asientos reservados al mapa
    const mapaConEstados = applySeatStates(mapa, reservedSeats);
    
    // Retornar mapa con zonas incluidas y estados de asientos
    const resultado = {
      ...mapaConEstados,
      zonas: zonas || []
    };
    
    console.log('✅ [fetchMapa] Retornando resultado final:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ [fetchMapa] Error general:', error);
    throw error;
  }
};

// Función para cargar asientos reservados desde payment_transactions
const loadReservedSeats = async (funcionId) => {
  try {
    console.log('🔍 [loadReservedSeats] Cargando asientos reservados para función:', funcionId);
    
    // Buscar transacciones pendientes (reservadas) para esta función
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('funcion_id', funcionId)
      .in('status', ['pending', 'reserved'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [loadReservedSeats] Error cargando transacciones:', error);
      return {};
    }
    
    console.log('🔍 [loadReservedSeats] Transacciones encontradas:', transactions?.length || 0);
    
    // También buscar en la tabla payments para compatibilidad
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('seats, status, funcion')
      .eq('funcion', funcionId)
      .in('status', ['reservado', 'pagado'])
      .order('created_at', { ascending: false });
    
    if (paymentsError) {
      console.warn('⚠️ [loadReservedSeats] Error cargando payments:', paymentsError);
    }
    
    console.log('🔍 [loadReservedSeats] Payments encontrados:', payments?.length || 0);
    
    // Crear mapa de asientos reservados
    const reservedSeats = {};
    
    // Procesar transacciones de payment_transactions
    if (transactions) {
      for (const transaction of transactions) {
        console.log('🔍 [loadReservedSeats] Procesando transacción:', transaction.id, 'Status:', transaction.status);
        
        // Para payment_transactions, necesitamos extraer los asientos del gateway_response
        if (transaction.gateway_response && typeof transaction.gateway_response === 'object') {
          const seats = transaction.gateway_response.seats || [];
          console.log('🔍 [loadReservedSeats] Asientos en gateway_response:', seats.length);
          
          seats.forEach(seat => {
            if (seat.id) {
              reservedSeats[seat.id] = {
                estado: transaction.status === 'pending' ? 'reservado' : 'pagado',
                transactionId: transaction.id,
                locator: transaction.locator,
                createdAt: transaction.created_at
              };
              console.log('✅ [loadReservedSeats] Asiento reservado:', seat.id, 'Estado:', reservedSeats[seat.id].estado);
            }
          });
        }
        
        // Si no hay asientos en gateway_response, intentar buscar por locator en payments
        if (!transaction.gateway_response?.seats && transaction.locator) {
          console.log('🔍 [loadReservedSeats] Buscando asientos por locator:', transaction.locator);
          
          try {
            // Buscar en payments por locator
            // Nota: algunos entornos rechazan .single(); usar .limit(1) y tomar el primero para evitar 406
            const { data: paymentsByLocator, error: locatorError } = await supabase
              .from('payments')
              .select('seats, status')
              .eq('locator', transaction.locator)
              .limit(1);
            
            const paymentByLocator = Array.isArray(paymentsByLocator) ? paymentsByLocator[0] : null;
            if (!locatorError && paymentByLocator && paymentByLocator.seats) {
              console.log('✅ [loadReservedSeats] Encontrado payment por locator con asientos:', paymentByLocator.seats.length);
              
              paymentByLocator.seats.forEach(seat => {
                if (seat.id) {
                  reservedSeats[seat.id] = {
                    estado: transaction.status === 'pending' ? 'reservado' : 'pagado',
                    transactionId: transaction.id,
                    locator: transaction.locator,
                    createdAt: transaction.created_at
                  };
                  console.log('✅ [loadReservedSeats] Asiento reservado por locator:', seat.id);
                }
              });
            }
          } catch (locatorError) {
            console.warn('⚠️ [loadReservedSeats] Error buscando por locator:', locatorError);
          }
        }
      }
    }
    
    // Procesar payments directamente
    if (payments) {
      payments.forEach(payment => {
        if (payment.seats && Array.isArray(payment.seats)) {
          payment.seats.forEach(seat => {
            if (seat.id) {
              reservedSeats[seat.id] = {
                estado: payment.status === 'reservado' ? 'reservado' : 'pagado',
                paymentId: payment.id,
                createdAt: payment.created_at
              };
              console.log('✅ [loadReservedSeats] Asiento desde payments:', seat.id, 'Estado:', reservedSeats[seat.id].estado);
            }
          });
        }
      });
    }
    
    console.log('✅ [loadReservedSeats] Total asientos reservados cargados:', Object.keys(reservedSeats).length);
    console.log('🔍 [loadReservedSeats] Asientos reservados:', Object.keys(reservedSeats));
    return reservedSeats;
    
  } catch (error) {
    console.error('❌ [loadReservedSeats] Error general:', error);
    return {};
  }
};

// Función para asegurar que todos los asientos estén disponibles
const ensureAllSeatsAvailable = (mapa) => {
  if (!mapa || !mapa.contenido) {
    return mapa;
  }
  
  try {
    const contenido = Array.isArray(mapa.contenido) ? mapa.contenido : JSON.parse(mapa.contenido);
    
    const contenidoConEstados = contenido.map(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        const sillasConEstado = elemento.sillas.map(silla => ({
          ...silla,
          estado: 'disponible' // Forzar estado disponible
        }));
        
        return {
          ...elemento,
          sillas: sillasConEstado
        };
      }
      return elemento;
    });
    
    return {
      ...mapa,
      contenido: contenidoConEstados
    };
    
  } catch (error) {
    console.error('❌ [ensureAllSeatsAvailable] Error:', error);
    return mapa;
  }
};

// Función para aplicar estados de asientos al mapa
const applySeatStates = (mapa, reservedSeats) => {
  if (!mapa || !mapa.contenido || Object.keys(reservedSeats).length === 0) {
    // Si no hay asientos reservados, asegurar que todos estén disponibles
    return ensureAllSeatsAvailable(mapa);
  }
  
  console.log('🔍 [applySeatStates] Aplicando estados a mapa con', Object.keys(reservedSeats).length, 'asientos reservados');
  
  try {
    const contenido = Array.isArray(mapa.contenido) ? mapa.contenido : JSON.parse(mapa.contenido);
    
    // Recorrer el contenido del mapa y aplicar estados
    const contenidoConEstados = contenido.map(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        const sillasConEstado = elemento.sillas.map(silla => {
          const seatId = silla.id || silla._id;
          if (seatId && reservedSeats[seatId]) {
            return {
              ...silla,
              estado: reservedSeats[seatId].estado,
              transactionId: reservedSeats[seatId].transactionId,
              locator: reservedSeats[seatId].locator
            };
          }
          // Si no hay datos de reserva, asegurar que esté disponible
          return {
            ...silla,
            estado: 'disponible'
          };
        });
        
        return {
          ...elemento,
          sillas: sillasConEstado
        };
      }
      return elemento;
    });
    
    return {
      ...mapa,
      contenido: contenidoConEstados
    };
    
  } catch (error) {
    console.error('❌ [applySeatStates] Error aplicando estados:', error);
    return mapa;
  }
};

export const saveMapa = async (salaId, data) => {
  if (!supabaseAdmin) {
    const resp = await fetch(`/api/mapas/${salaId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contenido: data.contenido || [],
        tenant_id: data.tenant_id 
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Error al guardar mapa');
    }
    return;
  }
  const client = supabaseAdmin;
  const { error } = await client
    .from('mapas')
    .upsert({ 
      sala_id: salaId, 
      contenido: data.contenido || [],
      tenant_id: data.tenant_id 
    }, { onConflict: 'sala_id' });
  handleError(error);
};

export const syncSeatsForSala = async (salaId, options = {}) => {
  const deleteMissing = !!options.deleteMissing;
  if (!supabaseAdmin) {
    const query = deleteMissing ? '?syncOnly=1&deleteMissing=1' : '?syncOnly=1';
    const resp = await fetch(`/api/mapas/${salaId}/save${query}`, { method: 'POST' });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Error al sincronizar seats');
    }
    return;
  }
  // Rama admin directa: mantener comportamiento existente (inserciones básicas)
  const client = supabaseAdmin;
  const { data: mapa, error: mapaErr } = await client
    .from('mapas')
    .select('*')
    .eq('sala_id', salaId)
    .maybeSingle();
  handleError(mapaErr);
  if (!mapa || !Array.isArray(mapa.contenido)) return;

  const { data: funciones, error: funcErr } = await client
    .from('funciones')
    .select('id')
    .eq('sala', salaId);
  handleError(funcErr);
  if (!funciones || funciones.length === 0) return;

  const seatDefs = [];
  mapa.contenido.forEach(el => {
    if (el.type === 'mesa') {
      (el.sillas || []).forEach(s => { if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || 'general' }); });
    } else if (el.type === 'silla') {
      if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || 'general' });
    }
  });

  for (const func of funciones) {
    const { data: existing, error: exErr } = await client
      .from('seats')
      .select('_id')
      .eq('funcion_id', func.id);
    handleError(exErr);

    const existingIds = new Set((existing || []).map(s => s._id));
    const toInsert = seatDefs
      .filter(s => !existingIds.has(s.id))
      .map(s => ({
        _id: uuidv5(`${s.id}::${func.id}`, uuidv5.URL), // Generar UUID v5 válido
        funcion_id: func.id,
        zona: s.zona,
        status: 'disponible',
        bloqueado: false,
      }));

    if (toInsert.length > 0) {
      const { error: insErr } = await client
        .from('seats')
        .upsert(toInsert, { onConflict: 'funcion_id,_id', ignoreDuplicates: false });
      handleError(insErr);
    }
  }
};

// Bloquear o desbloquear varios asientos por ID
export const setSeatsBlocked = async (seatIds, bloqueado) => {
  const normalized = seatIds.map((id) =>
    typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id
  );
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('seats')
    .update({ bloqueado })
    .in('_id', normalized);

  handleError(error);
  return data;
};

// === ENTRADAS ===
export const fetchEntradas = async () => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Usuario no autenticado, retornando entradas vacías');
      return [];
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      console.warn('Usuario sin tenant_id válido, retornando entradas vacías');
      return [];
    }

    console.log('🔍 [apibackoffice] Obteniendo entradas para tenant:', profile.tenant_id);

    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('nombre_entrada');

    if (error) {
      console.error('Error fetching entradas:', error);
      throw new Error('Error fetching entradas: ' + error.message);
    }

    console.log('🔍 [apibackoffice] Entradas obtenidas:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchEntradas:', error);
    return [];
  }
};

export const fetchEntradasByRecinto = async (recintoId) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Usuario no autenticado, retornando entradas vacías');
      return [];
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      console.warn('Usuario sin tenant_id válido, retornando entradas vacías');
      return [];
    }

    console.log('🔍 [apibackoffice] Obteniendo entradas para recinto:', recintoId, 'tenant:', profile.tenant_id);

    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .eq('recinto', recintoId)
      .eq('tenant_id', profile.tenant_id)
      .order('nombre_entrada');

    if (error) {
      console.error('Error fetching entradas by recinto:', error);
      throw new Error('Error fetching entradas by recinto: ' + error.message);
    }

    console.log('🔍 [apibackoffice] Entradas por recinto obtenidas:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchEntradasByRecinto:', error);
    return [];
  }
};

export const fetchEntradaById = async (id) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (error) {
      console.error('Error fetching entrada by id:', error);
      throw new Error('Error fetching entrada by id: ' + error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchEntradaById:', error);
    throw error;
  }
};

export const createEntrada = async (data) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    // Asignar tenant_id a la entrada
    const entradaWithTenant = {
      ...data,
      tenant_id: profile.tenant_id
    };

    console.log('🔍 [apibackoffice] Creando entrada con tenant_id:', profile.tenant_id);

    const { data: result, error } = await supabase
      .from('entradas')
      .insert([entradaWithTenant])
      .select()
      .single();

    if (error) {
      console.error('Error creating entrada:', error);
      throw new Error('Error creating entrada: ' + error.message);
    }

    console.log('🔍 [apibackoffice] Entrada creada exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error in createEntrada:', error);
    throw error;
  }
};

export const updateEntrada = async (id, data) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    // Asegurar que el tenant_id se mantenga
    const entradaWithTenant = {
      ...data,
      tenant_id: profile.tenant_id
    };

    console.log('🔍 [apibackoffice] Actualizando entrada con tenant_id:', profile.tenant_id);

    const { data: result, error } = await supabase
      .from('entradas')
      .update(entradaWithTenant)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id) // Solo actualizar entradas del tenant actual
      .select()
      .single();

    if (error) {
      console.error('Error updating entrada:', error);
      throw new Error('Error updating entrada: ' + error.message);
    }

    console.log('🔍 [apibackoffice] Entrada actualizada exitosamente:', result);
    return result;
  } catch (error) {
    console.error('Error in updateEntrada:', error);
    throw error;
  }
};

export const deleteEntrada = async (id) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    console.log('🔍 [apibackoffice] Eliminando entrada con tenant_id:', profile.tenant_id);

    const { error } = await supabase
      .from('entradas')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id); // Solo eliminar entradas del tenant actual

    if (error) {
      console.error('Error deleting entrada:', error);
      throw new Error('Error deleting entrada: ' + error.message);
    }

    console.log('🔍 [apibackoffice] Entrada eliminada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteEntrada:', error);
    throw error;
  }
};

// Obtener página CMS por ID o slug
export const fetchCmsPage = async (identifier) => {
  const [hasCreatedAt, hasUpdatedAt] = await Promise.all([
    hasColumn('cms_pages', 'created_at'),
    hasColumn('cms_pages', 'updated_at')
  ]);

  try {
    // Inicializar variables para evitar destructuración de null
    let data = null;
    let error = null;

    // Si el identificador es un número, buscar por ID
    if (!isNaN(identifier) && Number.isInteger(Number(identifier))) {
      console.log(`🔍 [fetchCmsPage] Buscando página por ID: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('*')
        .eq('id', parseInt(identifier))
        .maybeSingle();
      data = result?.data || null;
      error = result?.error || null;
    } else {
      // Si es un string, buscar por slug
      console.log(`🔍 [fetchCmsPage] Buscando página por slug: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('*')
        .ilike('slug', identifier)
        .maybeSingle();
      data = result?.data || null;
      error = result?.error || null;

      // Si no se encuentra por slug, buscar por nombre como fallback
      if (!data && !error) {
        console.log(`🔍 [fetchCmsPage] Fallback: buscando por nombre: ${identifier}`);
        const fallback = await supabase
          .from('cms_pages')
          .select('*')
          .ilike('nombre', identifier)
          .maybeSingle();
        data = fallback?.data || null;
        error = fallback?.error || null;
      }
    }

    // Si se encuentra la página, retornarla
    if (data) {
      console.log(`✅ [fetchCmsPage] Página encontrada: ${data.slug} (ID: ${data.id})`);
      return data;
    }

    // Si no se encuentra, NO crear página automáticamente
    if (!error) {
      console.warn(`⚠️ [fetchCmsPage] Página no encontrada: ${identifier} - NO se creará automáticamente`);
      return null;
    }

    // Si hay error de Supabase, logearlo
    if (error) {
      console.error('❌ [fetchCmsPage] Error de Supabase:', error);
      return null;
    }

    return null;
  } catch (error) {
    console.error('❌ [fetchCmsPage] Error general:', error);
    return null;
  }
};

// Guardar widgets en una página CMS por slug o ID
export const saveCmsPage = async (identifier, widgets) => {
  try {
    const [hasCreatedAt, hasUpdatedAt] = await Promise.all([
      hasColumn('cms_pages', 'created_at'),
      hasColumn('cms_pages', 'updated_at')
    ]);

    let existingPage = null;
    let checkError = null;

    // Si el identificador es un número, buscar por ID
    if (!isNaN(identifier) && Number.isInteger(Number(identifier))) {
      console.log(`🔍 [saveCmsPage] Buscando página por ID: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('id, slug')
        .eq('id', parseInt(identifier))
        .maybeSingle();
      existingPage = result?.data || null;
      checkError = result?.error || null;
    } else {
      // Si es un string, buscar por slug
      console.log(`🔍 [saveCmsPage] Buscando página por slug: ${identifier}`);
      const result = await supabase
        .from('cms_pages')
        .select('id, slug')
        .ilike('slug', identifier)
        .maybeSingle();
      existingPage = result?.data || null;
      checkError = result?.error || null;
    }

    if (checkError) {
      console.error('❌ [saveCmsPage] Error checking page existence:', checkError);
      throw new Error('Error al verificar la página');
    }

    let result;
    const now = new Date().toISOString();

    if (existingPage) {
      // Actualizar página existente
      console.log(`✅ [saveCmsPage] Actualizando página existente: ${existingPage.slug} (ID: ${existingPage.id})`);
      const updateData = { widgets };
      if (hasUpdatedAt) updateData.updated_at = now;
      
      result = await supabase
        .from('cms_pages')
        .update(updateData)
        .eq('id', existingPage.id);
    } else {
      // NO crear nueva página automáticamente
      console.warn(`⚠️ [saveCmsPage] Página no encontrada: ${identifier} - NO se creará automáticamente`);
      throw new Error(`Página no encontrada: ${identifier}`);
    }

    if (result.error) {
      console.error('❌ [saveCmsPage] Error al guardar página CMS:', result.error);
      throw new Error('Error al guardar la página');
    }

    console.log(`✅ [saveCmsPage] Página guardada exitosamente: ${identifier}`);
    return result.data;
  } catch (error) {
    console.error('❌ [saveCmsPage] Error general:', error);
    throw error;
  }
};

// === ABONOS ===
export const fetchAbonosByUser = async (userId) => {
  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('usuario_id', userId);
  handleError(error);
  return data;
};

export const createAbono = async (data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('abonos').insert(data).single();
  handleError(error);
  return result;
};

export const renewAbono = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client.from('abonos').update(data).eq('id', id).single();
  handleError(error);
  return result;
};

export const fetchPlantillasPorRecintoYSala = async (recintoId, salaId) => {
  const { data, error } = await supabase
    .from('plantillas')
    .select('*')
    .eq('recinto_id', recintoId)
    .eq('sala_id', salaId);

  if (error) {
    console.error('Error al obtener plantillas:', error);
    throw new Error('No se pudieron cargar las plantillas');
  }

  return data;
};

// === PAYMENTS ===
// Función auxiliar para normalizar los asientos
const parseSeatsArray = (rawSeats) => {
  try {
    let seats = rawSeats;
    
    // Si es null o undefined, retornar array vacío
    if (seats == null) return [];
    
    // Si ya es un array, validar y retornar
    if (Array.isArray(seats)) {
      return seats.filter(seat => seat && typeof seat === 'object');
    }
    
    // Si es string, intentar parsear
    if (typeof seats === 'string') {
      // Limpiar el string antes de parsear
      const cleanString = seats.trim();
      if (cleanString === '' || cleanString === 'null' || cleanString === 'undefined') {
        return [];
      }
      
      try {
        const parsed = JSON.parse(cleanString);
        // Si el resultado es un array, retornarlo
        if (Array.isArray(parsed)) {
          return parsed.filter(seat => seat && typeof seat === 'object');
        }
        // Si es un objeto individual, envolverlo en array
        if (parsed && typeof parsed === 'object') {
          return [parsed];
        }
        return [];
      } catch (parseError) {
        console.error('Error parsing seats JSON string:', parseError, 'Raw string:', seats);
        return [];
      }
    }
    
    // Si es un objeto individual, envolverlo en array
    if (seats && typeof seats === 'object' && !Array.isArray(seats)) {
      return [seats];
    }
    
    return [];
  } catch (e) {
    console.error('Error parsing seats data:', e, 'Raw data:', rawSeats);
    return [];
  }
};

export const createPayment = async (data) => {
  const client = supabaseAdmin || supabase;
  console.log('createPayment request:', data);

  // Validar que los asientos no estén ya vendidos
  const seats = parseSeatsArray(data.seats);
  if (seats.length > 0) {
    const funcionId = data.funcion;

    console.log('🔍 Validando asientos antes de crear pago:', { seats, funcionId });

    for (const seat of seats) {
      const existingPayment = await fetchPaymentBySeat(funcionId, seat.id);
      if (existingPayment && existingPayment.status === 'pagado') {
        throw new Error(`El asiento ${seat.id} ya está vendido (locator: ${existingPayment.locator})`);
      }
      
      // También verificar asientos reservados
      if (existingPayment && existingPayment.status === 'reservado') {
        throw new Error(`El asiento ${seat.id} ya está reservado (locator: ${existingPayment.locator})`);
      }
    }
  }

  // Asegurar que seats se almacene como JSON válido
  const seatsForDB = parseSeatsArray(data.seats);
  
  // Validar que los asientos tengan la estructura correcta
  const validatedSeats = seatsForDB.map(seat => {
    if (!seat.id && !seat._id) {
      throw new Error(`Asiento sin ID válido: ${JSON.stringify(seat)}`);
    }
    return {
      id: seat.id || seat._id,
      name: seat.name || seat.nombre || 'Asiento',
      price: parseFloat(seat.price || seat.precio || 0),
      zona: seat.zona?.nombre || seat.zona || 'General',
      mesa: seat.mesa?.nombre || seat.mesa || null,
      ...(seat.abonoGroup ? { abonoGroup: seat.abonoGroup } : {})
    };
  });

  // Agregar campos faltantes
  const enrichedData = {
    ...data,
    seats: validatedSeats, // Usar la versión validada
    tenant_id: data.tenant_id || '9dbdb86f-8424-484c-bb76-0d9fa27573c8', // Tenant por defecto
    monto: data.monto || calculateTotalAmount(validatedSeats), // Calcular monto si no está presente
    payment_gateway_id: data.payment_gateway_id || '7e797aa6-ebbf-4b3a-8b5d-caa8992018f4', // Gateway por defecto (Reservas)
    created_at: new Date().toISOString()
  };

  console.log('🔍 Datos enriquecidos para crear pago:', enrichedData);
  console.log('🔍 Tipo de seats:', typeof enrichedData.seats);
  console.log('🔍 Seats es array:', Array.isArray(enrichedData.seats));
  console.log('🔍 Seats contenido:', JSON.stringify(enrichedData.seats, null, 2));

  const { data: result, error } = await client
    .from('payments')
    .insert(enrichedData)
    .select()
    .single();
  handleError(error);
  console.log('createPayment response:', { result, error });
  return result;
};

// Función auxiliar para calcular el monto total
const calculateTotalAmount = (seatsData) => {
  try {
    const seats = parseSeatsArray(seatsData);
    return seats.reduce((total, seat) => total + (seat.price || 0), 0);
  } catch (e) {
    console.error('Error calculando monto total:', e);
    return 0;
  }
};

export const updatePayment = async (id, data) => {
  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client
    .from('payments')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return result;
};

export const fetchPayments = async () => {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client.from('payments').select('*');
  handleError(error);
  return data;
};

export const fetchPaymentByLocator = async (locator) => {
  const client = supabaseAdmin || supabase;
  
  console.log('🔍 [fetchPaymentByLocator] Buscando pago por localizador:', locator);
  
  if (!locator) {
    console.warn('🔍 [fetchPaymentByLocator] Localizador no proporcionado');
    return { data: null, error: null };
  }
  
  try {
    const { data, error } = await client
      .from('payments')
      .select(`
        *,
        seats,
        funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
        event:eventos(id, nombre),
        user:profiles!usuario_id(id, login, empresa, telefono)
      `)
      .eq('locator', locator)
      .single();
    
    if (error) {
      console.error('🔍 [fetchPaymentByLocator] Error:', error);
      return { data: null, error };
    }
    
    if (data) {
      // Procesar los seats para incluir información adicional
      const seats = parseSeatsArray(data.seats);
      const processedPayment = {
        ...data,
        seatsCount: seats.length,
        totalAmount: seats.reduce((sum, seat) => sum + (seat.price || 0), 0),
        seats: seats
      };
      
      console.log('🔍 [fetchPaymentByLocator] Pago encontrado:', processedPayment.id);
      return { data: processedPayment, error: null };
    }
    
    return { data: null, error: null };
  } catch (error) {
    console.error('🔍 [fetchPaymentByLocator] Error inesperado:', error);
    return { data: null, error };
  }
};

export const fetchPaymentBySeat = async (funcionId, seatId) => {
  const client = supabaseAdmin || supabase;
  
  console.log('🔍 [fetchPaymentBySeat] Buscando asiento:', { funcionId, seatId });
  
  if (!funcionId || !seatId) {
    console.warn('🔍 [fetchPaymentBySeat] Parámetros inválidos:', { funcionId, seatId });
    return null;
  }
  
  try {
    // Buscar pagos que contengan el asiento específico usando múltiples estrategias
    let query = client
      .from('payments')
      .select('*, seats, funcion, event:eventos(*), user:profiles!usuario_id(*)')
      .eq('funcion', funcionId);
    
    // Usar contains para buscar en el array de seats - corregir el formato
    const { data, error } = await query
      .contains('seats', [{ id: seatId }])
      .or(`seats.cs.[{"_id":"${seatId}"}],seats.cs.[{"id":"${seatId}"}]`);
    
    console.log('🔍 [fetchPaymentBySeat] Resultado:', { data, error });
    
    if (error) {
      console.error('🔍 [fetchPaymentBySeat] Error:', error);
      // Si hay error con contains, continuar con búsqueda manual
    }
    
    // Si no se encuentra con contains o hay error, intentar con una búsqueda más amplia
    if (!data || data.length === 0 || error) {
      console.log('🔍 [fetchPaymentBySeat] No se encontró con contains o hubo error, intentando búsqueda manual...');
      
      // Obtener todos los pagos para esta función y buscar manualmente
      const { data: allPayments, error: allError } = await client
        .from('payments')
        .select('*, seats, funcion, event:eventos(*), user:profiles!usuario_id(*)')
        .eq('funcion', funcionId);
      
      if (allError) {
        console.error('🔍 [fetchPaymentBySeat] Error obteniendo todos los pagos:', allError);
        return null;
      }
      
      // Buscar manualmente en los seats de cada pago
      for (const payment of allPayments || []) {
        const paymentSeats = parseSeatsArray(payment.seats);
        const foundSeat = paymentSeats.find(seat => 
          seat.id === seatId || seat._id === seatId
        );
        
        if (foundSeat) {
          console.log('🔍 [fetchPaymentBySeat] Asiento encontrado manualmente en pago:', payment.id);
          return payment;
        }
      }
    }
    
    // Retornar el primer pago encontrado
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('🔍 [fetchPaymentBySeat] Error inesperado:', error);
    return null;
  }
};

// Nueva función para buscar pagos por email de usuario
export const fetchPaymentsByUserEmail = async (email) => {
  const client = supabaseAdmin || supabase;
  
  console.log('🔍 [fetchPaymentsByUserEmail] Buscando pagos por email:', email);
  
  if (!email) {
    console.warn('🔍 [fetchPaymentsByUserEmail] Email no proporcionado');
    return { data: [], error: null };
  }
  
  try {
    // Primero buscar el usuario por email
    const { data: user, error: userError } = await client
      .from('profiles')
      .select('id, login, empresa, telefono')
      .eq('login', email)
      .single();
    
    if (userError) {
      console.error('🔍 [fetchPaymentsByUserEmail] Error buscando usuario:', userError);
      return { data: [], error: userError };
    }
    
    if (!user) {
      console.log('🔍 [fetchPaymentsByUserEmail] Usuario no encontrado');
      return { data: [], error: null };
    }
    
    // Buscar todos los pagos del usuario
    const { data: payments, error: paymentsError } = await client
      .from('payments')
      .select(`
        *,
        seats,
        funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
        event:eventos(id, nombre),
        user:profiles!usuario_id(id, login, empresa, telefono)
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });
    
    if (paymentsError) {
      console.error('🔍 [fetchPaymentsByUserEmail] Error buscando pagos:', paymentsError);
      return { data: [], error: paymentsError };
    }
    
    // Procesar los pagos para incluir información adicional
    const processedPayments = (payments || []).map(payment => {
      const seats = parseSeatsArray(payment.seats);
      return {
        ...payment,
        seatsCount: seats.length,
        totalAmount: seats.reduce((sum, seat) => sum + (seat.price || 0), 0),
        seats: seats
      };
    });
    
    console.log('🔍 [fetchPaymentsByUserEmail] Pagos encontrados:', processedPayments.length);
    return { data: processedPayments, error: null, user };
    
  } catch (error) {
    console.error('🔍 [fetchPaymentsByUserEmail] Error inesperado:', error);
    return { data: [], error };
  }
};

// === CANALES DE VENTA ===
export const fetchCanalesVenta = async () => {
  const { data, error } = await supabase.from('canales_venta').select('*');
  handleError(error);
  return data;
};

// Esta función ya no es necesaria ya que las páginas se cargan directamente desde la base de datos
// y se crean automáticamente cuando se crean eventos

// Función para obtener todas las páginas CMS desde la base de datos
export const fetchAllCmsPages = async () => {
  try {
    console.log('🔍 [fetchAllCmsPages] Obteniendo todas las páginas CMS...');
    
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('❌ [fetchAllCmsPages] Error:', error);
      throw error;
    }

    console.log(`✅ [fetchAllCmsPages] ${data?.length || 0} páginas encontradas`);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchAllCmsPages] Error inesperado:', error);
    return [];
  }
};

// Función para crear una página CMS automáticamente cuando se crea un evento
export const createCmsPageForEvent = async (eventData) => {
  try {
    console.log('🔧 [createCmsPageForEvent] Creando página CMS para evento:', eventData.nombre);
    
    // Generar slug a partir del nombre del evento
    const slug = eventData.nombre
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones múltiples
      .trim();
    
    // Verificar si ya existe una página con ese slug
    const { data: existingPage, error: checkError } = await supabase
      .from('cms_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ [createCmsPageForEvent] Error verificando slug existente:', checkError);
      return null;
    }
    
    if (existingPage) {
      console.log('ℹ️ [createCmsPageForEvent] Ya existe una página con slug:', slug);
      return existingPage;
    }
    
    // Crear la página CMS para el evento
    const { data: newPage, error: insertError } = await supabase
      .from('cms_pages')
      .insert([{
        slug: slug,
        nombre: eventData.nombre,
        widgets: {
          header: [],
          content: [
            {
              type: 'event_header',
              config: {
                title: eventData.nombre,
                description: eventData.descripcion || '',
                image: eventData.imagen || null
              }
            },
            {
              type: 'event_details',
              config: {
                show_date: true,
                show_location: true,
                show_prices: true
              }
            }
          ],
          footer: []
        },
        tenant_id: eventData.tenant_id
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [createCmsPageForEvent] Error creando página CMS:', insertError);
      return null;
    }
    
    console.log('✅ [createCmsPageForEvent] Página CMS creada exitosamente:', newPage.id);
    return newPage;
    
  } catch (error) {
    console.error('❌ [createCmsPageForEvent] Error inesperado:', error);
    return null;
  }
};

// Función para obtener todas las páginas CMS de un tenant específico
export const fetchCmsPagesByTenant = async (tenantId) => {
  try {
    console.log('🔍 [fetchCmsPagesByTenant] Obteniendo páginas CMS para tenant:', tenantId);
    
    const { data, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre');
    
    if (error) {
      console.error('❌ [fetchCmsPagesByTenant] Error:', error);
      throw error;
    }
    
    console.log(`✅ [fetchCmsPagesByTenant] ${data?.length || 0} páginas encontradas`);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchCmsPagesByTenant] Error inesperado:', error);
    return [];
  }
};

// Puedes seguir migrando más entidades según este mismo patrón.
