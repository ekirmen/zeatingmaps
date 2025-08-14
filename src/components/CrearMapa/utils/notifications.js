// Sistema de notificaciones
let notificationContainer = null;

const createNotificationContainer = () => {
  if (notificationContainer) return notificationContainer;
  
  notificationContainer = document.createElement('div');
  notificationContainer.className = 'notification-container';
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  
  document.body.appendChild(notificationContainer);
  return notificationContainer;
};

const showNotification = (message, type = 'info', duration = 3000) => {
  const container = createNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    word-wrap: break-word;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    cursor: pointer;
  `;
  
  notification.textContent = message;
  
  // Icono según el tipo
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  notification.innerHTML = `${icon} ${message}`;
  
  container.appendChild(notification);
  
  // Animación de entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-eliminación
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, duration);
  
  // Click para cerrar
  notification.addEventListener('click', () => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  });
  
  return notification;
};

// Funciones específicas por tipo
const showSuccess = (message, duration) => showNotification(message, 'success', duration);
const showError = (message, duration) => showNotification(message, 'error', duration);
const showInfo = (message, duration) => showNotification(message, 'info', duration);
const showWarning = (message, duration) => showNotification(message, 'warning', duration);

export {
  showNotification,
  showSuccess,
  showError,
  showInfo,
  showWarning
};
