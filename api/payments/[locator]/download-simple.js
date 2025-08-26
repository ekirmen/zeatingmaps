import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(req, res) {
  console.log('🚀 [DOWNLOAD-SIMPLE] Endpoint de descarga simple llamado');
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    console.error('❌ [DOWNLOAD-SIMPLE] Missing locator in query params');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

  try {
    console.log('📄 [DOWNLOAD-SIMPLE] Creando documento PDF simple...');
    
    // Crear PDF simple sin dependencias externas
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Título
    page.drawText('TICKET DE PRUEBA', {
      x: 50,
      y: height - 50,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: helveticaBold,
    });

    // Datos básicos
    let y = height - 90;
    page.drawText(`Localizador: ${locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    page.drawText(`Estado: PAGADO`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 30;

    // Información de prueba
    page.drawText('Este es un ticket de prueba', { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
    y -= 25;
    page.drawText('Generado para verificar la funcionalidad', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    y -= 20;
    page.drawText('de descarga de PDFs', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });

    // Fecha
    const fechaCreacion = new Date().toLocaleString('es-ES');
    page.drawText(`Fecha de generación: ${fechaCreacion}`, { x: 50, y: 80, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

    // Mensaje de prueba
    page.drawText('Si puedes ver este PDF, la generación está funcionando correctamente', { 
      x: 50, 
      y: 50, 
      size: 10, 
      color: rgb(0.3,0.3,0.3), 
      font: helveticaFont 
    });

    console.log('💾 [DOWNLOAD-SIMPLE] Guardando PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD-SIMPLE] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-prueba-${locator}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-SIMPLE] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-SIMPLE] Error generando PDF de prueba:', err);
    console.error('❌ [DOWNLOAD-SIMPLE] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF de prueba', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
