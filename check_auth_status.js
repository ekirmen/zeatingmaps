// Script para verificar el estado de autenticación
// Ejecutar en la consola del navegador

console.log('🔍 Verificando estado de autenticación...');

// Verificar si hay un token en localStorage
const token = localStorage.getItem('token');
console.log('Token en localStorage:', token ? '✅ Presente' : '❌ Ausente');

if (token) {
  console.log('Longitud del token:', token.length);
  console.log('Preview del token:', token.substring(0, 20) + '...');
}

// Verificar si Supabase está disponible
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Cliente Supabase disponible');
  
  // Verificar sesión actual
  window.supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('\n📋 Estado de la sesión:');
    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
    } else if (session) {
      console.log('✅ Sesión activa');
      console.log('👤 Usuario:', session.user.email);
      console.log('🆔 User ID:', session.user.id);
      console.log('⏰ Expira:', new Date(session.expires_at * 1000));
      console.log('🔑 Access Token presente:', !!session.access_token);
    } else {
      console.log('❌ No hay sesión activa');
    }
  });

  // Verificar usuario actual
  window.supabase.auth.getUser().then(({ data: { user }, error }) => {
    console.log('\n👤 Usuario actual:');
    if (error) {
      console.error('❌ Error obteniendo usuario:', error);
    } else if (user) {
      console.log('✅ Usuario autenticado:', user.email);
      console.log('🆔 ID:', user.id);
    } else {
      console.log('❌ No hay usuario autenticado');
    }
  });
} else {
  console.log('❌ Cliente Supabase no disponible');
}

// Verificar si estamos en el backoffice
console.log('\n🏢 Contexto de la aplicación:');
console.log('URL actual:', window.location.href);
console.log('Es backoffice:', window.location.pathname.includes('/dashboard'));

// Verificar si hay errores de autenticación en la consola
console.log('\n💡 Recomendaciones:');
console.log('1. Si no hay sesión activa, necesitas iniciar sesión');
console.log('2. Si hay sesión pero sigue el error 401, puede ser un problema de RLS');
console.log('3. Verifica que el usuario tenga permisos para acceder a la tabla funciones');
