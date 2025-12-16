import { supabase } from '../supabaseClient';

const encodeBase64 = (value) => {
  if (typeof window === 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64');
  }
  return window.btoa(value);
};

const parseConfig = (rawConfig) => {
  if (!rawConfig) {
    return {};
  }

  if (typeof rawConfig === 'string') {
    try {
      return JSON.parse(rawConfig);
    } catch (error) {
      return {};
    }
  }

  return rawConfig;
};

const normalizeOrderResponse = (response = {}, fallback = {}) => {
  const orderId = response.orderId || response.order_id || response.id || fallback.orderId || null;
  const invoiceId = response.invoiceId || response.invoice_id || response.invoiceNumber || fallback.invoiceId || null;
  const securityCode = response.securityCode || response.security_code || response.security_pin || fallback.securityCode || null;
  const checkoutUrl = response.checkoutUrl || response.checkout_url || response.redirectUrl || response.redirect_url || fallback.checkoutUrl || null;
  const qrImage = response.qrImage || response.qr_image || response.qr_image_url || response.qrCode || response.qr_code || fallback.qrImage || null;
  const status = response.status || fallback.status || 'pending';
  const expiresAt = response.expiresAt || response.expires_at || fallback.expiresAt || null;

  return {
    orderId,
    invoiceId,
    securityCode,
    checkoutUrl,
    qrImage,
    status,
    expiresAt,
    raw: response,
  };
};

const buildAuthHeaders = (config) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (!config) {
    return headers;
  }

  if (config.access_token) {
    headers.Authorization = `Bearer ${config.access_token}`;
    return headers;
  }

  if (config.api_key && config.api_secret) {
    const encoded = encodeBase64(`${config.api_key}:${config.api_secret}`);
    headers.Authorization = `Basic ${encoded}`;
    return headers;
  }

  if (config.api_key) {
    headers['x-api-key'] = config.api_key;
  }

  if (config.api_secret && !headers.Authorization) {
    headers.Authorization = `Bearer ${config.api_secret}`;
  }

  return headers;
};

export const getCasheaConfig = async (tenantId) => {
  if (!tenantId) {
    throw new Error('No se pudo determinar el tenant para Cashea');
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .select('config, enabled')
    .eq('method_id', 'cashea')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    return null;
  }

  if (!data || data.enabled === false) {
    return null;
  }

  return parseConfig(data.config);
};

const buildRequestPayload = ({ amount, currency, description, customer = {}, items = [], metadata = {}, config = {} }) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => ({
      id: item.id || item._id || item.sillaId || item.seat_id || item.seatId || `item-${Math.random().toString(36).slice(2)}`,
      name: item.name || item.nombre || 'Asiento',
      price: Number(item.price ?? item.precio ?? amount ?? 0),
      quantity: Number(item.quantity || 1),
    }))
    : [];

  const normalizedCustomer = {
    name:
      customer.name ||
      `${customer.firstName || customer.nombre || ''} ${customer.lastName || customer.apellido || ''}`.trim() ||
      undefined,
    email: customer.email || customer.correo || customer.mail || undefined,
    document: customer.document || customer.documento || customer.identification || undefined,
    phone: customer.phone || customer.telefono || customer.celular || undefined,
  };

  return {
    amount: Number(amount),
    currency: currency || config.default_currency || 'USD',
    description: description || 'Orden Cashea',
    metadata,
    customer: normalizedCustomer,
    merchant: {
      merchantId: config.merchant_id || config.merchantId || null,
      storeId: config.store_id || config.storeId || config.branch_id || config.branchId || null,
    },
    invoice: {
      id: metadata.invoiceId || metadata.invoice_id || null,
    },
    items: normalizedItems,
  };
};

const simulateOrderResponse = ({ amount, metadata }) => {
  const now = Date.now();
  const invoiceId = metadata?.invoiceId || `INV-${now}`;
  const orderId = `CASHEA-${now}`;

  return normalizeOrderResponse(
    {
      order_id: orderId,
      invoice_id: invoiceId,
      status: 'pending',
      security_code: Math.random().toString(36).slice(2, 10).toUpperCase(),
      checkout_url: metadata?.checkoutUrl || null,
      qr_image_url: metadata?.qrImage || null,
      amount,
      created_at: new Date(now).toISOString(),
    },
    { orderId, invoiceId, status: 'pending' }
  );
};

export const createCasheaOrder = async ({
  tenantId,
  amount,
  currency,
  description,
  customer,
  items,
  metadata = {},
  config: providedConfig = null,
}) => {
  if (!amount || Number(amount) <= 0) {
    throw new Error('El monto de la orden Cashea debe ser mayor a 0');
  }

  const config = parseConfig(providedConfig) || (await getCasheaConfig(tenantId));

  if (!config) {
    throw new Error('Cashea no está configurado para este tenant');
  }

  const baseUrl = (config.api_base_url || config.base_url || '').replace(/\/$/, '');
  const payload = buildRequestPayload({ amount, currency, description, customer, items, metadata, config });
  const headers = buildAuthHeaders(config);

  if (baseUrl) {
    try {
      const endpoint = config.create_order_endpoint || '/orders';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al crear la orden Cashea');
      }

      const data = await response.json();
      return normalizeOrderResponse(data, {
        orderId: metadata.orderId,
        invoiceId: metadata.invoiceId,
      });
    } catch (error) {
      console.error('[CasheaService] Error calling Cashea API:', error);
      if (!config.enable_sandbox && !config.allow_sandbox_fallback) {
        throw error;
      }
    }
  }

  return simulateOrderResponse({ amount, metadata });
};

export default {
  getCasheaConfig,
  createCasheaOrder,
};
