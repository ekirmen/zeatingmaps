/**
 * Handler para generar y descargar archivos .pkpass (Apple Wallet / Google Wallet)
 */

import { getSupabaseAdmin } from './config.js';
import { generatePkpass, getEventDataForPkpass } from './pkpass-generator.js';

export async function handlePkpass(req, res) {
  try {
    const { locator } = req.query;
    
    if (!locator) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Localizador no proporcionado'
        }
      });
    }
    
    console.log('🎫 [PKPASS] Generando .pkpass para locator:', locator);
    
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Error de configuración del servidor'
        }
      });
    }
    
    // Obtener datos del pago
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (paymentError || !payment) {
      console.error('❌ [PKPASS] Error obteniendo pago:', paymentError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({
        error: {
          code: '404',
          message: 'Pago no encontrado'
        }
      });
    }
    
    // Verificar que el pago esté completado
    if (payment.status !== 'completed' && payment.status !== 'pagado') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'El pago no está completado. Solo se pueden generar tickets .pkpass para pagos completados.'
        }
      });
    }
    
    // Obtener datos del evento, función y recinto
    const eventDataResult = await getEventDataForPkpass(
      supabaseAdmin,
      payment.evento_id,
      payment.funcion_id
    );
    
    if (!eventDataResult) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Error obteniendo datos del evento'
        }
      });
    }
    
    const { evento, funcion, recinto } = eventDataResult;
    
    // Verificar si el evento tiene habilitado el wallet
    let datosBoleto = evento?.datosBoleto;
    if (typeof datosBoleto === 'string') {
      try {
        datosBoleto = JSON.parse(datosBoleto);
      } catch (e) {
        datosBoleto = {};
      }
    }
    
    if (!datosBoleto?.habilitarWallet) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'El wallet (pkpass) no está habilitado para este evento'
        }
      });
    }
    
    // Parsear asientos
    let seats = [];
    try {
      if (typeof payment.seats === 'string') {
        seats = JSON.parse(payment.seats);
      } else if (Array.isArray(payment.seats)) {
        seats = payment.seats;
      }
    } catch (e) {
      console.warn('⚠️ [PKPASS] Error parseando asientos:', e);
    }
    
    if (seats.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'No se encontraron asientos para este pago'
        }
      });
    }
    
    // Generar .pkpass para el primer asiento (por ahora, uno por uno)
    // TODO: En el futuro, generar un .pkpass por asiento o un .pkpass con múltiples asientos
    const seat = seats[0];
    
    // Preparar datos del ticket
    const ticketData = {
      locator: payment.locator,
      orderId: payment.order_id,
      seatId: seat.id || seat._id || seat.seatId || seat.seat_id,
      zonaNombre: seat.zonaNombre || seat.nombreZona || seat.zona?.nombre || seat.zona,
      mesa: seat.mesa || seat.table || seat.mesaNombre || seat.mesa?.nombre,
      fila: seat.fila || seat.row || seat.filaNombre || seat.fila?.nombre,
      asiento: seat.asiento || seat.seat || seat.asientoNombre || seat.nombre || seat.name,
      price: seat.price || seat.precio
    };
    
    // Obtener imágenes del evento si están disponibles
    let images = null;
    if (evento?.imagenes) {
      try {
        const imagenesData = typeof evento.imagenes === 'string' 
          ? JSON.parse(evento.imagenes) 
          : evento.imagenes;
        
        // Intentar obtener URLs de las imágenes
        images = {};
        if (imagenesData.logoHorizontal) {
          images.logo = imagenesData.logoHorizontal;
        }
        if (imagenesData.logoCuadrado) {
          images.icon = imagenesData.logoCuadrado;
        }
      } catch (e) {
        console.warn('⚠️ [PKPASS] Error parseando imágenes:', e);
      }
    }
    
    // Opciones para generar el pkpass
    const options = {
      organizationName: 'Veneventos',
      passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.veneventos.ticket',
      teamIdentifier: process.env.TEAM_IDENTIFIER || 'TEAM123456',
      images: images,
      // Certificados (si están disponibles)
      certificate: process.env.APPLE_CERTIFICATE ? Buffer.from(process.env.APPLE_CERTIFICATE, 'base64') : null,
      privateKey: process.env.APPLE_PRIVATE_KEY ? Buffer.from(process.env.APPLE_PRIVATE_KEY, 'base64') : null,
      wwdrCertificate: process.env.APPLE_WWDR_CERTIFICATE ? Buffer.from(process.env.APPLE_WWDR_CERTIFICATE, 'base64') : null
    };
    
    // Generar el archivo .pkpass
    const pkpassBuffer = await generatePkpass(
      ticketData,
      evento,
      funcion,
      recinto,
      options
    );
    
    // Enviar el archivo
    const fileName = `ticket-${payment.locator}-${ticketData.seatId || 'ticket'}.pkpass`;
    
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pkpassBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('✅ [PKPASS] Archivo .pkpass enviado exitosamente:', fileName);
    
    return res.status(200).send(pkpassBuffer);
  } catch (error) {
    console.error('❌ [PKPASS] Error generando .pkpass:', error);
    console.error('❌ [PKPASS] Stack:', error.stack);
    
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Error generando archivo .pkpass',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
}

