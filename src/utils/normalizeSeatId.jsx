export const normalizeSeatId = (id) =>
  typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id;

export default normalizeSeatId;
