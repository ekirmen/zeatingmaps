const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStoreImages() {
  console.log('🖼️ [STORE] Verificando imágenes en la página del store...');
  
  const tenantId = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
  
  try {
    // Obtener eventos del tenant
    console.log(`📋 [STORE] Obteniendo eventos para tenant: ${tenantId}`);
    
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (eventosError) {
      console.error('❌ [STORE] Error obteniendo eventos:', eventosError);
      return;
    }
    
    console.log(`✅ [STORE] Eventos encontrados: ${eventos.length}`);
    
    eventos.forEach((evento, index) => {
      console.log(`\n📅 [STORE] Evento ${index + 1}:`);
      console.log(`   ID: ${evento.id}`);
      console.log(`   Nombre: ${evento.nombre}`);
      console.log(`   Slug: ${evento.slug}`);
      
      // Verificar imágenes
      if (evento.imagenes) {
        try {
          const images = typeof evento.imagenes === 'string' 
            ? JSON.parse(evento.imagenes) 
            : evento.imagenes;
          
          console.log(`   🖼️ Imágenes disponibles:`);
          Object.keys(images).forEach(key => {
            const imageData = images[key];
            if (imageData) {
              console.log(`      ${key}: ${imageData.url || imageData.publicUrl || imageData.src || 'N/A'}`);
            }
          });
          
          // Verificar si hay imágenes en el bucket
          const bucketName = `tenant-${tenantId}`;
          const eventFolder = `${evento.id}`;
          
          console.log(`   📁 Verificando bucket: ${bucketName}/${eventFolder}`);
          
          // Listar archivos en la carpeta del evento
          supabase.storage
            .from(bucketName)
            .list(eventFolder)
            .then(({ data: files, error: filesError }) => {
              if (filesError) {
                console.log(`      ❌ Error listando archivos: ${filesError.message}`);
              } else {
                console.log(`      📄 Archivos en bucket: ${files.length}`);
                files.forEach(file => {
                  console.log(`         - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
                });
              }
            });
          
        } catch (e) {
          console.log(`   ❌ Error parsing imágenes: ${e.message}`);
        }
      } else {
        console.log(`   ❌ No hay imágenes definidas`);
      }
    });
    
    console.log('\n🎯 [STORE] Verificación completada');
    console.log('💡 [STORE] Revisa la consola del navegador para ver si las imágenes se cargan correctamente');
    
  } catch (error) {
    console.error('💥 [STORE] Error inesperado:', error);
  }
}

// Ejecutar verificación
testStoreImages();
