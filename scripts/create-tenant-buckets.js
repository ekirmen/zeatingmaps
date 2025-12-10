#!/usr/bin/env node

/**
 * Script para crear buckets organizados por tenant_id
 * 
 * Uso: node scripts/create-tenant-buckets.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTenantBuckets() {
  console.log('🚀 Creando buckets organizados por tenant...');
  
  try {
    // 1. Obtener todos los tenants únicos
    console.log('📋 Obteniendo tenants...');
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('tenant_id')
      .not('tenant_id', 'is', null);
    
    if (eventosError) {
      throw new Error(`Error obteniendo eventos: ${eventosError.message}`);
    }
    
    // Obtener tenant_ids únicos
    const uniqueTenants = [...new Set(eventos.map(e => e.tenant_id))];
    console.log(`✅ Encontrados ${uniqueTenants.length} tenants únicos`);
    
    // 2. Para cada tenant, crear su bucket
    for (const tenantId of uniqueTenants) {
      console.log(`\n🔄 Procesando tenant: ${tenantId}`);
      
      try {
        // Crear bucket para el tenant
        const bucketName = `tenant-${tenantId}`;
        
        // Verificar si el bucket ya existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error(`❌ Error listando buckets:`, listError.message);
          continue;
        }
        
        const bucketExists = buckets.some(bucket => bucket.name === bucketName);
        
        if (bucketExists) {
          console.log(`⚠️  Bucket ${bucketName} ya existe`);
        } else {
          // Crear nuevo bucket
          const { data: bucketData, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
          });
          
          if (createError) {
            console.error(`❌ Error creando bucket ${bucketName}:`, createError.message);
            continue;
          }
          
          console.log(`✅ Bucket ${bucketName} creado exitosamente`);
        }
        
        // 3. Crear estructura de carpetas dentro del bucket
        const { data: eventosTenant, error: eventosTenantError } = await supabase
          .from('eventos')
          .select('id, nombre')
          .eq('tenant_id', tenantId);
        
        if (eventosTenantError) {
          console.error(`❌ Error obteniendo eventos del tenant:`, eventosTenantError.message);
          continue;
        }
        
        // Crear carpeta para cada evento
        for (const evento of eventosTenant) {
          const folderPath = `${evento.id}/.gitkeep`;
          
          const { error: folderError } = await supabase.storage
            .from(bucketName)
            .upload(folderPath, '');
          
          if (folderError && !folderError.message.includes('already exists')) {
            console.error(`❌ Error creando carpeta ${evento.id}:`, folderError.message);
          } else {
            console.log(`  📁 Carpeta creada: ${evento.id} (${evento.nombre})`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error procesando tenant ${tenantId}:`, error.message);
      }
    }
    
    console.log('\n🎉 Estructura de buckets creada exitosamente!');
    console.log('\n📝 Estructura creada:');
    console.log('tenant-{tenant_id}/');
    console.log('├── {event_id}/');
    console.log('│   ├── banner.jpg');
    console.log('│   ├── portada.jpg');
    console.log('│   └── obraImagen.jpg');
    console.log('└── ...');
    
  } catch (error) {
    console.error('❌ Error creando buckets:', error.message);
    process.exit(1);
  }
}

// Función para migrar imágenes a los nuevos buckets
async function migrateImagesToTenantBuckets() {
  console.log('🚀 Migrando imágenes a buckets por tenant...');
  
  try {
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id, nombre, tenant_id, imagenes')
      .not('tenant_id', 'is', null);
    
    if (eventosError) {
      throw new Error(`Error obteniendo eventos: ${eventosError.message}`);
    }
    
    for (const evento of eventos) {
      console.log(`\n🔄 Migrando imágenes del evento: ${evento.nombre}`);
      
      try {
        let images = {};
        if (evento.imagenes) {
          if (typeof evento.imagenes === 'string') {
            images = JSON.parse(evento.imagenes);
          } else {
            images = evento.imagenes;
          }
        }
        
        if (!images || Object.keys(images).length === 0) {
          console.log(`⚠️  No hay imágenes para migrar`);
          continue;
        }
        
        const bucketName = `tenant-${evento.tenant_id}`;
        
        // Migrar cada imagen
        for (const [imageType, imageData] of Object.entries(images)) {
          if (!imageData || typeof imageData !== 'object') continue;
          
          const imagePath = imageData.url || imageData.publicUrl || imageData.src;
          if (!imagePath) continue;
          
          const fileName = imagePath.split('/').pop();
          if (!fileName) continue;
          
          const newPath = `${evento.id}/${fileName}`;
          
          console.log(`  📁 Migrando ${imageType}: ${imagePath} -> ${newPath}`);
          
          try {
            // Copiar desde bucket 'eventos' al bucket del tenant
            const { data: copyData, error: copyError } = await supabase.storage
              .from('eventos')
              .copy(imagePath, newPath, {
                destinationBucket: bucketName
              });
            
            if (copyError) {
              console.error(`    ❌ Error copiando:`, copyError.message);
              continue;
            }
            
            console.log(`    ✅ Migrado exitosamente`);
            
            // Actualizar referencia
            images[imageType] = {
              ...imageData,
              url: newPath,
              publicUrl: newPath,
              src: newPath,
              bucket: bucketName
            };
            
          } catch (error) {
            console.error(`    ❌ Error migrando ${imagePath}:`, error.message);
          }
        }
        
        // Actualizar evento
        const { error: updateError } = await supabase
          .from('eventos')
          .update({ imagenes: images })
          .eq('id', evento.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando evento:`, updateError.message);
        } else {
          console.log(`✅ Evento actualizado con nuevas rutas`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando evento:`, error.message);
      }
    }
    
    console.log('\n🎉 Migración a buckets por tenant completada!');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
  }
}

// Ejecutar
if (require.main === module) {
  createTenantBuckets()
    .then(() => migrateImagesToTenantBuckets())
    .catch(console.error);
}

module.exports = { createTenantBuckets, migrateImagesToTenantBuckets };
