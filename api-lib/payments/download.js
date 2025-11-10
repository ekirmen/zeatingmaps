// Importaciones estáticas - solo las que no dependen de librerías externas
import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';
import crypto from 'crypto';

// Funciones de tokenUtils inlined para evitar problemas de empaquetado en Vercel
// Usar la misma clave secreta que Supabase Service Role Key para mayor seguridad
const TOKEN_SECRET_KEY = process.env.TICKET_DOWNLOAD_SECRET || 
                         process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         'default-secret-key-change-in-production';

/**
 * Valida un token de descarga (sin verificar expiración, ya que son permanentes)
 * Inlined desde tokenUtils.js para evitar problemas de empaquetado en Vercel
 * 
 * @param {string} token - Token a validar
 * @returns {Object|null} Payload del token si es válido, null si es inválido
 */
function validateDownloadToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('⚠️ [TOKEN] Token no proporcionado o inválido');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.warn('⚠️ [TOKEN] Formato de token inválido (debe tener 2 partes separadas por punto)');
      return null;
    }
    
    const [payloadBase64, signature] = parts;
    if (!payloadBase64 || !signature) {
      console.warn('⚠️ [TOKEN] Token incompleto');
      return null;
    }
    
    // Decodificar el payload
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadString);
    
    // Verificar firma
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET_KEY)
      .update(payloadString)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('⚠️ [TOKEN] Firma inválida - token posiblemente modificado');
      return null;
    }
    
    // Validar que el payload tenga los campos requeridos
    if (!payload.locator || !payload.userId || !payload.paymentId) {
      console.warn('⚠️ [TOKEN] Payload incompleto - faltan campos requeridos');
      return null;
    }
    
    // Validar que el source sea 'email'
    if (payload.source !== 'email') {
      console.warn('⚠️ [TOKEN] Source inválido:', payload.source);
      return null;
    }
    
    console.log('✅ [TOKEN] Token válido para locator:', payload.locator);
    return payload;
  } catch (error) {
    console.error('❌ [TOKEN] Error validando token:', error.message);
    console.error('❌ [TOKEN] Error stack:', error.stack);
    return null;
  }
}

// Las importaciones de pdf-lib, qrcode y download-seat-pages se harán dinámicamente
// para evitar que el módulo falle al inicializarse si estas dependencias no están disponibles
let PDFDocument, rgb, StandardFonts, QRCode, drawSeatPage, loadEventImages;

