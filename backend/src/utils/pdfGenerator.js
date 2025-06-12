diff --git a/backend/src/utils/pdfGenerator.js b/backend/src/utils/pdfGenerator.js
index 6b8ef32643750c49670c83a17f81dd5f73268983..01df33a0ce9ce0706f038aa51c95e7bdf82bf6da 100644
--- a/backend/src/utils/pdfGenerator.js
+++ b/backend/src/utils/pdfGenerator.js
@@ -36,64 +36,61 @@ export const generateTicketPDF = async (payment) => {
       }
       if (payment.event.imagenes.portada) {
         const portadaPath = path.join(uploadsDir, payment.event.imagenes.portada.replace('/public/uploads/', ''));
         const portadaData = await fs.promises.readFile(portadaPath, 'base64');
         eventImages.push({
           image: `data:image/jpeg;base64,${portadaData}`,
           width: 300,
           margin: [0, 10, 0, 10]
         });
       }
     } catch (error) {
       console.error('Error processing event images:', error);
     }
   }
 
   const content = [];
 
   for (let i = 0; i < payment.seats.length; i += 1) {
     const seat = payment.seats[i];
     const qrData = await QRCode.toDataURL(seat.id);
 
     content.push(
       { text: 'Ticket de Compra', style: 'header' },
       { text: `Locator: ${payment.locator}`, style: 'subheader' },
       { text: `Fecha de compra: ${payment.createdAt.toLocaleString()}`, style: 'subheader' },
+      ...(eventImages.length ? [eventImages[0]] : []),
 
       { text: 'Información del Evento:', style: 'sectionHeader' },
       { text: `Nombre: ${payment.event?.nombre || 'N/A'}` },
-      { text: `Fecha: ${payment.event?.fecha ? new Date(payment.event.fecha).toLocaleString() : 'N/A'}` },
       { text: `Fecha celebración: ${payment.funcion?.fechaCelebracion ? new Date(payment.funcion.fechaCelebracion).toLocaleString() : 'N/A'}` },
       { text: `Lugar: ${payment.event?.recinto?.name || 'N/A'}` },
 
       { text: 'Datos del Comprador:', style: 'sectionHeader' },
       { text: `Nombre: ${payment.user?.name || 'N/A'}` },
-      { text: `Email: ${payment.user?.email || 'N/A'}` },
 
       { text: 'Datos del Asiento:', style: 'sectionHeader' },
       { text: `${seat.name} - ${seat.zona?.name || 'N/A'} - Mesa ${seat.mesa?.nombre || 'N/A'} - $${seat.price}` },
 
       { text: 'Código QR de acceso:', style: 'sectionHeader' },
-      { image: qrData, width: 150, alignment: 'center', margin: [0, 10, 0, 10] },
-
-      { text: 'Imágenes del Evento:', style: 'sectionHeader' },
-      ...eventImages.slice(0, 1)
+      { image: qrData, width: 150, alignment: 'center', margin: [0, 10, 0, 10] }
     );
 
     if (i < payment.seats.length - 1) {
       content.push({ text: '', pageBreak: 'after' });
     }
   }
 
   const docDefinition = {
     pageSize: 'A4',
     content,
+    // Place event banner near the top instead of in the footer
     styles: {
       header: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
       subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
       sectionHeader: { fontSize: 18, bold: true, margin: [0, 20, 0, 10] }
     },
     defaultStyle: { font: 'Roboto' }
   };
 
   return printer.createPdfKitDocument(docDefinition);
 };
