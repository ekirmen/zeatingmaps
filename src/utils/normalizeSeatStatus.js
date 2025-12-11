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


  return STATUS_MAP[status] || status;
}
