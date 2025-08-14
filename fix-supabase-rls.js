// fix-supabase-rls.js
// Script para limpiar y recrear políticas RLS en Supabase

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szmyqodwwdwjdodzebcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bXlxb2R3d2R3amRvZHplYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDA5ODUsImV4cCI6MjA2NjAxNjk4NX0.2ftU66dlgog312oX-N0XsM84rU4I0gHKCyBF4bOj0YU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Solucionando políticas RLS...\n');

    // 1. Deshabilitar RLS temporalmente
    console.log('1️⃣ Deshabilitando RLS temporalmente...');
    const disableRLS = `
      ALTER TABLE recintos DISABLE ROW LEVEL SECURITY;
      ALTER TABLE salas DISABLE ROW LEVEL SECURITY;
      ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
      ALTER TABLE funciones DISABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    `;

    const { error: disableError } = await supabase.rpc('exec_sql', { sql: disableRLS });
    if (disableError) {
      console.log('⚠️ No se pudo deshabilitar RLS (puede ser normal):', disableError.message);
    } else {
      console.log('✅ RLS deshabilitado temporalmente');
    }

    // 2. Eliminar políticas problemáticas
    console.log('\n2️⃣ Eliminando políticas problemáticas...');
    const dropPolicies = `
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON recintos;
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON recintos;
      DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON recintos;
      DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON recintos;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('⚠️ No se pudo eliminar políticas (puede ser normal):', dropError.message);
    } else {
      console.log('✅ Políticas problemáticas eliminadas');
    }

    // 3. Habilitar RLS nuevamente
    console.log('\n3️⃣ Habilitando RLS nuevamente...');
    const enableRLS = `
      ALTER TABLE recintos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE funciones ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `;

    const { error: enableError } = await supabase.rpc('exec_sql', { sql: enableRLS });
    if (enableError) {
      console.log('⚠️ No se pudo habilitar RLS:', enableError.message);
    } else {
      console.log('✅ RLS habilitado nuevamente');
    }

    // 4. Crear políticas simples
    console.log('\n4️⃣ Creando políticas simples...');
    const createPolicies = `
      CREATE POLICY "recintos_tenant_isolation" ON recintos
          FOR ALL USING (
              tenant_id = (
                  SELECT tenant_id FROM profiles 
                  WHERE id = auth.uid()
              )
          );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.log('❌ Error creando políticas:', createError.message);
    } else {
      console.log('✅ Políticas creadas correctamente');
    }

    // 5. Verificar que recintos funciona
    console.log('\n5️⃣ Verificando acceso a recintos...');
    const { data: recintos, error: recintosError } = await supabase
      .from('recintos')
      .select('*')
      .limit(1);

    if (recintosError) {
      console.log('❌ Error persistente en recintos:', recintosError.message);
    } else {
      console.log('✅ Acceso a recintos restaurado:', recintos?.length || 0);
    }

  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

fixRLSPolicies();
