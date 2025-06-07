import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';
import fs from 'fs';

const fonts = {
  Roboto: {
    normal: 'c:/ekirmen/backend/fonts/Roboto-Regular.ttf',
    bold: 'c:/ekirmen/backend/fonts/Roboto-Bold.ttf',
    italics: 'c:/ekirmen/backend/fonts/Roboto-Italic.ttf',
    bolditalics: 'c:/ekirmen/backend/fonts/Roboto-BoldItalic.ttf'
  }
};

const printer = new PdfPrinter(fonts);

export const generateTicketPDF = async (payment) => {
  // Generate QR code for each seat
  const qrCodes = await Promise.all(
    payment.seats.map(async seat => {
      const qrData = await QRCode.toDataURL(seat.id);
      return {
        image: qrData,
        width: 100,
        margin: [0, 10, 0, 10]
      };
    })
  );

  // Add event images
  const eventImages = [];
  if (payment.event?.imagenes) {
    try {
      if (payment.event.imagenes.banner) {
        const bannerPath = `c:/ekirmen/backend/src/public${payment.event.imagenes.banner}`;
        const bannerData = await fs.promises.readFile(bannerPath, 'base64');
        eventImages.push({
          image: `data:image/jpeg;base64,${bannerData}`,
          width: 500,
          margin: [0, 10, 0, 10]
        });
      }
      if (payment.event.imagenes.portada) {
        const portadaPath = `c:/ekirmen/backend/src/public${payment.event.imagenes.portada}`;
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

  // Update image path validation function
  function isValidImagePath(path) {
    return path && (path.startsWith('http') || path.startsWith('c:/ekirmen/backend/src/public'));
  }

  const docDefinition = {
    content: [
      { text: 'Ticket de Compra', style: 'header' },
      { text: `Locator: ${payment.locator}`, style: 'subheader' },
      { text: `Fecha: ${payment.createdAt.toLocaleString()}`, style: 'subheader' },
      
      // Event Information
      { text: 'Información del Evento:', style: 'sectionHeader' },
      { text: `Nombre: ${payment.event?.nombre || 'N/A'}` },
      { text: `Fecha: ${payment.event?.createdAt?.toLocaleString() || 'N/A'}` },
      { text: `Lugar: ${payment.event?.recinto?.name || 'N/A'}` },
      
      { text: 'Detalles del Usuario:', style: 'sectionHeader' },
      { text: `Nombre: ${payment.user?.name || 'N/A'}` },
      { text: `Email: ${payment.user?.email || 'N/A'}` },
      
      { text: 'Detalles de los Asientos:', style: 'sectionHeader' },
      {
        ul: payment.seats.map(seat => ({
          text: `${seat.name} - ${seat.zona?.name || 'N/A'} - Mesa ${seat.mesa?.nombre || 'N/A'} - $${seat.price}`,
          margin: [0, 5]
        }))
      },
      { text: `Total: $${payment.seats.reduce((sum, seat) => sum + seat.price, 0)}`, style: 'total' },
      
      // Add QR codes section
      { text: 'Códigos QR para acceso:', style: 'sectionHeader' },
      ...qrCodes,
      
      // Add event images section
      { text: 'Imágenes del Evento:', style: 'sectionHeader' },
      ...eventImages
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      sectionHeader: {
        fontSize: 18,
        bold: true,
        margin: [0, 20, 0, 10]
      },
      total: {
        fontSize: 16,
        bold: true,
        margin: [0, 20, 0, 0]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};