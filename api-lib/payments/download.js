import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';
import { drawSeatPage, loadEventImages } from './download-seat-pages.js';

export async function handleDownload(req, res) {
  console.log('🚀 [DOWNLOAD] Endpoint llamado con método:', req.method);
  console.log('🔍 [DOWNLOAD] Query params:', req.query);
  console.log('🔍 [DOWNLOAD] Headers:', req.headers);
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ 
      error: {
        code: '405',
        message: 'Method not allowed'
      }
    });
  }

  const { locator, mode = 'full' } = req.query;
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

  // Si es modo simple, generar PDF básico sin autenticación
  if (mode === 'simple') {
    return await generateSimplePDF(req, res, locator);
  }

  // Para modo completo, validar configuración y autenticación
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
  
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    console.error('❌ [DOWNLOAD] Missing auth token in headers');
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ 
        error: {
          code: '401',
          message: 'Missing auth token'
        }
      });
    }
    return;
  }

  try {
    console.log('🔐 [DOWNLOAD] Verificando token de autenticación...');
    console.log('🔐 [DOWNLOAD] Token length:', token ? token.length : 0);
    console.log('🔐 [DOWNLOAD] Token preview (first 20 chars):', token ? token.substring(0, 20) + '...' : 'none');
    console.log('🔐 [DOWNLOAD] supabaseAdmin disponible:', supabaseAdmin ? '✅ sí' : '❌ no');
    console.log('🔐 [DOWNLOAD] supabaseAdmin.auth disponible:', supabaseAdmin?.auth ? '✅ sí' : '❌ no');
    console.log('🔐 [DOWNLOAD] supabaseAdmin.auth.getUser disponible:', supabaseAdmin?.auth?.getUser ? '✅ sí' : '❌ no');

    // Verify the user token using the access token (tolerante a mocks)
    let userResp;
    try {
      userResp = await supabaseAdmin?.auth?.getUser?.(token);
    } catch (authError) {
      console.error('❌ [DOWNLOAD] Error llamando getUser:', authError);
      console.error('❌ [DOWNLOAD] Auth error message:', authError?.message);
      console.error('❌ [DOWNLOAD] Auth error stack:', authError?.stack);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ 
          error: {
            code: '500',
            message: 'Error verificando autenticación: ' + (authError?.message || 'Error desconocido')
          }
        });
      }
      return;
    }
    
    const user = userResp?.data?.user || null;
    const userError = userResp?.error || null;
    
    console.log('🔐 [DOWNLOAD] Resultado de autenticación:');
    console.log('- User presente:', user ? '✅ sí' : '❌ no');
    console.log('- User ID:', user?.id || 'N/A');
    console.log('- Error presente:', userError ? '❌ sí' : '✅ no');
    if (userError) {
      console.log('- Error message:', userError.message);
      console.log('- Error code:', userError.code);
      console.log('- Error status:', userError.status);
    }
    
    if (userError || !user) {
      console.error('❌ [DOWNLOAD] Auth error o usuario no encontrado:', userError);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(403).json({ 
          error: {
            code: '403',
            message: userError?.message || 'Unauthorized - Token inválido o expirado'
          }
        });
      }
      return;
    }

    console.log('✅ [DOWNLOAD] Usuario autenticado correctamente:', user.id);

    // Get payment data - tolerante a duplicados en payment_transactions
    console.log('🔍 [DOWNLOAD] Buscando pago con localizador:', locator);
    console.log('🔍 [DOWNLOAD] supabaseAdmin disponible para consulta:', supabaseAdmin ? '✅ sí' : '❌ no');
    
    let locatorMatches, locatorError;
    try {
      const result = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('locator', locator)
        .order('created_at', { ascending: false })
        .limit(5);
      locatorMatches = result.data;
      locatorError = result.error;
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
    try {
      const downloadData = {
        payment_id: payment.id,
        locator: locator || payment.locator,
        user_id: user.id,
        tenant_id: payment.tenant_id || null,
        downloaded_at: new Date().toISOString(),
        download_method: 'pdf_download',
        user_agent: req.headers['user-agent'] || null,
        ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || null,
        metadata: {
          payment_status: payment.status,
          seats_count: parsedSeats.length
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
            console.log('✅ [DOWNLOAD] Descarga registrada para payment:', payment.id, 'con', parsedSeats.length, 'asiento(s)');
          }
        })
        .catch((err) => {
          console.warn('⚠️ [DOWNLOAD] Error inesperado registrando descarga:', err.message);
        });
    } catch (downloadLogError) {
      console.warn('⚠️ [DOWNLOAD] Error preparando registro de descarga:', downloadLogError.message);
    }

    // Enriquecer con datos de función y evento/recinto para el PDF
    let funcionData = null;
    let eventData = null;
    let venueData = null;
    try {
      if (payment.funcion_id) {
        // Primero obtener evento_id desde la función
        const { data: func, error: fErr } = await supabaseAdmin
          .from('funciones')
          .select('id, fecha_celebracion, evento_id')
          .eq('id', payment.funcion_id)
          .maybeSingle();
        
        if (!fErr && func && func.evento_id) {
          funcionData = { id: func.id, fecha_celebracion: func.fecha_celebracion };
          
          // Luego obtener el evento usando evento_id
          const { data: evt, error: eErr } = await supabaseAdmin
            .from('eventos')
            .select('id, nombre, imagenes, recinto_id')
            .eq('id', func.evento_id)
            .maybeSingle();
          
          if (!eErr && evt) {
            eventData = evt;
            if (!payment.event) payment.event = eventData;
            if (eventData?.recinto_id) {
              const { data: rec, error: rErr } = await supabaseAdmin
                .from('recintos')
                .select('id, nombre, direccion, ciudad, pais')
                .eq('id', eventData.recinto_id)
                .maybeSingle();
              if (!rErr) venueData = rec;
            }
          }
        }
      }
      
      // Si ya hay evento_id en el pago, usarlo directamente
      if (!eventData && payment.evento_id) {
        const { data: evt, error: eErr } = await supabaseAdmin
          .from('eventos')
          .select('id, nombre, imagenes, recinto_id')
          .eq('id', payment.evento_id)
          .maybeSingle();
        
        if (!eErr && evt) {
          eventData = evt;
          if (!payment.event) payment.event = eventData;
          if (eventData?.recinto_id) {
            const { data: rec, error: rErr } = await supabaseAdmin
              .from('recintos')
              .select('id, nombre, direccion, ciudad, pais')
              .eq('id', eventData.recinto_id)
              .maybeSingle();
            if (!rErr) venueData = rec;
          }
        }
      }
    } catch (enrichErr) {
      console.warn('⚠️ [DOWNLOAD] Error enriqueciendo datos de función/evento/recinto:', enrichErr.message);
      console.warn('⚠️ [DOWNLOAD] Stack:', enrichErr.stack);
    }

    // Generate full PDF with payment data
    try {
      return await generateFullPDF(req, res, payment, locator, { funcionData, eventData, venueData, supabaseAdmin });
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
  try {
    console.log('📄 [DOWNLOAD-SIMPLE] Creando documento PDF simple...');
    
    // Crear PDF simple sin dependencias externas
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

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

    // Fecha
    const fechaCreacion = new Date().toLocaleString('es-ES');
    page.drawText(`Fecha de generación: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

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
    console.log('✅ [DOWNLOAD-SIMPLE] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-prueba-${locator}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-SIMPLE] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-SIMPLE] Error generando PDF de prueba:', err);
    console.error('❌ [DOWNLOAD-SIMPLE] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF de prueba', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// Función para generar PDF completo con datos del pago - UNA PÁGINA POR ASIENTO
export async function createTicketPdfBuffer(payment, locator, extra = {}) {
  try {
    console.log('📄 [PDF] Generando PDF en memoria para el pago:', payment.id);

    const { supabaseAdmin: providedSupabaseAdmin, ...pdfExtras } = extra || {};
    const supabaseAdmin = providedSupabaseAdmin || getSupabaseAdmin();

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

    // Obtener datos del evento
    let eventData = pdfExtras.eventData || payment.event || null;
    if (!eventData && payment.evento_id && supabaseAdmin) {
      console.log('📄 [PDF] Obteniendo datos del evento desde evento_id:', payment.evento_id);
      const { data: evt, error: evtErr } = await supabaseAdmin
        .from('eventos')
        .select('id, nombre, imagenes, recinto_id')
        .eq('id', payment.evento_id)
        .maybeSingle();
      
      if (!evtErr && evt) {
        console.log('✅ [PDF] Evento obtenido:', evt.id);
        eventData = evt;
        pdfExtras.eventData = evt;
      }
    }

    // Cargar imágenes del evento (una sola vez, se reutilizan en todas las páginas)
    const { eventImages, venueData } = await loadEventImages(
      pdfDoc, 
      eventData || pdfExtras.eventData, 
      supabaseAdmin
    );

    let eventTitle = null;
    if (eventData) {
      eventTitle = eventData.nombre;
    }

    // Generar una página por asiento
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const seatId = seat.id || seat._id || seat.seatId || seat.seat_id || `seat-${i + 1}`;
      
      console.log(`📄 [PDF] Generando página ${i + 1}/${seats.length} para asiento: ${seatId}`);
      
      // Crear nueva página para este asiento
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Dibujar la página del asiento
      await drawSeatPage(
        pdfDoc, 
        page, 
        payment, 
        seat, 
        eventImages, 
        venueData || pdfExtras.venueData, 
        pdfExtras, 
        helveticaFont, 
        helveticaBold,
        locator
      );
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
      seats_count: Array.isArray(payment.seats) ? payment.seats.length : 0
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
