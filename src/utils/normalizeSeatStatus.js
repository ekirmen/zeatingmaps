const STATUS_MAP = {
  disponible: "available",
  bloqueado: "blocked",
  seleccionado: "selected",
  reservado: "blocked",
  pagado: "blocked",
  vendido: "blocked",
  selected: "selected",
  available: "available",
  blocked: "blocked",
};

export function normalizeSeatStatus(status) {
  return STATUS_MAP[status] || status;
}

export default normalizeSeatStatus;
