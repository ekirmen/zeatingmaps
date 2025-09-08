const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealImageUpload() {
  console.log('🧪 [TEST] Iniciando prueba de subida de imagen PNG...');
  
  const tenantId = '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
  const bucketName = `tenant-${tenantId}`;
  const eventId = 'b0b48dd8-7c52-462a-8c79-b00129422810';
  
  try {
    // Crear una imagen PNG válida de 100x100 pixels con color azul
    const width = 100;
    const height = 100;
    
    // PNG header
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);   // width
    ihdrData.writeUInt32BE(height, 4); // height
    ihdrData[8] = 8;  // bit depth
    ihdrData[9] = 2;  // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    
    const ihdrChunk = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length
      Buffer.from('IHDR'), // type
      ihdrData, // data
      Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC (simplificado)
    ]);
    
    // IDAT chunk con datos RGB (azul)
    const pixelData = Buffer.alloc(width * height * 3);
    for (let i = 0; i < pixelData.length; i += 3) {
      pixelData[i] = 0;     // R
      pixelData[i + 1] = 0; // G  
      pixelData[i + 2] = 255; // B (azul)
    }
    
    // Comprimir datos (simplificado - en realidad necesitaría zlib)
    const compressedData = Buffer.concat([
      Buffer.from([0x78, 0x9C]), // zlib header
      pixelData,
      Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC
    ]);
    
    const idatChunk = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // length (simplificado)
      Buffer.from('IDAT'), // type
      compressedData, // data
      Buffer.from([0x00, 0x00, 0x00, 0x00]) // CRC
    ]);
    
    // IEND chunk
    const iendChunk = Buffer.from([
      0x00, 0x00, 0x00, 0x00, // length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    // Crear imagen PNG completa
    const pngImage = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
    
    const fileName = `banner_${Date.now()}.png`;
    const filePath = `${eventId}/${fileName}`;
    
    console.log(`📦 [TEST] Subiendo imagen PNG:`);
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Ruta: ${filePath}`);
    console.log(`   Tamaño: ${pngImage.length} bytes`);
    console.log(`   Dimensiones: ${width}x${height} pixels`);
    
    // Subir la imagen
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, pngImage, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ [TEST] Error subiendo imagen:', error);
      
      // Si es error de RLS, mostrar información adicional
      if (error.message.includes('row-level security policy')) {
        console.log('🔧 [TEST] Error de política RLS detectado');
        console.log('💡 [TEST] Necesitas crear políticas RLS para storage.objects');
        console.log('📋 [TEST] Ejecuta la migración 044_create_functions_only.sql');
      }
      
      return;
    }
    
    console.log('✅ [TEST] Imagen PNG subida exitosamente!');
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
    
    // Simular la estructura de datos que se guardaría en la BD
    const imageData = {
      url: filePath,
      publicUrl: publicUrl,
      bucket: bucketName,
      fileName: fileName,
      size: pngImage.length,
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
    
    console.log('🎉 [TEST] Prueba de subida de imagen PNG completada exitosamente!');
    
  } catch (error) {
    console.error('💥 [TEST] Error inesperado:', error);
  }
}

// Ejecutar prueba
testRealImageUpload();
