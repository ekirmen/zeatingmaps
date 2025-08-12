const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurado' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabase() {
  console.log('🔍 Iniciando diagnóstico de base de datos...\n');

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      return;
    }
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar estructura de la tabla tenants
    console.log('2️⃣ Verificando estructura de la tabla tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(5);

    if (tenantsError) {
      console.error('❌ Error al consultar tenants:', tenantsError);
      return;
    }

    if (tenants && tenants.length > 0) {
      console.log('✅ Tabla tenants accesible');
      console.log('📊 Número de tenants:', tenants.length);
      
      // Mostrar estructura del primer tenant
      const firstTenant = tenants[0];
      console.log('🏗️ Estructura del primer tenant:');
      Object.keys(firstTenant).forEach(key => {
        const value = firstTenant[key];
        const type = typeof value;
        const isNull = value === null;
        console.log(`   ${key}: ${type} ${isNull ? '(NULL)' : `(${value})`}`);
      });
    } else {
      console.log('⚠️ Tabla tenants vacía o no accesible');
    }
    console.log('');

    // 3. Verificar tenant específico (zeatingmaps)
    console.log('3️⃣ Verificando tenant zeatingmaps...');
    const { data: zeatingmapsTenant, error: zeatingmapsError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'zeatingmaps')
      .single();

    if (zeatingmapsError) {
      console.error('❌ Error al buscar tenant zeatingmaps:', zeatingmapsError);
    } else if (zeatingmapsTenant) {
      console.log('✅ Tenant zeatingmaps encontrado:');
      console.log('   ID:', zeatingmapsTenant.id);
      console.log('   Subdomain:', zeatingmapsTenant.subdomain);
      console.log('   Company Name:', zeatingmapsTenant.company_name);
      console.log('   Status:', zeatingmapsTenant.status);
      console.log('   Domain:', zeatingmapsTenant.domain);
      console.log('   Full URL:', zeatingmapsTenant.full_url);
    } else {
      console.log('⚠️ Tenant zeatingmaps no encontrado');
    }
    console.log('');

    // 4. Verificar permisos RLS
    console.log('4️⃣ Verificando permisos RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('tenants')
      .select('id, subdomain, company_name')
      .eq('status', 'active')
      .limit(3);

    if (rlsError) {
      console.error('❌ Error de permisos RLS:', rlsError);
    } else {
      console.log('✅ Permisos RLS funcionando correctamente');
      console.log('📊 Tenants activos encontrados:', rlsTest?.length || 0);
    }
    console.log('');

    // 5. Verificar columnas nuevas (si existen)
    console.log('5️⃣ Verificando columnas de configuración dinámica...');
    const { data: configColumns, error: configError } = await supabase
      .from('tenants')
      .select('theme_config, feature_flags, branding_config, custom_routes, is_main_domain, tenant_type')
      .limit(1);

    if (configError) {
      console.error('❌ Error al verificar columnas de configuración:', configError);
    } else {
      console.log('✅ Columnas de configuración accesibles');
      if (configColumns && configColumns.length > 0) {
        const config = configColumns[0];
        console.log('   theme_config:', config.theme_config ? '✅ Presente' : '❌ Faltante');
        console.log('   feature_flags:', config.feature_flags ? '✅ Presente' : '❌ Faltante');
        console.log('   branding_config:', config.branding_config ? '✅ Presente' : '❌ Faltante');
        console.log('   custom_routes:', config.custom_routes ? '✅ Presente' : '❌ Faltante');
        console.log('   is_main_domain:', config.is_main_domain ? '✅ Presente' : '❌ Faltante');
        console.log('   tenant_type:', config.tenant_type ? '✅ Presente' : '❌ Faltante');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar diagnóstico
diagnoseDatabase().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
