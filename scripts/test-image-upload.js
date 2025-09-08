const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  console.log('🧪 [TEST] Iniciando prueba de subida de imagen...');
  
  const tenantId = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
  const bucketName = `tenant-${tenantId}`;
  const eventId = 'b0b48dd8-7c52-462a-8c79-b00129422810';
  
  try {
    // Crear una imagen de prueba simple (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, compression, filter, interlace
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // CRC
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    const fileName = `banner_${Date.now()}.png`;
    const filePath = `${eventId}/${fileName}`;
    
    console.log(`📦 [TEST] Subiendo imagen de prueba:`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Ruta: ${filePath}`);
    console.log(`   Tamaño: ${testImageBuffer.length} bytes`);
    
    // Subir la imagen
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ [TEST] Error subiendo imagen:', error);
      return;
    }
    
    console.log('✅ [TEST] Imagen subida exitosamente!');
    console.log(`   Path: ${data.path}`);
    console.log(`   ID: ${data.id}`);
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`🔗 [TEST] URL pública: ${publicUrl}`);
    
    // Verificar que se puede acceder a la imagen
    console.log(`🔍 [TEST] Verificando acceso a la imagen...`);
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (fileError) {
      console.error('❌ [TEST] Error descargando imagen:', fileError);
    } else {
      console.log(`✅ [TEST] Imagen descargada exitosamente (${fileData.size} bytes)`);
    }
    
    // Listar archivos en la carpeta del evento
    console.log(`📁 [TEST] Listando archivos en carpeta del evento...`);
    const { data: eventFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list(eventId, { limit: 10 });
    
    if (listError) {
      console.error('❌ [TEST] Error listando archivos:', listError);
    } else {
      console.log(`✅ [TEST] Archivos en carpeta del evento: ${eventFiles.length}`);
      eventFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${file.metadata?.size || 'N/A'} bytes, ${file.metadata?.mimetype || 'N/A'})`);
      });
    }
    
    // Simular la estructura de datos que se guardaría en la BD
    const imageData = {
      url: filePath,
      publicUrl: publicUrl,
      bucket: bucketName,
      fileName: fileName,
      size: testImageBuffer.length,
      type: 'image/png'
    };
    
    console.log(`💾 [TEST] Estructura de datos para BD:`);
    console.log(JSON.stringify(imageData, null, 2));
    
    // Limpiar: eliminar la imagen de prueba
    console.log(`🗑️ [TEST] Eliminando imagen de prueba...`);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (deleteError) {
      console.error('❌ [TEST] Error eliminando imagen:', deleteError);
    } else {
      console.log(`✅ [TEST] Imagen de prueba eliminada exitosamente`);
    }
    
    console.log('🎉 [TEST] Prueba de subida de imagen completada exitosamente!');
    
  } catch (error) {
    console.error('💥 [TEST] Error inesperado:', error);
  }
}

// Ejecutar prueba
testImageUpload();
