import API_BASE_URL from './apiBase';

export default async function downloadTicket(locator) {
  if (!locator) throw new Error('Invalid locator');
  const url = `${API_BASE_URL}/api/payments/${locator}/download`;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error('Failed to download ticket');

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${locator}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.error('Error downloading ticket:', err);
    // Fallback for CORS issues: open in new tab
    window.open(url, '_blank');
    return false;
  }
}