// Función helper para cargar las dependencias de PDF dinámicamente
async function loadPdfDependencies() {
  if (PDFDocument && rgb && StandardFonts && QRCode && drawSeatPage && loadEventImages) {
    return { PDFDocument, rgb, StandardFonts, QRCode, drawSeatPage, loadEventImages };
  }

  try {
    // Cargar pdf-lib
    const pdfLib = await import('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
    rgb = pdfLib.rgb;
    StandardFonts = pdfLib.StandardFonts;

    // Cargar qrcode
    const qrcodeModule = await import('qrcode');
    QRCode = qrcodeModule.default || qrcodeModule;

    // Cargar download-seat-pages
    const seatPagesModule = await import('./download-seat-pages.js');
    drawSeatPage = seatPagesModule.drawSeatPage;
    loadEventImages = seatPagesModule.loadEventImages;

    return { PDFDocument, rgb, StandardFonts, QRCode, drawSeatPage, loadEventImages };
  } catch (error) {
    console.error('❌ [DOWNLOAD] Error cargando dependencias de PDF:', error);
    throw new Error(`Failed to load PDF dependencies: ${error.message}`);
  }
}


export async function handleDownload(req, res) {
  try {
    console.log('🚀 [DOWNLOAD] Endpoint llamado con método:', req.method);
    console.log('🔍 [DOWNLOAD] Query params:', req.query);
    console.log('🔍 [DOWNLOAD] Headers:', Object.keys(req.headers || {}));
    
    // Validar req y res
    if (!req || !res) {
      console.error('❌ [DOWNLOAD] req o res no están disponibles');
      throw new Error('Request or response object is missing');
    }

    if (req.method !== 'GET') {
      if (!res.headersSent) {
        res.setHeader('Allow', 'GET');
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({ 
          error: {
            code: '405',
            message: 'Method not allowed'
          }
        });
      }
      return;
    }

    const { locator, mode = 'full', token: downloadToken, source } = req.query || {};
    
    if (!locator) {
      console.error('❌ [DOWNLOAD] Missing locator in query params');
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ 
          error: {
            code: '400',
            message: 'Missing locator'
          }
        });
      }
      return;
    }

    console.log('📋 [DOWNLOAD] Locator:', locator);
    console.log('📋 [DOWNLOAD] Mode:', mode);

    // Si es modo simple, generar PDF básico sin autenticación ni dependencias externas
    if (mode === 'simple') {
      console.log('📄 [DOWNLOAD] Modo simple detectado, generando PDF de prueba...');
      return await generateSimplePDF(req, res, locator);
    }

    // Para modo completo, cargar dependencias de PDF dinámicamente
    try {
      console.log('📦 [DOWNLOAD] Cargando dependencias de PDF...');
      await loadPdfDependencies();
      console.log('✅ [DOWNLOAD] Dependencias de PDF cargadas correctamente');
    } catch (depError) {
      console.error('❌ [DOWNLOAD] Error cargando dependencias de PDF:', depError);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: {
            code: '500',
            message: 'Server configuration error - Failed to load PDF dependencies',
            details: depError.message
          }
        });
      }
      return;
    }

    // Para modo completo, validar configuración
    const config = getConfig();
    const { supabaseUrl, supabaseServiceKey } = config;
    const isValidConfig = validateConfig(config);
    const supabaseAdmin = getSupabaseAdmin(config);

    if (!isValidConfig || !supabaseAdmin) {
      console.error('❌ [DOWNLOAD] Configuración inválida, redirigiendo a error 500');
      console.error('❌ [DOWNLOAD] Config details:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        nodeEnv: config.nodeEnv,
        vercelEnv: config.vercelEnv
      });
      
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
          error: {
            code: '500',
            message: 'Server configuration error - Missing Supabase environment variables'
          },
          details: process.env.NODE_ENV === 'development' ? {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceKey: !!supabaseServiceKey,
            nodeEnv: config.nodeEnv,
            vercelEnv: config.vercelEnv
          } : undefined
        });
      }
      return;
    }
    
    console.log('✅ [DOWNLOAD] Configuración validada correctamente');
    
    // Validar token de descarga si viene en query params (para enlaces de correo)
    let tokenPayload = null;
    if (downloadToken) {
      console.log('🔑 [DOWNLOAD] Token de descarga detectado en query params');
      tokenPayload = validateDownloadToken(downloadToken);
      
      if (!tokenPayload) {
        console.error('❌ [DOWNLOAD] Token de descarga inválido o expirado');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(403).json({ 
            error: {
              code: '403',
              message: 'Token inválido o expirado'
            }
          });
        }
        return;
      }
      
      // Verificar que el token corresponde al locator
      if (tokenPayload.locator !== locator) {
        console.error('❌ [DOWNLOAD] Token no corresponde al localizador');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(403).json({ 
            error: {
              code: '403',
              message: 'Token no corresponde al localizador'
            }
          });
        }
        return;
      }
      
      console.log('✅ [DOWNLOAD] Token de descarga válido para locator:', locator);
    }
    
    // Determinar el origen de la descarga
    const downloadSource = source || (tokenPayload ? 'email' : 'web');
    console.log('📥 [DOWNLOAD] Origen de descarga:', downloadSource);
    
    // Si viene de web, requiere autenticación (pero puede continuar sin token para permitir descargas desde perfil)
    let user = null;
    if (downloadSource === 'web' && !tokenPayload) {
      const authHeader = req.headers.authorization || '';
      const authToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      
      if (authToken) {
        // Verificar token de autenticación solo si está presente
        try {
          console.log('🔐 [DOWNLOAD] Verificando token de autenticación...');
          const userResp = await supabaseAdmin?.auth?.getUser?.(authToken);
          user = userResp?.data?.user || null;
          const userError = userResp?.error || null;
          
          if (userError || !user) {
            console.error('❌ [DOWNLOAD] Auth error o usuario no encontrado:', userError);
            // No bloquear la descarga si hay error de autenticación, pero continuar sin user
            console.warn('⚠️ [DOWNLOAD] Continuando sin autenticación debido a error de token');
            user = null;
          } else {
            console.log('✅ [DOWNLOAD] Usuario autenticado correctamente:', user.id);
          }
        } catch (authError) {
          console.error('❌ [DOWNLOAD] Error llamando getUser:', authError);
          console.warn('⚠️ [DOWNLOAD] Continuando sin autenticación debido a error');
          // No bloquear la descarga, continuar sin user
          user = null;
        }
      } else {
        console.warn('⚠️ [DOWNLOAD] No hay token de autenticación en headers (descarga desde web sin autenticación)');
        // Continuar sin autenticación - permitir descargas públicas si el locator es válido
        user = null;
      }
    } else if (tokenPayload) {
      // Si viene con token, usar el userId del token
      console.log('🔑 [DOWNLOAD] Usando userId del token:', tokenPayload.userId);
      // Crear objeto usuario mínimo para logging y registro
      user = { id: tokenPayload.userId };
    }

    // Get payment data - tolerante a duplicados en payment_transactions
    console.log('🔍 [DOWNLOAD] Buscando pago con localizador:', locator);
    console.log('🔍 [DOWNLOAD] supabaseAdmin disponible para consulta:', supabaseAdmin ? '✅ sí' : '❌ no');
    
    let locatorMatches, locatorError;
    try {
      // Obtener TODOS los campos del pago, incluyendo evento_id y funcion_id
      // Nota: Los joins pueden fallar si las foreign keys no están configuradas en Supabase
      // Por eso haremos consultas separadas como fallback
      const result = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('locator', locator)
        .order('created_at', { ascending: false })
        .limit(5);
      locatorMatches = result.data;
      locatorError = result.error;
      
      console.log('🔍 [DOWNLOAD] Resultado de la consulta:', {
        hasData: !!locatorMatches,
        dataLength: locatorMatches?.length || 0,
        hasError: !!locatorError,
        errorMessage: locatorError?.message || 'N/A'
      });
      
      if (locatorMatches && locatorMatches.length > 0) {
        const firstMatch = locatorMatches[0];
        console.log('🔍 [DOWNLOAD] Primer resultado tiene:', {
          id: firstMatch.id,
          funcion_id: firstMatch.funcion_id,
          evento_id: firstMatch.evento_id,
          funcion_id_type: typeof firstMatch.funcion_id,
          evento_id_type: typeof firstMatch.evento_id
        });
      }
    } catch (queryError) {
      console.error('❌ [DOWNLOAD] Excepción al buscar por locator:', queryError);
      console.error('❌ [DOWNLOAD] Query error message:', queryError?.message);
      console.error('❌ [DOWNLOAD] Query error stack:', queryError?.stack);
      locatorError = queryError;
      locatorMatches = null;
    }

    if (locatorError) {
      console.error('❌ [DOWNLOAD] Error buscando por locator:', locatorError);
      console.error('❌ [DOWNLOAD] Error message:', locatorError.message);
      console.error('❌ [DOWNLOAD] Error code:', locatorError.code);
      console.error('❌ [DOWNLOAD] Error details:', locatorError.details);
      console.error('❌ [DOWNLOAD] Error hint:', locatorError.hint);
    } else {
      console.log('✅ [DOWNLOAD] Consulta exitosa, resultados encontrados:', locatorMatches ? locatorMatches.length : 0);
    }

    let payment = Array.isArray(locatorMatches) ? locatorMatches[0] : null;

    if (Array.isArray(locatorMatches) && locatorMatches.length > 1) {
      console.warn('⚠️ [DOWNLOAD] Se encontraron múltiples registros para el mismo locator. Usando el más reciente.', {
        totalMatches: locatorMatches.length,
        ids: locatorMatches.map((p) => p.id),
      });
    }

    // Fallback: intentar con order_id si no se encontró por locator (casos legacy)
    if (!payment) {
      console.log('🔄 [DOWNLOAD] Intentando búsqueda alternativa por order_id');
      const { data: orderMatches, error: orderError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('order_id', locator)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orderError) {
        console.error('❌ [DOWNLOAD] Error buscando por order_id:', orderError);
      }

      payment = Array.isArray(orderMatches) ? orderMatches[0] : null;

      if (Array.isArray(orderMatches) && orderMatches.length > 1) {
        console.warn('⚠️ [DOWNLOAD] Se encontraron múltiples registros para el mismo order_id. Usando el más reciente.', {
          totalMatches: orderMatches.length,
          ids: orderMatches.map((p) => p.id),
        });
      }
    }

    if (!payment) {
      console.error('❌ [DOWNLOAD] No se encontró el pago con el locator u order_id proporcionado:', locator);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(404).json({ 
          error: {
            code: '404',
            message: 'Payment not found - No se encontró un pago con el localizador proporcionado'
          },
          locator: locator
        });
      }
      return;
    }

    console.log('✅ [DOWNLOAD] Pago encontrado:', payment.id);
    console.log('✅ [DOWNLOAD] Payment data completo:', {
      id: payment.id,
      locator: payment.locator,
      funcion_id: payment.funcion_id,
      evento_id: payment.evento_id,
      user_id: payment.user_id,
      status: payment.status,
      amount: payment.amount,
      seats_count: Array.isArray(payment.seats) ? payment.seats.length : 0,
      hasEvent: !!payment.event,
      hasFuncion: !!payment.funcion
    });

    // Verificar permisos SOLO para descargas desde web CON usuario autenticado
    if (downloadSource === 'web' && !tokenPayload && user && user.id) {
      // Verificar que el usuario es el dueño o es admin
      const isOwner = payment.user_id === user.id || payment.usuario_id === user.id;
      let isAdmin = false;
      
      try {
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        isAdmin = userRole === 'admin' || userRole === 'gerente' || userRole === 'super_admin';
        
        if (!isAdmin) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          isAdmin = profile?.role === 'admin' || profile?.role === 'gerente' || profile?.role === 'super_admin';
        }
      } catch (roleError) {
        console.warn('⚠️ [DOWNLOAD] Error verificando rol:', roleError.message);
      }
      
      if (!isOwner && !isAdmin) {
        // Log intento no autorizado
        await supabaseAdmin.from('audit_logs').insert({
          action: 'ticket_download_denied',
          details: JSON.stringify({
            attempted_user_id: user.id,
            payment_id: payment.id,
            locator: locator,
            reason: 'User is not owner and not admin'
          }),
          severity: 'warning',
          user_id: user.id
        }).catch(() => {}); // Ignorar errores de audit
        
        console.error('❌ [DOWNLOAD] Usuario no autorizado para descargar este ticket');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(403).json({ 
            error: {
              code: '403',
              message: 'Access denied - No tienes permiso para descargar este ticket'
            }
          });
        }
        return;
      }
      
      // 🔒 RATE LIMITING solo para descargas desde web con usuario autenticado
      try {
        // Verificar descargas recientes del usuario (últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentDownloads, error: rateLimitError } = await supabaseAdmin
          .from('ticket_downloads')
          .select('id, downloaded_at')
          .eq('user_id', user.id)
          .gte('downloaded_at', fiveMinutesAgo)
          .order('downloaded_at', { ascending: false });
        
        if (!rateLimitError && recentDownloads && recentDownloads.length >= 10) {
          console.warn('⚠️ [DOWNLOAD] Rate limit excedido para usuario:', user.id);
          
          // Log intento bloqueado
          await supabaseAdmin
            .from('audit_logs')
            .insert({
              action: 'ticket_download_rate_limited',
              details: JSON.stringify({
                user_id: user.id,
                locator: locator,
                recent_downloads_count: recentDownloads.length,
                ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
              }),
              severity: 'warning',
              user_id: user.id,
              url: req.url
            })
            .catch(() => {}); // Ignorar errores de audit
          
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(429).json({ 
              error: {
                code: '429',
                message: 'Too many requests - Por favor espera unos minutos antes de intentar nuevamente'
              }
            });
          }
          return;
        }
      } catch (rateLimitErr) {
        console.warn('⚠️ [DOWNLOAD] Error verificando rate limit:', rateLimitErr.message);
        // Continuar si hay error en rate limiting (no bloquear descarga)
      }
    } else if (tokenPayload) {
      // Si viene con token, verificar que el userId del token coincida con payment.user_id
      if (tokenPayload.userId !== payment.user_id && tokenPayload.userId !== payment.usuario_id) {
        console.error('❌ [DOWNLOAD] Token no válido para este pago');
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(403).json({ 
            error: {
              code: '403',
              message: 'Token no válido para este pago'
            }
          });
        }
        return;
      }
      
      // Usar userId del token para el registro
      user = user || { id: tokenPayload.userId };
    }

    // Parse seats from payment.seats JSON (preferir asientos comprados)
    let parsedSeats = [];
    try {
      if (Array.isArray(payment.seats)) parsedSeats = payment.seats;
      else if (typeof payment.seats === 'string') {
        try { parsedSeats = JSON.parse(payment.seats); } catch { parsedSeats = JSON.parse(JSON.parse(payment.seats)); }
      }
    } catch { parsedSeats = []; }
    payment.seats = parsedSeats;

    // Registrar la descarga del ticket (asíncrono, no bloquea la descarga)
    // Esto se hace después de parsear los asientos para obtener el conteo correcto
    if (user && user.id) {
      try {
        const downloadData = {
          payment_id: payment.id,
          locator: locator || payment.locator,
          user_id: user.id,
          tenant_id: payment.tenant_id || null,
          downloaded_at: new Date().toISOString(),
          download_method: downloadSource === 'email' ? 'email_link' : 'pdf_download',
          user_agent: req.headers['user-agent'] || null,
          ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || null,
          metadata: {
            payment_status: payment.status,
            seats_count: parsedSeats.length,
            download_source: downloadSource
          }
        };

        // Insertar de forma asíncrona (no esperamos el resultado para no bloquear la descarga)
        supabaseAdmin
          .from('ticket_downloads')
          .insert([downloadData])
          .then(({ error: downloadError }) => {
            if (downloadError) {
              console.warn('⚠️ [DOWNLOAD] Error registrando descarga:', downloadError.message);
            } else {
              console.log('✅ [DOWNLOAD] Descarga registrada para payment:', payment.id, 'con', parsedSeats.length, 'asiento(s), source:', downloadSource);
            }
          })
          .catch((err) => {
            console.warn('⚠️ [DOWNLOAD] Error inesperado registrando descarga:', err.message);
          });
      } catch (downloadLogError) {
        console.warn('⚠️ [DOWNLOAD] Error preparando registro de descarga:', downloadLogError.message);
      }
    }

    // Enriquecer con datos de función y evento/recinto para el PDF
    let funcionData = null;
    let eventData = null;
    let venueData = null;
    try {
      console.log('🔍 [DOWNLOAD] Obteniendo datos de función/evento/recinto...');
      console.log('🔍 [DOWNLOAD] Payment tiene:', {
        funcion_id: payment.funcion_id,
        evento_id: payment.evento_id,
        hasEvent: !!payment.event
      });
      
      if (payment.funcion_id) {
        console.log('🔍 [DOWNLOAD] Buscando función con ID:', payment.funcion_id);
        // Primero obtener evento_id desde la función con más datos
        // funciones.id es serial (integer), pero payment.funcion_id puede ser string o number
        const funcionId = typeof payment.funcion_id === 'string' ? parseInt(payment.funcion_id, 10) : payment.funcion_id;
        console.log('🔍 [DOWNLOAD] Buscando función con ID (convertido):', funcionId, 'tipo:', typeof funcionId);
        
        const { data: func, error: fErr } = await supabaseAdmin
          .from('funciones')
          .select('id, fecha_celebracion, evento_id, apertura_puertas, activo, recinto_id')
          .eq('id', funcionId)
          .maybeSingle();
        
        if (fErr) {
          console.error('❌ [DOWNLOAD] Error obteniendo función:', fErr);
        } else if (func) {
          console.log('✅ [DOWNLOAD] Función obtenida:', {
            id: func.id,
            fecha_celebracion: func.fecha_celebracion,
            evento_id: func.evento_id
          });
          funcionData = func;
          
          // Luego obtener el evento usando evento_id con más datos
          if (!eventData && func.evento_id) {
            console.log('🔍 [DOWNLOAD] Buscando evento con ID (desde función):', func.evento_id);
            const { data: evt, error: eErr } = await supabaseAdmin
              .from('eventos')
              .select('id, nombre, imagenes, recinto, recinto_id, descripcion, tags')
              .eq('id', func.evento_id)
              .maybeSingle();
            
            if (eErr) {
              console.error('❌ [DOWNLOAD] Error obteniendo evento:', eErr);
            } else if (evt) {
              console.log('✅ [DOWNLOAD] Evento obtenido desde consulta directa:', {
                id: evt.id,
                nombre: evt.nombre,
                recinto: evt.recinto, // Campo recinto (integer)
                recinto_id: evt.recinto_id, // Campo recinto_id (integer, puede ser null)
                hasImagenes: !!evt.imagenes
              });
              eventData = evt;
              if (!payment.event) payment.event = eventData;
              
              // eventos tiene dos campos: recinto (integer) y recinto_id (integer, nullable)
              // Preferir recinto_id si existe, si no usar recinto
              const recintoId = eventData?.recinto_id || eventData?.recinto;
              
              if (!venueData && recintoId) {
                console.log('🔍 [DOWNLOAD] Buscando recinto con ID (desde evento):', recintoId);
      const { data: rec, error: rErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad, latitud, longitud')
        .eq('id', recintoId)
        .maybeSingle();
                
                if (rErr) {
                  console.error('❌ [DOWNLOAD] Error obteniendo recinto:', rErr);
                } else if (rec) {
                  console.log('✅ [DOWNLOAD] Recinto obtenido desde consulta directa:', {
                    id: rec.id,
                    nombre: rec.nombre,
                    direccion: rec.direccion,
                    ciudad: rec.ciudad
                  });
                  venueData = rec;
                }
              }
            }
          }
        } else {
          console.warn('⚠️ [DOWNLOAD] No se encontró función con ID:', funcionId);
        }
      }
      
      // Si ya hay evento_id en el pago, usarlo directamente (solo si no tenemos eventData)
      if (!eventData && payment.evento_id) {
        console.log('🔍 [DOWNLOAD] Intentando obtener evento directamente con evento_id:', payment.evento_id);
        // evento_id es UUID, no necesita conversión
        const { data: evt, error: eErr } = await supabaseAdmin
          .from('eventos')
          .select('id, nombre, imagenes, recinto, recinto_id, descripcion, tags')
          .eq('id', payment.evento_id)
          .maybeSingle();
        
        if (eErr) {
          console.error('❌ [DOWNLOAD] Error obteniendo evento por evento_id:', eErr);
        } else if (evt) {
          console.log('✅ [DOWNLOAD] Evento obtenido por evento_id:', {
            id: evt.id,
            nombre: evt.nombre,
            recinto: evt.recinto,
            recinto_id: evt.recinto_id
          });
          eventData = evt;
          if (!payment.event) payment.event = eventData;
          
          // Preferir recinto_id si existe, si no usar recinto
          const recintoId = eventData?.recinto_id || eventData?.recinto;
          if (!venueData && recintoId) {
      const { data: rec, error: rErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad, latitud, longitud')
        .eq('id', recintoId)
        .maybeSingle();
            if (!rErr && rec) {
              console.log('✅ [DOWNLOAD] Recinto obtenido por evento_id:', rec.nombre);
              venueData = rec;
            }
          }
        }
      }
      
      // También verificar si la función tiene recinto_id directamente
      if (!venueData && funcionData?.recinto_id) {
        console.log('🔍 [DOWNLOAD] Buscando recinto desde funcion.recinto_id:', funcionData.recinto_id);
        const { data: rec, error: rErr } = await supabaseAdmin
          .from('recintos')
          .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
          .eq('id', funcionData.recinto_id)
          .maybeSingle();
        if (!rErr && rec) {
          console.log('✅ [DOWNLOAD] Recinto obtenido desde funcion.recinto_id:', rec.nombre);
          venueData = rec;
        }
      }
      
      console.log('📊 [DOWNLOAD] Resumen de datos obtenidos:', {
        hasFuncionData: !!funcionData,
        hasEventData: !!eventData,
        hasVenueData: !!venueData,
        eventNombre: eventData?.nombre || 'N/A',
        venueNombre: venueData?.nombre || 'N/A',
        funcionFecha: funcionData?.fecha_celebracion || 'N/A'
      });
    } catch (enrichErr) {
      console.error('❌ [DOWNLOAD] Error enriqueciendo datos de función/evento/recinto:', enrichErr);
      console.error('❌ [DOWNLOAD] Error message:', enrichErr.message);
      console.error('❌ [DOWNLOAD] Error stack:', enrichErr.stack);
    }

    // Generate full PDF with payment data
    try {
      return await generateFullPDF(req, res, payment, locator, { 
        funcionData, 
        eventData, 
        venueData, 
        supabaseAdmin,
        downloadSource // Pasar el origen de la descarga
      });
    } catch (pdfError) {
      console.error('❌ [DOWNLOAD] Error en generateFullPDF:', pdfError);
      console.error('❌ [DOWNLOAD] PDF Error name:', pdfError?.name);
      console.error('❌ [DOWNLOAD] PDF Error message:', pdfError?.message);
      console.error('❌ [DOWNLOAD] PDF Error stack:', pdfError?.stack);
      
      // Si la respuesta ya se envió, no podemos hacer nada
      if (res.headersSent) {
        console.error('❌ [DOWNLOAD] Response already sent, cannot send error response');
        return;
      }
      
      // Enviar respuesta de error en formato JSON
      res.setHeader('Content-Type', 'application/json');
      const responsePayload = {
        error: {
          code: '500',
          message: pdfError?.message || 'Error generando PDF'
        }
      };

      // Agregar detalles en desarrollo
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
        responsePayload.details = pdfError?.stack;
        responsePayload.errorName = pdfError?.name;
      }

      return res.status(500).json(responsePayload);
    }

  } catch (err) {
    console.error('❌ [DOWNLOAD] Error inesperado en handleDownload:', err);
    console.error('❌ [DOWNLOAD] Stack trace:', err?.stack);
    console.error('❌ [DOWNLOAD] Error name:', err?.name);
    console.error('❌ [DOWNLOAD] Error message:', err?.message);
    console.error('❌ [DOWNLOAD] Error type:', typeof err);
    console.error('❌ [DOWNLOAD] Error constructor:', err?.constructor?.name);
    
    // Asegurar que se envíe JSON y no HTML
    // Asegurar que la respuesta no se haya enviado ya
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      const responsePayload = {
        error: {
          code: '500',
          message: err?.message || 'A server error has occurred'
        }
      };

      // Agregar detalles en desarrollo
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
        responsePayload.details = err?.stack;
        responsePayload.errorName = err?.name;
        responsePayload.errorType = typeof err;
      }

      return res.status(500).json(responsePayload);
    } else {
      console.error('❌ [DOWNLOAD] Response already sent, cannot send error response');
    }
  }
}

