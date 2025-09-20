// =====================================================
// APLICAR CORRECCIONES DE AUTENTICACIÓN UNIFICADA
// =====================================================

// 1. CORREGIR StoreHeader.js
const fixStoreHeader = `
// En src/store/components/StoreHeader.js
// Reemplazar la función handleLogin (líneas 85-117) con:

const handleLogin = async () => {
  try {
    setError('');
    if (!formData.email)
      throw new Error(t('errors.enter_credentials', 'Por favor ingrese correo'));

    const { user, session } = await loginUser({
      email: formData.email.trim(),
      password: formData.password.trim()
    });

    if (session && session.access_token) {
      const token = session.access_token;
      localStorage.setItem('token', token);
      
      // ACTUALIZAR TODOS LOS CONTEXTOS
      onLogin?.({ token, user });
      
      // FORZAR ACTUALIZACIÓN DE LA UI
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user, session, action: 'login' } 
      }));
      
      setIsAccountModalVisible(false);
      setFormData({ email: '', password: '' });
      message.success(t('login.success'));
      
      if (user?.user_metadata?.password_set !== true) {
        setIsPasswordModalVisible(true);
      }
      navigate(refParam ? \`/store?ref=\${refParam}\` : '/store');
    } else {
      message.success(t('login.email_sent'));
    }
  } catch (error) {
    const feedbackMessage = getAuthMessage(error, t, 'errors.login');
    const messageType = error?.type && message[error.type] ? error.type : 'error';
    setError(feedbackMessage);
    message[messageType](feedbackMessage);
    localStorage.removeItem('token');
  }
};

// Reemplazar la función handleLogout (líneas 134-142) con:

const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    
    // ACTUALIZAR TODOS LOS CONTEXTOS
    if (typeof onLogout === 'function') onLogout();
    
    // FORZAR ACTUALIZACIÓN DE LA UI
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: null, session: null, action: 'logout' } 
    }));
    
    message.success(t('logout.success'));
    
    if (window.location.pathname === '/store/perfil') {
      navigate('/store');
    }
  } catch (error) {
    console.error('Error during logout:', error);
    message.error('Error al cerrar sesión');
  }
};
`;

// 2. CORREGIR AuthContext.js
const fixAuthContext = `
// En src/contexts/AuthContext.js
// Agregar después de la línea 47 (después de validateSession):

// Escuchar eventos de cambio de autenticación
useEffect(() => {
  const handleAuthStateChange = (event) => {
    const { user, session, action } = event.detail;
    
    if (action === 'login' && user) {
      setUser(user);
      fetchUserRole(user.id);
    } else if (action === 'logout') {
      setUser(null);
      setRole(null);
    }
  };

  window.addEventListener('authStateChanged', handleAuthStateChange);
  
  return () => {
    window.removeEventListener('authStateChanged', handleAuthStateChange);
  };
}, []);

// Modificar la función login (líneas 49-72) para incluir el evento:

const login = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      const authError = await createAuthError({
        error: error || new Error('Respuesta de inicio de sesión inválida'),
        email,
        supabaseClient: supabase,
      });
      throw authError;
    }
    const token = data.session.access_token;
    localStorage.setItem('token', token);
    setUser(data.user);
    fetchUserRole(data.user.id);
    
    // DISPARAR EVENTO DE CAMBIO
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: data.user, session: data.session, action: 'login' } 
    }));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Modificar la función logout para incluir el evento:

const logout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
    
    // DISPARAR EVENTO DE CAMBIO
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: null, session: null, action: 'logout' } 
    }));
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
`;

// 3. CORREGIR useAuth.js
const fixUseAuth = `
// En src/hooks/useAuth.js
// Agregar después de la línea 81 (después de validateSession):

// Escuchar eventos de cambio de autenticación
useEffect(() => {
  const handleAuthStateChange = (event) => {
    const { user, session, action } = event.detail;
    
    if (action === 'login' && user) {
      setUser(user);
      fetchUserProfile(user.id).then(setUserProfile);
    } else if (action === 'logout') {
      setUser(null);
      setUserProfile(null);
      setError(null);
    }
  };

  window.addEventListener('authStateChanged', handleAuthStateChange);
  
  return () => {
    window.removeEventListener('authStateChanged', handleAuthStateChange);
  };
}, [fetchUserProfile]);

// Modificar la función signIn (líneas 84-138) para incluir el evento:

const signIn = async ({ email, password }) => {
  setLoading(true);
  setError(null);

  const supabase = getSupabaseClient();

  try {
    if (!supabase) {
      throw new Error('Cliente de Supabase no disponible');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data?.session) {
      throw await createAuthError({
        error: error || new Error('Respuesta de inicio de sesión inválida'),
        email,
        supabaseClient: supabase,
      });
    }

    if (data?.user) {
      setUser(data.user);

      const profile = await fetchUserProfile(data.user.id);
      setUserProfile(profile);

      console.log('[useAuth] Login exitoso:', {
        id: data.user.id,
        email: data.user.email,
        profile: profile
      });

      // DISPARAR EVENTO DE CAMBIO
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: data.user, session: data.session, action: 'login' } 
      }));

      return { success: true, user: data.user, profile };
    }

    throw await createAuthError({
      error: new Error('Respuesta de login inválida'),
      email,
      supabaseClient: supabase,
    });
  } catch (err) {
    console.error('[useAuth] Error en login:', err);
    const authError = err?.code && err?.i18nKey
      ? err
      : await createAuthError({ error: err, email, supabaseClient: supabase });
    setError(authError.message);
    throw authError;
  } finally {
    setLoading(false);
  }
};

// Modificar la función signOut (líneas 141-161) para incluir el evento:

const signOut = async () => {
  try {
    setLoading(true);
    
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setUserProfile(null);
    setError(null);
    
    // DISPARAR EVENTO DE CAMBIO
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { user: null, session: null, action: 'logout' } 
    }));
    
    console.log('[useAuth] Logout exitoso');
    return { success: true };
  } catch (err) {
    console.error('[useAuth] Error en logout:', err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};
`;

console.log('=== CORRECCIONES DE AUTENTICACIÓN UNIFICADA ===');
console.log('');
console.log('1. CORREGIR StoreHeader.js:');
console.log(fixStoreHeader);
console.log('');
console.log('2. CORREGIR AuthContext.js:');
console.log(fixAuthContext);
console.log('');
console.log('3. CORREGIR useAuth.js:');
console.log(fixUseAuth);
console.log('');
console.log('=== INSTRUCCIONES ===');
console.log('1. Aplica estos cambios a los archivos correspondientes');
console.log('2. El sistema ahora usará eventos personalizados para sincronizar');
console.log('3. Login y logout actualizarán automáticamente todos los contextos');
console.log('4. No será necesario recargar la página');
