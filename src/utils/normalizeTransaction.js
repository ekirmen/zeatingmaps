import isUuid from './isUuid';

export const tryParseJson = (value) => {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const extractId = (value) => {
  if (value == null) return null;

  if (typeof value === 'object') {
    if (typeof value.id === 'string') return value.id;
    if (typeof value._id === 'string') return value._id;
    return null;
  }

  const maybeParsed = tryParseJson(value);
  if (maybeParsed && typeof maybeParsed === 'object') {
    if (typeof maybeParsed.id === 'string') return maybeParsed.id;
    if (typeof maybeParsed._id === 'string') return maybeParsed._id;
    return null;
  }

  return String(value);
};

const mapUuidField = (transactionData, candidates, metadata) => {
  let value = null;
  let updatedMetadata = metadata;

  for (const candidate of candidates) {
    if (!(candidate in transactionData)) continue;

    const raw = transactionData[candidate];
    const extracted = extractId(raw);

    if (extracted && isUuid(extracted)) {
      value = extracted;
      break;
    }

    const parsed = typeof raw === 'string' ? tryParseJson(raw) : raw;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      updatedMetadata = {
        ...updatedMetadata,
        [candidate]: parsed
      };
    }
  }

  return { value, metadata: updatedMetadata };
};

const coerceFuncionId = (value) => {
  if (value == null) return null;
  if (Number.isInteger(value)) return value;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const ensurePlainObject = (value, fallback = {}) => {
  if (value == null) return fallback;
  const parsed = tryParseJson(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed;
  }
  return fallback;
};

export const normalizeTransaction = (transactionData = {}) => {
  let metadata = ensurePlainObject(transactionData.metadata, {});

  const normalized = {
    order_id: transactionData.orderId ?? transactionData.order_id ?? null,
    amount: transactionData.amount ?? null,
    currency: transactionData.currency ?? 'USD',
    status: transactionData.status ?? 'pending',
    gateway_transaction_id:
      transactionData.gatewayTransactionId ??
      transactionData.gateway_transaction_id ??
      null,
    locator: transactionData.locator ?? null,
    payment_method:
      transactionData.paymentMethod ?? transactionData.payment_method ?? 'unknown',
    gateway_name: transactionData.gatewayName ?? transactionData.gateway_name ?? null,
    seats: tryParseJson(transactionData.seats ?? null),
    monto: transactionData.amount ?? null,
    fecha: transactionData.fecha ?? null,
    payments: tryParseJson(transactionData.payments ?? null),
    referrer: transactionData.referrer ?? null,
    discountCode: transactionData.discountCode ?? null,
    reservationDeadline: transactionData.reservationDeadline ?? null,
    metadata
  };

  const gatewayResult = mapUuidField(transactionData, [
    'gatewayId',
    'gateway_id',
    'payment_gateway_id',
    'paymentGatewayId'
  ], metadata);
  normalized.gateway_id = gatewayResult.value;
  metadata = gatewayResult.metadata;

  const paymentGatewayResult = mapUuidField(
    transactionData,
    ['payment_gateway_id', 'paymentGatewayId'],
    metadata
  );
  normalized.payment_gateway_id = paymentGatewayResult.value || normalized.gateway_id;
  metadata = paymentGatewayResult.metadata;

  const tenantResult = mapUuidField(transactionData, ['tenantId', 'tenant_id'], metadata);
  normalized.tenant_id = tenantResult.value;
  metadata = tenantResult.metadata;

  const userResult = mapUuidField(transactionData, ['userId', 'user_id', 'usuario_id', 'user'], metadata);
  normalized.user_id = userResult.value;
  metadata = userResult.metadata;

  const eventoResult = mapUuidField(
    transactionData,
    ['eventoId', 'eventId', 'event_id', 'event', 'evento_id'],
    metadata
  );
  normalized.evento_id = eventoResult.value;
  metadata = eventoResult.metadata;

  const processedByResult = mapUuidField(transactionData, ['processedBy', 'processed_by'], metadata);
  normalized.processed_by = processedByResult.value;
  metadata = processedByResult.metadata;

  const funcionRaw =
    transactionData.funcionId ??
    transactionData.funcion_id ??
    transactionData.functionId ??
    transactionData.funcion ??
    null;
  normalized.funcion_id = coerceFuncionId(funcionRaw);

  const gatewayResponseRaw =
    transactionData.gatewayResponse ?? transactionData.gateway_response ?? null;
  let gateway_response = tryParseJson(gatewayResponseRaw);
  try {
    JSON.stringify(gateway_response);
  } catch (error) {
    gateway_response = null;
  }
  normalized.gateway_response = gateway_response;

  try {
    JSON.stringify(metadata);
  } catch (error) {
    metadata = {};
  }

  normalized.metadata = metadata;

  return normalized;
};

export default normalizeTransaction;
