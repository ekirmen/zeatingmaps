export default function formatDateString(dateStr) {
  if (!dateStr) return '—';

  // Si es solo una fecha (sin hora), agregar la hora para evitar problemas de zona horaria
  let processedDateStr = dateStr;
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    processedDateStr = dateStr + 'T00:00:00';
  }

  const d = new Date(processedDateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('es-ES');

  // Fallback: intentar con el formato original
  const d2 = new Date(dateStr);
  if (!isNaN(d2.getTime())) return d2.toLocaleDateString('es-ES');

  return dateStr;
}

export function formatDateTimeString(dateStr) {
  if (!dateStr) return '—';

  // Si es solo una fecha (sin hora), agregar la hora para evitar problemas de zona horaria
  let processedDateStr = dateStr;
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    processedDateStr = dateStr + 'T00:00:00';
  }

  const d = new Date(processedDateStr);
  if (!isNaN(d.getTime())) return d.toLocaleString('es-ES');

  // Fallback: intentar con el formato original
  const d2 = new Date(dateStr);
  if (!isNaN(d2.getTime())) return d2.toLocaleString('es-ES');

  return dateStr;
}
