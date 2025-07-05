let cachedSessionId = null;

const getCartSessionId = () => {
  if (cachedSessionId) return cachedSessionId;
  try {
    cachedSessionId = localStorage.getItem('cart_session_id');
    if (!cachedSessionId) {
      cachedSessionId = crypto.randomUUID();
      localStorage.setItem('cart_session_id', cachedSessionId);
    }
  } catch (err) {
    cachedSessionId = crypto.randomUUID();
  }
  return cachedSessionId;
};

export default getCartSessionId;
