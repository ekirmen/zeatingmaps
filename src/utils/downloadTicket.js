import API_BASE_URL from './apiBase';

export default async function downloadTicket(locator) {
  if (!locator) throw new Error('Invalid locator');
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/payments/${locator}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Failed to download ticket');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${locator}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Error downloading ticket:', err);
    throw err;
  }
}
