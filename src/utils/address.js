const normalizeAddressField = (value) => value ?? '';

const getAddressValue = (data = {}, keys = []) => {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== '') {
      return data[key];
    }
  }
  return '';
};

export const buildAddress = (data = {}) => {
  const direccionLinea1 = normalizeAddressField(
    getAddressValue(data, ['direccionLinea1', 'direccionlinea1', 'direccion_linea1', 'direccion'])
  );
  const ciudad = normalizeAddressField(getAddressValue(data, ['ciudad']));
  const codigoPostal = normalizeAddressField(
    getAddressValue(data, ['codigoPostal', 'codigopostal', 'codigo_postal'])
  );
  const estado = normalizeAddressField(getAddressValue(data, ['estado', 'provincia']));
  const pais = normalizeAddressField(getAddressValue(data, ['pais', 'country']));

  const parts = [];
  if (direccionLinea1) parts.push(direccionLinea1);
  const cityPostal = [ciudad, codigoPostal].filter(Boolean).join(' ').trim();
  if (cityPostal) parts.push(cityPostal);
  if (estado) parts.push(estado);
  if (pais) parts.push(pais);
  return parts.join(', ');
};

export default buildAddress;
