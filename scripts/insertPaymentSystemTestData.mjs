import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertPaymentSystemTestData() {
  try {
    console.log('🚀 Insertando datos de prueba para el sistema de pagos completo...');

    // 1. Insertar pasarelas de pago
    const gatewaysData = [
      { name: 'Stripe', type: 'stripe', is_active: true },
      { name: 'PayPal', type: 'paypal', is_active: true },
      { name: 'Transferencias Bancarias', type: 'transfer', is_active: true },
      { name: 'Pago Móvil', type: 'mobile_payment', is_active: true },
      { name: 'Zelle', type: 'zelle', is_active: true },
      { name: 'Reservas', type: 'reservation', is_active: true }
    ];

    const { data: gateways, error: gatewaysError } = await supabase
      .from('payment_gateways')
      .upsert(gatewaysData, { onConflict: 'type' })
      .select();

    if (gatewaysError) throw gatewaysError;
    console.log('✅ Pasarelas creadas:', gateways.length);

    // 2. Insertar configuraciones de ejemplo
    const configsData = [
      // Stripe
      {
        gateway_id: gateways.find(g => g.type === 'stripe')?.id,
        key_name: 'publishable_key',
        key_value: 'pk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'stripe')?.id,
        key_name: 'secret_key',
        key_value: 'sk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX',
        is_secret: true
      },
      // PayPal
      {
        gateway_id: gateways.find(g => g.type === 'paypal')?.id,
        key_name: 'client_id',
        key_value: 'test_client_id_123456789',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'paypal')?.id,
        key_name: 'client_secret',
        key_value: 'test_client_secret_123456789',
        is_secret: true
      },
      {
        gateway_id: gateways.find(g => g.type === 'paypal')?.id,
        key_name: 'mode',
        key_value: 'sandbox',
        is_secret: false
      },
      // Transferencias
      {
        gateway_id: gateways.find(g => g.type === 'transfer')?.id,
        key_name: 'bank_name',
        key_value: 'Banco de Prueba',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'transfer')?.id,
        key_name: 'account_number',
        key_value: '1234567890',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'transfer')?.id,
        key_name: 'account_holder',
        key_value: 'Empresa de Prueba S.A.',
        is_secret: false
      },
      // Pago Móvil
      {
        gateway_id: gateways.find(g => g.type === 'mobile_payment')?.id,
        key_name: 'phone_number',
        key_value: '+1234567890',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'mobile_payment')?.id,
        key_name: 'provider',
        key_value: 'MercadoPago',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'mobile_payment')?.id,
        key_name: 'account_name',
        key_value: 'Cuenta de Prueba',
        is_secret: false
      },
      // Zelle
      {
        gateway_id: gateways.find(g => g.type === 'zelle')?.id,
        key_name: 'email',
        key_value: 'pagos@empresa.com',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'zelle')?.id,
        key_name: 'account_name',
        key_value: 'Empresa de Prueba',
        is_secret: false
      },
      // Reservas
      {
        gateway_id: gateways.find(g => g.type === 'reservation')?.id,
        key_name: 'reservation_time',
        key_value: '30',
        is_secret: false
      },
      {
        gateway_id: gateways.find(g => g.type === 'reservation')?.id,
        key_name: 'max_reservation_amount',
        key_value: '100',
        is_secret: false
      }
    ];

    // Limpiar configuraciones existentes
    await supabase
      .from('payment_gateway_configs')
      .delete()
      .in('gateway_id', gateways.map(g => g.id));

    const { data: configs, error: configsError } = await supabase
      .from('payment_gateway_configs')
      .insert(configsData)
      .select();

    if (configsError) throw configsError;
    console.log('✅ Configuraciones creadas:', configs.length);

    // 3. Insertar transacciones de ejemplo
    const transactionsData = [
      {
        order_id: 'ORDER-001',
        gateway_id: gateways.find(g => g.type === 'stripe')?.id,
        amount: 50.00,
        currency: 'USD',
        status: 'completed',
        gateway_transaction_id: 'pi_stripe_001',
        gateway_response: { status: 'succeeded', payment_method: 'card' }
      },
      {
        order_id: 'ORDER-002',
        gateway_id: gateways.find(g => g.type === 'paypal')?.id,
        amount: 75.50,
        currency: 'USD',
        status: 'pending',
        gateway_transaction_id: 'PAY-002',
        gateway_response: { status: 'CREATED', approval_url: 'https://paypal.com/approve' }
      },
      {
        order_id: 'ORDER-003',
        gateway_id: gateways.find(g => g.type === 'transfer')?.id,
        amount: 120.00,
        currency: 'USD',
        status: 'pending',
        gateway_transaction_id: 'TRANSFER-003',
        gateway_response: { 
          bank_name: 'Banco de Prueba',
          account_number: '1234567890',
          reference: 'ORDER-003'
        }
      },
      {
        order_id: 'RESERVATION-001',
        gateway_id: gateways.find(g => g.type === 'reservation')?.id,
        amount: 25.00,
        currency: 'USD',
        status: 'reserved',
        gateway_transaction_id: 'RES-001',
        gateway_response: { 
          reservation_time: 30,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }
    ];

    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .insert(transactionsData)
      .select();

    if (transactionsError) throw transactionsError;
    console.log('✅ Transacciones creadas:', transactions.length);

    // 4. Insertar reembolsos de ejemplo
    const refundsData = [
      {
        transaction_id: transactions[0].id,
        amount: 25.00,
        reason: 'Cliente canceló la compra',
        status: 'pending',
        requested_by: 'user-001'
      },
      {
        transaction_id: transactions[1].id,
        amount: 75.50,
        reason: 'Error en el procesamiento',
        status: 'completed',
        requested_by: 'user-002',
        gateway_refund_id: 're_stripe_001',
        processed_at: new Date().toISOString()
      }
    ];

    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .insert(refundsData)
      .select();

    if (refundsError) throw refundsError;
    console.log('✅ Reembolsos creados:', refunds.length);

    // 5. Insertar notificaciones de ejemplo
    const notificationsData = [
      {
        user_id: 'user-001',
        type: 'payment',
        title: 'Pago Confirmado',
        message: 'Tu pago de $50.00 ha sido procesado exitosamente.',
        data: { transactionId: transactions[0].id, amount: 50.00 },
        read: false
      },
      {
        user_id: 'user-002',
        type: 'refund',
        title: 'Reembolso Procesado',
        message: 'Tu reembolso de $75.50 ha sido procesado.',
        data: { refundId: refunds[1].id, amount: 75.50 },
        read: false
      },
      {
        user_id: 'user-003',
        type: 'system',
        title: 'Reserva Expirada',
        message: 'Tu reserva ha expirado. Los asientos han sido liberados.',
        data: { reservationId: 'RES-001' },
        read: false
      }
    ];

    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select();

    if (notificationsError) throw notificationsError;
    console.log('✅ Notificaciones creadas:', notifications.length);

    console.log('🎉 Sistema de pagos completo configurado exitosamente');
    console.log('📋 Resumen:');
    console.log(`   - Pasarelas: ${gateways.length}`);
    console.log(`   - Configuraciones: ${configs.length}`);
    console.log(`   - Transacciones: ${transactions.length}`);
    console.log(`   - Reembolsos: ${refunds.length}`);
    console.log(`   - Notificaciones: ${notifications.length}`);
    console.log('');
    console.log('🌐 URLs de prueba:');
    console.log(`   - Backoffice Pasarelas: https://zeatingmaps-ekirmens-projects.vercel.app/dashboard/pasarelas`);
    console.log(`   - Backoffice Análisis: https://zeatingmaps-ekirmens-projects.vercel.app/dashboard/analytics`);
    console.log(`   - Backoffice Reembolsos: https://zeatingmaps-ekirmens-projects.vercel.app/dashboard/reembolsos`);
    console.log(`   - Store Pago: https://zeatingmaps-ekirmens-projects.vercel.app/store/payment`);

  } catch (error) {
    console.error('❌ Error insertando datos de prueba del sistema de pagos:', error);
  }
}

insertPaymentSystemTestData(); 