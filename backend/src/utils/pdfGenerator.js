import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, '..', '..', 'fonts');
const fonts = {
  Roboto: {
    normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontsDir, 'Roboto-Bold.ttf'),
    italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontsDir, 'Roboto-BoldItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts);

export const generateTicketPDF = async (payment) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');

  const eventImages = [];
  if (payment.event?.imagenes) {
    try {
      if (payment.event.imagenes.banner) {
        const bannerPath = path.join(uploadsDir, payment.event.imagenes.banner.replace('/public/uploads/', ''));
        const bannerData = await fs.promises.readFile(bannerPath, 'base64');
        eventImages.push({
          image: `data:image/jpeg;base64,${bannerData}`,
          width: 500,
          margin: [0, 10, 0, 10]
        });
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

      { text: 'Información del Evento:', style: 'sectionHeader' },
      { text: `Nombre: ${payment.event?.nombre || 'N/A'}` },
      { text: `Fecha: ${payment.event?.createdAt?.toLocaleString() || 'N/A'}` },
      { text: `Lugar: ${payment.event?.recinto?.name || 'N/A'}` },

      { text: 'Datos del Comprador:', style: 'sectionHeader' },
      { text: `Nombre: ${payment.user?.name || 'N/A'}` },
      { text: `Email: ${payment.user?.email || 'N/A'}` },

      { text: 'Datos del Asiento:', style: 'sectionHeader' },
      { text: `${seat.name} - ${seat.zona?.name || 'N/A'} - Mesa ${seat.mesa?.nombre || 'N/A'} - $${seat.price}` },

      { text: 'Código QR de acceso:', style: 'sectionHeader' },
      { image: qrData, width: 150, alignment: 'center', margin: [0, 10, 0, 10] },

      { text: 'Imágenes del Evento:', style: 'sectionHeader' },
      ...eventImages.slice(0, 1)
    );

    if (i < payment.seats.length - 1) {
      content.push({ text: '', pageBreak: 'after' });
    }
  }

  const docDefinition = {
    pageSize: 'A4',
    content,
    styles: {
      header: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
      sectionHeader: { fontSize: 18, bold: true, margin: [0, 20, 0, 10] }
    },
    defaultStyle: { font: 'Roboto' }
  };

  return printer.createPdfKitDocument(docDefinition);
};
