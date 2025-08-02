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

async function insertPaymentGatewaysTestData() {
  try {
    console.log('🚀 Insertando datos de prueba para pasarelas de pago...');

    // 1. Insertar pasarelas por defecto
    const gatewaysData = [
      {
        name: 'Stripe',
        type: 'stripe',
        is_active: true
      },
      {
        name: 'PayPal',
        type: 'paypal',
        is_active: true
      },
      {
        name: 'Transferencias Bancarias',
        type: 'transfer',
        is_active: true
      },
      {
        name: 'Pago Móvil',
        type: 'mobile_payment',
        is_active: true
      },
      {
        name: 'Zelle',
        type: 'zelle',
        is_active: true
      },
      {
        name: 'Reservas',
        type: 'reservation',
        is_active: true
      }
    ];

    const { data: gateways, error: gatewaysError } = await supabase
      .from('payment_gateways')
      .upsert(gatewaysData, { onConflict: 'type' })
      .select();

    if (gatewaysError) throw gatewaysError;
    console.log('✅ Pasarelas creadas/actualizadas:', gateways.length);

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
      {
        gateway_id: gateways.find(g => g.type === 'stripe')?.id,
        key_name: 'webhook_secret',
        key_value: 'whsec_test_webhook_secret_123456789',
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
      {
        gateway_id: gateways.find(g => g.type === 'transfer')?.id,
        key_name: 'routing_number',
        key_value: '021000021',
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

    // Eliminar configuraciones existentes
    await supabase
      .from('payment_gateway_configs')
      .delete()
      .in('gateway_id', gateways.map(g => g.id));

    // Insertar nuevas configuraciones
    const { data: configs, error: configsError } = await supabase
      .from('payment_gateway_configs')
      .insert(configsData)
      .select();

    if (configsError) throw configsError;
    console.log('✅ Configuraciones creadas:', configs.length);

    console.log('🎉 Datos de prueba para pasarelas insertados correctamente');
    console.log('📋 Resumen:');
    console.log(`   - Pasarelas: ${gateways.length}`);
    console.log(`   - Configuraciones: ${configs.length}`);
    console.log('');
    console.log('🌐 URLs de prueba:');
    console.log(`   - Backoffice Pasarelas: https://zeatingmaps-ekirmens-projects.vercel.app/dashboard/pasarelas`);
    console.log(`   - Store Pago: https://zeatingmaps-ekirmens-projects.vercel.app/store/payment`);

  } catch (error) {
    console.error('❌ Error insertando datos de prueba para pasarelas:', error);
  }
}

insertPaymentGatewaysTestData(); 