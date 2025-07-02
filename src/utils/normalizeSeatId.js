export const normalizeSeatId = (id) =>
  typeof id === 'string' ? id.replace(/^silla_/, '') : id;
export default normalizeSeatId;
