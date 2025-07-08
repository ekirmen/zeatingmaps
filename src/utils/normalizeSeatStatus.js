const STATUS_MAP = {
  disponible: "available",
  bloqueado: "blocked",
  reservado: "blocked",
  pagado: "blocked",
  vendido: "blocked",
  selected: "selected",
  available: "available",
  blocked: "blocked",
};

export default function normalizeSeatStatus(status) {
  return STATUS_MAP[status] || status;
}