// Función para generar PDF simple (sin autenticación)
async function generateSimplePDF(req, res, locator) {
  // Validar que los headers no se hayan enviado ya
  if (res.headersSent) {
    console.error('❌ [DOWNLOAD-SIMPLE] Headers already sent, cannot send PDF');
    return;
  }

  try {
    console.log('📄 [DOWNLOAD-SIMPLE] Iniciando generación de PDF simple...');
    console.log('📄 [DOWNLOAD-SIMPLE] Locator:', locator);
    
    // Cargar dependencias de PDF dinámicamente
    const { PDFDocument: PDFDoc, rgb: rgbFunc, StandardFonts: Fonts } = await loadPdfDependencies();
    const PDFDocument = PDFDoc;
    const rgb = rgbFunc;
    const StandardFonts = Fonts;
    console.log('✅ [DOWNLOAD-SIMPLE] Dependencias de PDF cargadas correctamente');
    
    console.log('📄 [DOWNLOAD-SIMPLE] PDFDocument disponible:', typeof PDFDocument);
    console.log('📄 [DOWNLOAD-SIMPLE] StandardFonts disponible:', typeof StandardFonts);
    console.log('📄 [DOWNLOAD-SIMPLE] rgb disponible:', typeof rgb);
    
    // Validar que las importaciones estén disponibles
    if (!PDFDocument || typeof PDFDocument.create !== 'function') {
      throw new Error('PDFDocument is not available or PDFDocument.create is not a function');
    }
    
    if (!StandardFonts || !StandardFonts.Helvetica) {
      throw new Error('StandardFonts is not available');
    }
    
    if (!rgb || typeof rgb !== 'function') {
      throw new Error('rgb function is not available');
    }
    
    // Validar locator
    if (!locator || typeof locator !== 'string') {
      throw new Error('Locator is required and must be a string');
    }

    // Crear PDF simple sin dependencias externas
    console.log('📄 [DOWNLOAD-SIMPLE] Creando documento PDF...');
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.create();
      console.log('✅ [DOWNLOAD-SIMPLE] Documento PDF creado exitosamente');
    } catch (createError) {
      console.error('❌ [DOWNLOAD-SIMPLE] Error creando PDFDocument:', createError);
      throw new Error(`Error creando documento PDF: ${createError.message}`);
    }
    
    console.log('📄 [DOWNLOAD-SIMPLE] Embedding fonts...');
    let helveticaFont, helveticaBold;
    try {
      helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      console.log('✅ [DOWNLOAD-SIMPLE] Fuentes embedidas exitosamente');
    } catch (fontError) {
      console.error('❌ [DOWNLOAD-SIMPLE] Error embediendo fuentes:', fontError);
      throw new Error(`Error embediendo fuentes: ${fontError.message}`);
    }
    
    console.log('📄 [DOWNLOAD-SIMPLE] Adding page...');
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    console.log('📄 [DOWNLOAD-SIMPLE] Drawing content...');
    // Título
    page.drawText('TICKET DE PRUEBA', {
      x: 50,
      y: height - 50,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: helveticaBold,
    });

    // Datos básicos
    let y = height - 90;
    page.drawText(`Localizador: ${locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    page.drawText(`Estado: PAGADO`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 30;

    // Información de prueba
    page.drawText('Este es un ticket de prueba', { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
    y -= 25;
    page.drawText('Generado para verificar la funcionalidad', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    y -= 20;
    page.drawText('de descarga de PDFs', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    y -= 20;

    // Fecha
    try {
      const fechaCreacion = new Date().toLocaleString('es-ES', { 
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      page.drawText(`Fecha de generación: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });
    } catch (dateError) {
      console.warn('⚠️ [DOWNLOAD-SIMPLE] Error formateando fecha:', dateError);
      page.drawText(`Fecha de generación: ${new Date().toISOString()}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });
    }

    // Mensaje de prueba
    page.drawText('Si puedes ver este PDF, la generación está funcionando correctamente', { 
      x: 50, 
      y: 50, 
      size: 10, 
      color: rgb(0.3,0.3,0.3), 
      font: helveticaFont 
    });

    console.log('💾 [DOWNLOAD-SIMPLE] Guardando PDF...');
    const pdfBytes = await pdfDoc.save();
    
    if (!pdfBytes || !(pdfBytes instanceof Uint8Array)) {
      throw new Error('PDF generation returned invalid data');
    }
    
    console.log('✅ [DOWNLOAD-SIMPLE] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');
    console.log('✅ [DOWNLOAD-SIMPLE] pdfBytes type:', typeof pdfBytes, 'is Uint8Array:', pdfBytes instanceof Uint8Array);

    // Verificar que los headers no se hayan enviado
    if (res.headersSent) {
      console.error('❌ [DOWNLOAD-SIMPLE] Headers already sent before sending PDF');
      throw new Error('Response headers already sent');
    }

    // Convertir Uint8Array a Buffer de manera segura
    let buffer;
    if (typeof Buffer !== 'undefined' && Buffer.from) {
      // Node.js environment
      buffer = Buffer.from(pdfBytes);
    } else if (pdfBytes instanceof Uint8Array) {
      // Browser environment or Node.js without Buffer
      buffer = pdfBytes;
    } else {
      throw new Error('Cannot convert PDF bytes to buffer');
    }

    // Headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-prueba-${locator}.pdf"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-SIMPLE] Enviando PDF al cliente, tamaño:', buffer.length, 'bytes');
    return res.status(200).send(buffer);
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-SIMPLE] Error generando PDF de prueba:', err);
    console.error('❌ [DOWNLOAD-SIMPLE] Error name:', err?.name);
    console.error('❌ [DOWNLOAD-SIMPLE] Error message:', err?.message);
    console.error('❌ [DOWNLOAD-SIMPLE] Stack trace:', err?.stack);
    console.error('❌ [DOWNLOAD-SIMPLE] Error details:', {
      code: err?.code,
      cause: err?.cause,
      type: typeof err
    });
    
    // Verificar que los headers no se hayan enviado antes de enviar error
    if (!res.headersSent) {
      const errorResponse = {
        error: {
          code: '500',
          message: 'Error generando PDF de prueba',
          details: err?.message || 'Unknown error'
        }
      };

      // Agregar stack trace solo en desarrollo
      if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
        errorResponse.stack = err?.stack;
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json(errorResponse);
    } else {
      console.error('❌ [DOWNLOAD-SIMPLE] Cannot send error response - headers already sent');
    }
  }
}

// Función para generar PDF completo con datos del pago - UNA PÁGINA POR ASIENTO
export async function createTicketPdfBuffer(payment, locator, extra = {}) {
  try {
    console.log('📄 [PDF] Generando PDF en memoria para el pago:', payment.id);

    // Cargar dependencias de PDF dinámicamente
    const deps = await loadPdfDependencies();
    const { PDFDocument: PDFDoc, rgb: rgbFunc, StandardFonts: Fonts, drawSeatPage: drawPage, loadEventImages: loadImages } = deps;
    const PDFDocument = PDFDoc;
    const rgb = rgbFunc;
    const StandardFonts = Fonts;
    const drawSeatPage = drawPage;
    const loadEventImages = loadImages;

    const { supabaseAdmin: providedSupabaseAdmin, ...pdfExtras } = extra || {};
    const supabaseAdmin = providedSupabaseAdmin || getSupabaseAdmin();

    console.log('📄 [PDF] createTicketPdfBuffer llamado con extra:', {
      hasExtra: !!extra,
      extraKeys: Object.keys(extra || {}),
      hasFuncionData: !!extra?.funcionData,
      hasEventData: !!extra?.eventData,
      hasVenueData: !!extra?.venueData,
      hasSupabaseAdmin: !!extra?.supabaseAdmin,
      eventNombre: extra?.eventData?.nombre || 'N/A',
      venueNombre: extra?.venueData?.nombre || 'N/A',
      funcionFecha: extra?.funcionData?.fecha_celebracion || 'N/A'
    });
    
    console.log('📄 [PDF] pdfExtras después de destructuración:', {
      pdfExtrasKeys: Object.keys(pdfExtras || {}),
      hasFuncionData: !!pdfExtras?.funcionData,
      hasEventData: !!pdfExtras?.eventData,
      hasVenueData: !!pdfExtras?.venueData,
      eventNombre: pdfExtras?.eventData?.nombre || 'N/A',
      venueNombre: pdfExtras?.venueData?.nombre || 'N/A'
    });

    // Parsear asientos del pago
    let seats = [];
    if (Array.isArray(payment.seats)) {
      seats = payment.seats;
    } else if (typeof payment.seats === 'string') {
      try {
        seats = JSON.parse(payment.seats);
      } catch {
        try {
          seats = JSON.parse(JSON.parse(payment.seats));
        } catch {
          seats = [];
        }
      }
    }

    if (seats.length === 0) {
      console.warn('⚠️ [PDF] No hay asientos en el pago, generando PDF sin asientos');
      seats = [{}]; // Página vacía con solo el localizador
    }

    console.log(`📄 [PDF] Generando ${seats.length} página(s) para ${seats.length} asiento(s)`);

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Obtener datos del evento, función y recinto
    // Preferir los datos que vienen en pdfExtras (ya obtenidos en handleDownload)
    let eventData = pdfExtras?.eventData || payment?.event || null;
    let funcionData = pdfExtras?.funcionData || payment?.funcion || null;
    let venueData = pdfExtras?.venueData || null;
    
    console.log('📄 [PDF] Datos iniciales después de extraer de pdfExtras:', {
      hasEventData: !!eventData,
      hasFuncionData: !!funcionData,
      hasVenueData: !!venueData,
      evento_id: payment?.evento_id,
      funcion_id: payment?.funcion_id,
      eventNombre: eventData?.nombre || 'N/A',
      venueNombre: venueData?.nombre || 'N/A',
      funcionFecha: funcionData?.fecha_celebracion || 'N/A'
    });
    
    // Si no hay eventData pero hay evento_id, intentar obtenerlo
    if (!eventData && payment.evento_id && supabaseAdmin) {
      console.log('📄 [PDF] Obteniendo datos del evento desde evento_id:', payment.evento_id);
      const { data: evt, error: evtErr } = await supabaseAdmin
        .from('eventos')
        .select('id, nombre, imagenes, recinto, recinto_id, descripcion, tags')
        .eq('id', payment.evento_id)
        .maybeSingle();
      
      if (!evtErr && evt) {
        console.log('✅ [PDF] Evento obtenido:', evt.id, evt.nombre);
        eventData = evt;
        pdfExtras.eventData = evt;
        
        // Intentar obtener recinto desde el evento
        const recintoIdFromEvt = evt?.recinto_id || evt?.recinto;
        if (!venueData && recintoIdFromEvt) {
          console.log('🔍 [PDF] Buscando recinto desde evento (evento_id directo):', recintoIdFromEvt);
          const { data: rec, error: rErr } = await supabaseAdmin
            .from('recintos')
            .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
            .eq('id', recintoIdFromEvt)
            .maybeSingle();
          
          if (!rErr && rec) {
            console.log('✅ [PDF] Recinto obtenido desde evento:', rec.nombre);
            venueData = rec;
            pdfExtras.venueData = rec;
          } else if (rErr) {
            console.error('❌ [PDF] Error obteniendo recinto desde evento:', rErr);
          }
        }
      } else {
        console.error('❌ [PDF] Error obteniendo evento:', evtErr);
      }
    }
    
    // Si no hay funcionData pero hay funcion_id, intentar obtenerlo
    if (!funcionData && payment.funcion_id && supabaseAdmin) {
      console.log('📄 [PDF] Obteniendo datos de la función desde funcion_id:', payment.funcion_id);
      // funciones.id es serial (integer)
      const funcionId = typeof payment.funcion_id === 'string' ? parseInt(payment.funcion_id, 10) : payment.funcion_id;
      const { data: func, error: fErr } = await supabaseAdmin
        .from('funciones')
        .select('id, fecha_celebracion, evento_id, apertura_puertas, activo, recinto_id')
        .eq('id', funcionId)
        .maybeSingle();
      
      if (!fErr && func) {
        console.log('✅ [PDF] Función obtenida:', func.id, func.fecha_celebracion);
        funcionData = func;
        pdfExtras.funcionData = func;
        
        // Si no hay eventData pero la función tiene evento_id, obtenerlo
        if (!eventData && func.evento_id) {
          const { data: evt, error: eErr } = await supabaseAdmin
            .from('eventos')
            .select('id, nombre, imagenes, recinto, recinto_id, descripcion, tags')
            .eq('id', func.evento_id)
            .maybeSingle();
          
          if (!eErr && evt) {
            console.log('✅ [PDF] Evento obtenido desde función:', evt.id, evt.nombre);
            eventData = evt;
            pdfExtras.eventData = evt;
            
            // Intentar obtener recinto desde el evento
            const recintoIdFromEvt = evt?.recinto_id || evt?.recinto;
            if (!venueData && recintoIdFromEvt) {
              console.log('🔍 [PDF] Buscando recinto desde evento obtenido:', recintoIdFromEvt);
              const { data: rec, error: rErr } = await supabaseAdmin
                .from('recintos')
                .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
                .eq('id', recintoIdFromEvt)
                .maybeSingle();
              
              if (!rErr && rec) {
                console.log('✅ [PDF] Recinto obtenido desde evento:', rec.nombre);
                venueData = rec;
                pdfExtras.venueData = rec;
              }
            }
          }
        }
        
        // Si aún no hay venueData, intentar obtenerlo desde funcion.recinto_id
        if (!venueData && func.recinto_id) {
          console.log('🔍 [PDF] Buscando recinto desde funcion.recinto_id:', func.recinto_id);
          const { data: rec, error: rErr } = await supabaseAdmin
            .from('recintos')
            .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
            .eq('id', func.recinto_id)
            .maybeSingle();
          
          if (!rErr && rec) {
            console.log('✅ [PDF] Recinto obtenido desde funcion.recinto_id:', rec.nombre);
            venueData = rec;
            pdfExtras.venueData = rec;
          }
        }
      } else {
        console.error('❌ [PDF] Error obteniendo función:', fErr);
      }
    }
    
    // Si no hay venueData pero el evento tiene recinto_id o recinto, obtenerlo
    const recintoIdFromEvent = eventData?.recinto_id || eventData?.recinto;
    if (!venueData && recintoIdFromEvent && supabaseAdmin) {
      console.log('📄 [PDF] Obteniendo datos del recinto desde recinto_id/recinto:', recintoIdFromEvent);
      const { data: rec, error: rErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
        .eq('id', recintoIdFromEvent)
        .maybeSingle();
      
      if (!rErr && rec) {
        console.log('✅ [PDF] Recinto obtenido:', rec.nombre);
        venueData = rec;
        pdfExtras.venueData = rec;
      } else if (rErr) {
        console.error('❌ [PDF] Error obteniendo recinto:', rErr);
      }
    }

    // Cargar imágenes del evento (una sola vez, se reutilizan en todas las páginas)
    let eventImages = {};
    let finalVenueData = venueData;
    try {
      console.log('🖼️ [PDF] Cargando imágenes del evento...');
      console.log('🖼️ [PDF] EventData para imágenes:', {
        hasEventData: !!eventData,
        hasImagenes: !!eventData?.imagenes,
        imagenesType: typeof eventData?.imagenes
      });
      
      const loadedData = await loadEventImages(
        pdfDoc, 
        eventData, 
        supabaseAdmin
      );
      eventImages = loadedData.eventImages || {};
      // Si loadEventImages devolvió venueData y no teníamos uno, usarlo
      if (loadedData.venueData && !finalVenueData) {
        finalVenueData = loadedData.venueData;
        pdfExtras.venueData = finalVenueData;
      }
      console.log('✅ [PDF] Imágenes del evento cargadas:', Object.keys(eventImages).length, 'imágenes');
      console.log('✅ [PDF] Tipos de imágenes cargadas:', Object.keys(eventImages));
    } catch (imagesError) {
      console.error('❌ [PDF] Error cargando imágenes del evento:', imagesError);
      console.error('❌ [PDF] Stack:', imagesError.stack);
      // Continuar con imágenes vacías
      eventImages = {};
    }

    let eventTitle = null;
    if (eventData) {
      eventTitle = eventData.nombre;
    }

    // Generar una página por asiento
    const totalPages = seats.length;
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const seatId = seat.id || seat._id || seat.seatId || seat.seat_id || `seat-${i + 1}`;
      const currentPage = i + 1;
      
      console.log(`📄 [PDF] Generando página ${currentPage}/${totalPages} para asiento: ${seatId}`);
      
      // Crear nueva página para este asiento
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Dibujar la página del asiento
      try {
        // Asegurarse de que pdfExtras tenga todos los datos necesarios
        const seatPageExtras = {
          ...pdfExtras,
          eventData: eventData || pdfExtras.eventData,
          funcionData: funcionData || pdfExtras.funcionData,
          venueData: finalVenueData || pdfExtras.venueData,
          downloadSource: pdfExtras.downloadSource || 'web'
        };
        
        console.log(`📄 [PDF] Dibujando página ${currentPage}/${totalPages} con datos:`, {
          hasEventData: !!seatPageExtras.eventData,
          hasFuncionData: !!seatPageExtras.funcionData,
          hasVenueData: !!seatPageExtras.venueData,
          eventImagesCount: Object.keys(eventImages).length,
          seatId: seatId
        });
        
        await drawSeatPage(
          pdfDoc, 
          page, 
          payment, 
          seat, 
          eventImages, 
          finalVenueData, 
          seatPageExtras, 
          helveticaFont, 
          helveticaBold,
          locator,
          currentPage,
          totalPages
        );
        console.log(`✅ [PDF] Página ${currentPage}/${totalPages} generada exitosamente`);
      } catch (pageError) {
        console.error(`❌ [PDF] Error generando página ${currentPage}/${totalPages}:`, pageError);
        console.error(`❌ [PDF] Error message:`, pageError.message);
        console.error(`❌ [PDF] Error stack:`, pageError.stack);
        // Continuar con la siguiente página en lugar de fallar completamente
        throw pageError; // Propagar el error para que se maneje en el nivel superior
      }
    }

    // Guardar PDF después de generar todas las páginas
    console.log('💾 [PDF] Guardando PDF en memoria...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [PDF] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    const buffer = Buffer.from(pdfBytes);
    const filename = `tickets-${locator}.pdf`;

    return {
      buffer,
      filename,
      eventTitle: eventTitle || 'Tickets'
    };
  } catch (err) {
    console.error('❌ [PDF] Error generando PDF en memoria:', err);
    console.error('❌ [PDF] Error name:', err.name);
    console.error('❌ [PDF] Error message:', err.message);
    console.error('❌ [PDF] Stack trace:', err.stack);
    console.error('❌ [PDF] Error details:', {
      code: err.code,
      cause: err.cause,
      originalError: err.originalError
    });
    
    // Crear un error más descriptivo
    const errorMessage = err.message || 'Error desconocido al generar el PDF';
    const enhancedError = new Error(`Error generando PDF: ${errorMessage}`);
    enhancedError.originalError = err;
    enhancedError.name = err.name || 'PDFGenerationError';
    enhancedError.code = err.code;
    enhancedError.cause = err.cause;
    throw enhancedError;
  }
}

// Función para generar PDF completo con datos del pago
async function generateFullPDF(req, res, payment, locator, extra = {}) {
  try {
    console.log('📄 [DOWNLOAD-FULL] Generando PDF completo para locator:', locator);
    console.log('📄 [DOWNLOAD-FULL] Payment data:', {
      id: payment.id,
      locator: payment.locator,
      funcion_id: payment.funcion_id,
      evento_id: payment.evento_id,
      seats_count: Array.isArray(payment.seats) ? payment.seats.length : 0,
      downloadSource: extra.downloadSource || 'web'
    });
    
    // Verificar que payment tiene los datos necesarios
    if (!payment || !payment.id) {
      throw new Error('Payment data is invalid or missing');
    }
    
    if (!payment.locator && !locator) {
      throw new Error('Locator is required but not provided');
    }
    
    const finalLocator = locator || payment.locator;
    if (!finalLocator) {
      throw new Error('Locator is required but not found in payment or request');
    }
    
    console.log('📄 [DOWNLOAD-FULL] Calling createTicketPdfBuffer...');
    console.log('📄 [DOWNLOAD-FULL] Extra data being passed:', {
      hasFuncionData: !!extra.funcionData,
      hasEventData: !!extra.eventData,
      hasVenueData: !!extra.venueData,
      hasSupabaseAdmin: !!extra.supabaseAdmin,
      downloadSource: extra.downloadSource,
      eventNombre: extra.eventData?.nombre || 'N/A',
      venueNombre: extra.venueData?.nombre || 'N/A'
    });
    // Pasar downloadSource a createTicketPdfBuffer para que se incluya en pdfExtras
    const pdfResult = await createTicketPdfBuffer(payment, finalLocator, extra);
    
    if (!pdfResult || !pdfResult.buffer) {
      throw new Error('PDF generation returned invalid result');
    }
    
    const { buffer, filename } = pdfResult;

    console.log('✅ [DOWNLOAD-FULL] PDF generado exitosamente, tamaño:', buffer.length, 'bytes');

    // Verificar que los headers no se hayan enviado ya
    if (res.headersSent) {
      console.error('❌ [DOWNLOAD-FULL] Headers already sent, cannot send PDF');
      throw new Error('Response headers already sent');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || `ticket-${finalLocator}.pdf`}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log('📤 [DOWNLOAD-FULL] Enviando PDF al cliente...');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('❌ [DOWNLOAD-FULL] Error generando PDF completo:', err);
    console.error('❌ [DOWNLOAD-FULL] Stack trace:', err?.stack);
    console.error('❌ [DOWNLOAD-FULL] Error details:', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      cause: err?.cause,
      type: typeof err
    });

    // Si los headers ya se enviaron, no podemos enviar una respuesta de error
    if (res.headersSent) {
      console.error('❌ [DOWNLOAD-FULL] Response headers already sent, cannot send error response');
      return;
    }

    // Enviar respuesta de error en formato JSON
    res.setHeader('Content-Type', 'application/json');
    const responsePayload = {
      error: {
        code: '500',
        message: err?.message || 'Error generando PDF completo'
      }
    };

    // Agregar detalles en desarrollo
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
      responsePayload.details = err?.stack;
      responsePayload.errorName = err?.name;
      responsePayload.errorType = typeof err;
    }

    return res.status(500).json(responsePayload);
  }
}
// Función para generar PDF con todos los tickets (modo bulk)
async function generateBulkPDF(req, res, locator, supabaseAdminParam) {
  try {
    console.log('📄 [DOWNLOAD-BULK] Generando PDF con todos los tickets para localizador:', locator);

    // Cargar dependencias de PDF dinámicamente
    const deps = await loadPdfDependencies();
    const { PDFDocument: PDFDoc, rgb: rgbFunc, StandardFonts: Fonts, QRCode: QR } = deps;
    const PDFDocument = PDFDoc;
    const rgb = rgbFunc;
    const StandardFonts = Fonts;
    const QRCode = QR;

    const supabaseAdmin = supabaseAdminParam || getSupabaseAdmin();

    if (!supabaseAdmin) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      });
    }

    // Buscar el pago por localizador
    const { data: payment, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .single();

    if (error || !payment) {
      console.error('❌ [DOWNLOAD-BULK] Error buscando pago:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('✅ [DOWNLOAD-BULK] Pago encontrado:', payment.id);

    // Parsear los asientos del pago
    let seats = [];
    if (Array.isArray(payment.seats)) {
      seats = payment.seats;
    } else if (typeof payment.seats === 'string') {
      try {
        seats = JSON.parse(payment.seats);
      } catch {
        try {
          seats = JSON.parse(JSON.parse(payment.seats));
        } catch {
          seats = [];
        }
      }
    }

    if (seats.length === 0) {
      console.error('❌ [DOWNLOAD-BULK] No hay asientos en el pago');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'No seats found in payment' });
    }

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generar una página por cada asiento
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      console.log(`📄 [DOWNLOAD-BULK] Generando página ${i + 1}/${seats.length} para asiento:`, seat.id || seat._id);
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      // Generar QR code para este asiento específico
      const qrData = JSON.stringify({
        locator: payment.locator,
        paymentId: payment.id,
        seatId: seat.id || seat._id,
        timestamp: new Date().toISOString()
      });
      
      const qrImageBytes = await QRCode.toBuffer(qrData, {
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Título del ticket
      page.drawText('TICKET DE ENTRADA', {
        x: 50,
        y: height - 50,
        size: 22,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaBold,
      });

      // Datos principales
      let y = height - 90;
      page.drawText(`Localizador: ${payment.locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
      
      // Información del asiento
      page.drawText(`Asiento: ${seat.name || seat.nombre || seat.id || seat._id}`, { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
      y -= 25;
      
      if (seat.zona) {
        page.drawText(`Zona: ${seat.zona}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
        y -= 25;
      }
      
      // Información básica del pago
      page.drawText(`Estado: ${payment.status}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
      
      if (payment.monto) {
        page.drawText(`Monto: $${payment.monto}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
        y -= 25;
      }

      // Fecha de compra
      const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
      page.drawText(`Fecha de compra: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

      // --- Insertar QR ---
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrSize = 120;
      page.drawImage(qrImage, {
        x: width - qrSize - 50,
        y: height - qrSize - 60,
        width: qrSize,
        height: qrSize,
      });
      page.drawText('Escanea para validar', {
        x: width - qrSize - 40,
        y: height - qrSize - 75,
        size: 10,
        color: rgb(0.3,0.3,0.3),
        font: helveticaFont
      });

      // --- Condiciones ---
      page.drawText('Condiciones:', { x: 50, y: 80, size: 10, color: rgb(0.2,0.2,0.2), font: helveticaBold });
      page.drawText('• Presenta este ticket en la entrada del evento.', { x: 60, y: 65, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
      page.drawText('• El QR es único y será validado electrónicamente.', { x: 60, y: 53, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
      page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { x: 60, y: 41, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });

      // Número de página
      page.drawText(`Página ${i + 1} de ${seats.length}`, { 
        x: 50, 
        y: 30, 
        size: 10, 
        color: rgb(0.4,0.4,0.4), 
        font: helveticaFont 
      });
    }

    console.log('💾 [DOWNLOAD-BULK] Guardando PDF con múltiples tickets...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD-BULK] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Asegurar que se envíen los headers correctos
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tickets-${locator}-completos.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-BULK] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-BULK] Error generando PDF con múltiples tickets:', err);
    console.error('❌ [DOWNLOAD-BULK] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF con múltiples tickets', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
