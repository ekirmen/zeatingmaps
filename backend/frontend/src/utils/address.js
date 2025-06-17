export const buildAddress = ({ direccionLinea1 = '', ciudad = '', codigoPostal = '', estado = '', pais = '' }) => {
  const parts = [];
  if (direccionLinea1) parts.push(direccionLinea1);
  const cityPostal = [ciudad, codigoPostal].filter(Boolean).join(' ').trim();
  if (cityPostal) parts.push(cityPostal);
  if (estado) parts.push(estado);
  if (pais) parts.push(pais);
  return parts.join(', ');
};

export default buildAddress;
