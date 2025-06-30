export default function formatDateString(dateStr) {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleString();
  const replaced = dateStr && typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const d2 = new Date(replaced);
  if (!isNaN(d2.getTime())) return d2.toLocaleString();
  return dateStr;
}
