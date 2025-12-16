let cachedSessionId = null;

const safeRandomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const getCartSessionId = () => {
  if (cachedSessionId) return cachedSessionId;

  try {
    // Try to get from localStorage first for persistence across sessions
    cachedSessionId = localStorage.getItem('cart_session_id') || sessionStorage.getItem('cart_session_id');

    if (!cachedSessionId) {
      cachedSessionId = safeRandomId();
      // Store in both localStorage and sessionStorage for persistence and fallback
      try {
        localStorage.setItem('cart_session_id', cachedSessionId);
        sessionStorage.setItem('cart_session_id', cachedSessionId);
      } catch (e) {
        // Storage may be unavailable in some environments; ignore
      }
    }
  } catch (err) {
    cachedSessionId = safeRandomId();
  }

  return cachedSessionId;
};

export default getCartSessionId;
