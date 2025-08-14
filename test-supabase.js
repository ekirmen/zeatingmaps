// test-supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bXlxb2R3d2R3amRvZHplYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDA5ODUsImV4cCI6MjA2NjAxNjk4NX0.2ftU66dlgog312oX-N0XsM84rU4I0gHKCyBF4bOj0YU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDiagnosis() {
  try {
    console.log('🔍 Diagnóstico profundo de la base de datos...\n');
    
    // 1. Verificar si profiles tiene datos
    console.log('1️⃣ Verificando tabla profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error en profiles:', profilesError.message);
    } else {
      console.log('✅ Profiles encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('📋 Primer profile:', profiles[0]);
      }
    }
    
    // 2. Verificar tabla tenants
    console.log('\n2️⃣ Verificando tabla tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantsError) {
      console.log('❌ Error en tenants:', tenantsError.message);
    } else {
      console.log('✅ Tenants encontrados:', tenants?.length || 0);
      if (tenants && tenants.length > 0) {
        console.log('�� Tenants:', tenants);
      }
    }
    
    // 3. Verificar tabla recintos
    console.log('\n3️⃣ Verificando tabla recintos...');
    const { data: recintos, error: recintosError } = await supabase
      .from('recintos')
      .select('*')
      .limit(5);
    
    if (recintosError) {
      console.log('❌ Error en recintos:', recintosError.message);
    } else {
      console.log('✅ Recintos encontrados:', recintos?.length || 0);
      if (recintos && recintos.length > 0) {
        console.log('📋 Primer recinto:', recintos[0]);
      }
    }
    
    // 4. Verificar estructura de profiles
    console.log('\n4️⃣ Verificando estructura de profiles...');
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'profiles' });
    
    if (structureError) {
      console.log('⚠️ No se pudo obtener estructura (normal):', structureError.message);
    } else {
      console.log('📊 Estructura:', structure);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

deepDiagnosis();