import { createClient } from '@supabase/supabase-js';
import { createPaymentTransaction } from '../../src/store/services/paymentGatewaysService.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.react_NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.react_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  if (!supabaseAdmin) {
    console.error('[payments/create-transaction] Supabase admin client not configured');
    return res.status(500).json({
      success: false,
      error: 'Supabase admin client not configured',
    });
  }

  try {
    const payload =
      typeof req.body === 'string'
        ? (() => {
            try {
              return JSON.parse(req.body);
            } catch (parseError) {
              console.error('[payments/create-transaction] Invalid JSON payload:', parseError);
              return null;
            }
          })()
        : req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
      });
    }

    const transaction = await createPaymentTransaction(payload, { client: supabaseAdmin });

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('[payments/create-transaction] Error creating transaction via API:', error);
    const status = Number(error?.status || error?.code) || 500;
    return res.status(status).json({
      success: false,
      error: error?.message || 'Error creating payment transaction',
      details: error?.details || error?.stack || null,
    });
  }
}
