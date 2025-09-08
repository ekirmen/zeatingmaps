#!/usr/bin/env node

/**
 * Script para migrar imágenes del bucket 'eventos' a la nueva estructura:
 * tenant_id/event_id/image_name
 * 
 * Uso: node scripts/migrate-images-to-tenant-structure.js
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

async function migrateImagesToTenantStructure() {
  console.log('🚀 Iniciando migración de imágenes a estructura por tenant...');
  
  try {
    // 1. Obtener todos los eventos con sus tenant_id
    console.log('📋 Obteniendo eventos...');
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id, nombre, tenant_id, imagenes')
      .not('tenant_id', 'is', null);
    
    if (eventosError) {
      throw new Error(`Error obteniendo eventos: ${eventosError.message}`);
    }
    
    console.log(`✅ Encontrados ${eventos.length} eventos con tenant_id`);
    
    // 2. Para cada evento, procesar sus imágenes
    for (const evento of eventos) {
      console.log(`\n🔄 Procesando evento: ${evento.nombre} (${evento.id})`);
      
      try {
        // Parsear imágenes del evento
        let images = {};
        if (evento.imagenes) {
          if (typeof evento.imagenes === 'string') {
            images = JSON.parse(evento.imagenes);
          } else {
            images = evento.imagenes;
          }
        }
        
        if (!images || Object.keys(images).length === 0) {
          console.log(`⚠️  No hay imágenes para el evento ${evento.nombre}`);
          continue;
        }
        
        // 3. Para cada imagen, moverla a la nueva estructura
        for (const [imageType, imageData] of Object.entries(images)) {
          if (!imageData || typeof imageData !== 'object') continue;
          
          // Obtener la ruta de la imagen
          const imagePath = imageData.url || imageData.publicUrl || imageData.src;
          if (!imagePath) continue;
          
          // Extraer solo el nombre del archivo
          const fileName = imagePath.split('/').pop();
          if (!fileName) continue;
          
          // Nueva ruta: tenant_id/event_id/image_name
          const newPath = `${evento.tenant_id}/${evento.id}/${fileName}`;
          
          console.log(`  📁 Moviendo ${imageType}: ${imagePath} -> ${newPath}`);
          
          try {
            // Copiar archivo a nueva ubicación
            const { data: copyData, error: copyError } = await supabase.storage
              .from('eventos')
              .copy(imagePath, newPath);
            
            if (copyError) {
              console.error(`    ❌ Error copiando ${imagePath}:`, copyError.message);
              continue;
            }
            
            console.log(`    ✅ Copiado exitosamente`);
            
            // Actualizar la referencia en el JSON del evento
            images[imageType] = {
              ...imageData,
              url: newPath,
              publicUrl: newPath,
              src: newPath
            };
            
          } catch (error) {
            console.error(`    ❌ Error procesando ${imagePath}:`, error.message);
          }
        }
        
        // 4. Actualizar el evento con las nuevas rutas
        const { error: updateError } = await supabase
          .from('eventos')
          .update({ imagenes: images })
          .eq('id', evento.id);
        
        if (updateError) {
          console.error(`❌ Error actualizando evento ${evento.nombre}:`, updateError.message);
        } else {
          console.log(`✅ Evento ${evento.nombre} actualizado con nuevas rutas`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando evento ${evento.nombre}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migración completada!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Verificar que las imágenes se muestren correctamente');
    console.log('2. Eliminar las imágenes antiguas del bucket (opcional)');
    console.log('3. Actualizar la aplicación para usar la nueva estructura');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  }
}

// Función para crear la estructura de carpetas
async function createFolderStructure() {
  console.log('📁 Creando estructura de carpetas...');
  
  try {
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('tenant_id')
      .not('tenant_id', 'is', null);
    
    if (error) throw error;
    
    // Obtener tenant_ids únicos
    const uniqueTenants = [...new Set(eventos.map(e => e.tenant_id))];
    
    for (const tenantId of uniqueTenants) {
      // Crear carpeta del tenant
      const { error: tenantError } = await supabase.storage
        .from('eventos')
        .upload(`${tenantId}/.gitkeep`, '');
      
      if (tenantError && !tenantError.message.includes('already exists')) {
        console.error(`Error creando carpeta tenant ${tenantId}:`, tenantError.message);
      } else {
        console.log(`✅ Carpeta tenant creada: ${tenantId}`);
      }
    }
    
  } catch (error) {
    console.error('Error creando estructura:', error.message);
  }
}

// Ejecutar migración
if (require.main === module) {
  createFolderStructure()
    .then(() => migrateImagesToTenantStructure())
    .catch(console.error);
}

module.exports = { migrateImagesToTenantStructure, createFolderStructure };
