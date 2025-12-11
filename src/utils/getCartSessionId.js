let cachedSessionId = null;


  if (cachedSessionId) return cachedSessionId;
  try {
    // Try to get from localStorage first for persistence across sessions
    cachedSessionId = localStorage.getItem('cart_session_id');
    if (!cachedSessionId) {
      // Fallback to sessionStorage if not found in localStorage
      cachedSessionId = sessionStorage.getItem('cart_session_id');
    }
    if (!cachedSessionId) {
      cachedSessionId = crypto.randomUUID();
      // Store in both localStorage and sessionStorage for persistence and fallback
      localStorage.setItem('cart_session_id', cachedSessionId);
      sessionStorage.setItem('cart_session_id', cachedSessionId);
    }
  } catch (err) {
    cachedSessionId = crypto.randomUUID();
  }
  return cachedSessionId;
};

export default getCartSessionId;
