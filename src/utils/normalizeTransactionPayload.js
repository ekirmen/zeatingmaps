const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function tryParse(val) {
  if (val == null) return val;
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return val;

  try {
    return JSON.parse(val);
  } catch (error) {
    return val;
  }
}

function extractId(val) {
  if (val == null) return null;

  if (typeof val === 'string') {
    const parsed = tryParse(val);

    if (typeof parsed === 'object' && parsed !== null) {
      return parsed.id ?? parsed._id ?? null;
    }

    return val;
  }

  if (typeof val === 'object') {
    return val.id ?? val._id ?? null;
  }

  return null;
}

function ensureUuidOrNull(val) {
  if (!val) return null;

  const id = extractId(val);

  if (typeof id === 'string' && UUID_REGEX.test(id)) {
    return id;
  }

  return null;
}

function ensureMetadataObject(value) {
  const parsed = tryParse(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed;
  }
  return {};
}

export function buildPaymentTransactionPayload(transactionData = {}) {
  const payload = {
    order_id: transactionData.orderId ?? transactionData.order_id ?? null,
    gateway_id: ensureUuidOrNull(
      transactionData.gatewayId ??
        transactionData.gateway_id ??
        transactionData.payment_gateway_id
    ),
    payment_gateway_id: ensureUuidOrNull(
      transactionData.gatewayId ?? transactionData.payment_gateway_id
    ),
    amount: transactionData.amount ?? null,
    currency: transactionData.currency ?? 'USD',
    status: transactionData.status ?? 'pending',
    gateway_transaction_id:
      transactionData.gatewayTransactionId ??
      transactionData.gateway_transaction_id ??
      null,
    gateway_response: (() => {
      const g =
        transactionData.gatewayResponse ??
        transactionData.gateway_response ??
        null;
      return tryParse(g);
    })(),
    locator: transactionData.locator ?? null,
    tenant_id: ensureUuidOrNull(
      transactionData.tenantId ?? transactionData.tenant_id
    ),
    user_id: ensureUuidOrNull(
      transactionData.userId ??
        transactionData.user_id ??
        transactionData.usuario_id ??
        transactionData.user
    ),
    evento_id: ensureUuidOrNull(
      transactionData.eventoId ??
        transactionData.eventId ??
        transactionData.evento_id ??
        transactionData.event
    ),
    funcion_id: (() => {
      const f =
        transactionData.funcionId ??
        transactionData.funcion_id ??
        transactionData.functionId ??
        transactionData.funcion;

      if (f == null || f === '') return null;

      const n = Number(f);
      return Number.isInteger(n) ? n : null;
    })(),
    payment_method:
      transactionData.paymentMethod ??
      transactionData.payment_method ??
      'unknown',
    gateway_name: transactionData.gatewayName ?? transactionData.gateway_name ?? null,
    seats: tryParse(transactionData.seats ?? null),
    monto: transactionData.monto ?? transactionData.amount ?? null,
    processed_by: ensureUuidOrNull(
      transactionData.processedBy ?? transactionData.processed_by
    ),
    fecha: transactionData.fecha ?? null,
    payments: tryParse(transactionData.payments ?? null),
    referrer: transactionData.referrer ?? null,
    discountCode: transactionData.discountCode ?? null,
    reservationDeadline: transactionData.reservationDeadline ?? null,
    metadata: ensureMetadataObject(
      transactionData.metadata ?? transactionData.meta ?? {}
    )
  };

  const maybeObjectFields = [
    ['gatewayId', 'gateway_id'],
    ['userId', 'user_id'],
    ['tenantId', 'tenant_id'],
    ['eventoId', 'eventId', 'event', 'evento_id'],
    ['funcionId', 'funcion_id', 'functionId', 'funcion'],
    ['processedBy', 'processed_by']
  ];

  maybeObjectFields.forEach((keys) => {
    for (const k of keys) {
      const raw = transactionData[k];

      if (raw && typeof raw === 'object') {
        payload.metadata = payload.metadata || {};
        payload.metadata[k] = raw;
        break;
      }

      if (typeof raw === 'string') {
        const parsed = tryParse(raw);

        if (parsed && typeof parsed === 'object') {
          payload.metadata = payload.metadata || {};
          payload.metadata[k] = parsed;
          break;
        }
      }
    }
  });

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

export default buildPaymentTransactionPayload;
