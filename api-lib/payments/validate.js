import { getConfig, validateConfig, getSupabaseAdmin } from './config.js';

/**
 * Valida un ticket escaneado (código QR de un asiento)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function handleValidate(req, res) {
  console.log('🔍 [VALIDATE] Endpoint de validación llamado');
  console.log('🔍 [VALIDATE] Method:', req.method);
  console.log('🔍 [VALIDATE] Body:', req.body);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({
      error: {
        code: '405',
        message: 'Method not allowed'
      }
    });
  }

  const config = getConfig();
  const isValidConfig = validateConfig(config);
  const supabaseAdmin = getSupabaseAdmin(config);

  if (!isValidConfig || !supabaseAdmin) {
    console.error('❌ [VALIDATE] Configuración inválida');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: {
        code: '500',
        message: 'Server configuration error - Missing Supabase environment variables'
      }
    });
  }

  try {
    const { qrData, scannerDeviceId, scannerLocation, scannerUserId } = req.body;

    if (!qrData) {
      console.error('❌ [VALIDATE] Missing qrData in request body');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Missing qrData'
        }
      });
    }

    // Parsear el QR data
    let qrInfo;
    try {
      qrInfo = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (parseError) {
      console.error('❌ [VALIDATE] Error parsing qrData:', parseError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Invalid qrData format'
        }
      });
    }

    const { seatId, paymentId, locator } = qrInfo;

    if (!seatId || !paymentId || !locator) {
      console.error('❌ [VALIDATE] Missing required fields in qrData:', { seatId, paymentId, locator });
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        error: {
          code: '400',
          message: 'Missing required fields: seatId, paymentId, locator'
        }
      });
    }

    console.log('🔍 [VALIDATE] Validando ticket:', { seatId, paymentId, locator });

    // Verificar que el pago existe y está completado
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, status, funcion_id, evento_id, tenant_id, user_id, locator, seats')
      .eq('id', paymentId)
      .eq('locator', locator)
      .eq('status', 'completed')
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('❌ [VALIDATE] Payment not found or not completed:', paymentError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({
        error: {
          code: '404',
          message: 'Payment not found or not completed',
          validated: false
        }
      });
    }

    // Verificar que el asiento está en el pago
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

    const seatExists = seats.some(seat => {
      const seatIdToCheck = seat.id || seat._id || seat.seatId || seat.seat_id;
      return seatIdToCheck === seatId;
    });

    if (!seatExists) {
      console.error('❌ [VALIDATE] Seat not found in payment:', seatId);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({
        error: {
          code: '404',
          message: 'Seat not found in payment',
          validated: false
        }
      });
    }

    // Verificar si el asiento ya fue validado
    const { data: existingValidation, error: validationCheckError } = await supabaseAdmin
      .from('ticket_validations')
      .select('id, validation_status, validated_at')
      .eq('payment_id', paymentId)
      .eq('seat_id', seatId)
      .eq('validation_status', 'valid')
      .maybeSingle();

    if (validationCheckError && validationCheckError.code !== 'PGRST116') {
      console.error('❌ [VALIDATE] Error checking existing validation:', validationCheckError);
    }

    if (existingValidation) {
      console.warn('⚠️ [VALIDATE] Seat already validated:', existingValidation);
      
      // Registrar como duplicado
      const { error: duplicateError } = await supabaseAdmin
        .from('ticket_validations')
        .insert({
          payment_id: paymentId,
          seat_id: seatId,
          locator: locator,
          funcion_id: payment.funcion_id,
          evento_id: payment.evento_id,
          tenant_id: payment.tenant_id,
          user_id: payment.user_id,
          validation_status: 'duplicate',
          validated_by: scannerUserId || null,
          scanner_device_id: scannerDeviceId || null,
          scanner_location: scannerLocation || null,
          scanner_user_id: scannerUserId || null,
          metadata: {
            original_validation_id: existingValidation.id,
            original_validated_at: existingValidation.validated_at
          }
        });

      if (duplicateError) {
        console.error('❌ [VALIDATE] Error recording duplicate validation:', duplicateError);
      }

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        validated: false,
        status: 'duplicate',
        message: 'Este asiento ya fue validado anteriormente',
        originalValidation: {
          id: existingValidation.id,
          validatedAt: existingValidation.validated_at
        }
      });
    }

    // Validar el ticket (registrar la validación)
    const { data: validation, error: validationError } = await supabaseAdmin
      .from('ticket_validations')
      .insert({
        payment_id: paymentId,
        seat_id: seatId,
        locator: locator,
        funcion_id: payment.funcion_id,
        evento_id: payment.evento_id,
        tenant_id: payment.tenant_id,
        user_id: payment.user_id,
        validation_status: 'valid',
        validated_by: scannerUserId || null,
        scanner_device_id: scannerDeviceId || null,
        scanner_location: scannerLocation || null,
        scanner_user_id: scannerUserId || null,
        metadata: {
          validated_at: new Date().toISOString(),
          qr_data: qrInfo
        }
      })
      .select()
      .single();

    if (validationError) {
      console.error('❌ [VALIDATE] Error creating validation:', validationError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: {
          code: '500',
          message: 'Error validating ticket',
          details: validationError.message
        }
      });
    }

    console.log('✅ [VALIDATE] Ticket validated successfully:', validation.id);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      validated: true,
      status: 'valid',
      message: 'Ticket validado exitosamente',
      validation: {
        id: validation.id,
        validatedAt: validation.validated_at,
        seatId: validation.seat_id,
        locator: validation.locator
      }
    });

  } catch (error) {
    console.error('❌ [VALIDATE] Unexpected error:', error);
    console.error('❌ [VALIDATE] Stack:', error.stack);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: {
        code: '500',
        message: error.message || 'Internal server error'
      }
    });
  }
}

