import { supabase } from '../../supabaseClient';

// Configuración de impresora Boca
export class BocaPrinterService {
  constructor() {
    this.printer = null;
    this.isConnected = false;
  }

  // Detectar impresoras disponibles
  async detectPrinters() {
    try {
      if (navigator.usb) {
        const devices = await navigator.usb.getDevices();
        return devices.filter(device => 
          device.vendorId === 0x0483 || // Boca Systems
          device.manufacturerName?.includes('Boca') ||
          device.productName?.includes('Boca')
        );
      }
      return [];
    } catch (error) {
      console.error('Error detecting printers:', error);
      return [];
    }
  }

  // Conectar a impresora específica
  async connectToPrinter(device) {
    try {
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      this.printer = device;
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      return false;
    }
  }

  // Desconectar impresora
  disconnectPrinter() {
    if (this.printer) {
      this.printer.close();
      this.printer = null;
      this.isConnected = false;
    }
  }

  // Enviar comando a la impresora
  async sendCommand(command) {
    if (!this.isConnected || !this.printer) {
      throw new Error('Printer not connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      await this.printer.transferOut(1, data);
      return true;
    } catch (error) {
      console.error('Error sending command to printer:', error);
      return false;
    }
  }

  // Imprimir ticket
  async printTicket(ticketData, formatConfig) {
    if (!this.isConnected) {
      throw new Error('Printer not connected');
    }

    try {
      const commands = this.generatePrintCommands(ticketData, formatConfig);
      
      for (const command of commands) {
        await this.sendCommand(command);
        // Pequeña pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return true;
    } catch (error) {
      console.error('Error printing ticket:', error);
      return false;
    }
  }

  // Generar comandos de impresión
  generatePrintCommands(ticketData, formatConfig) {
    const commands = [];
    
    // Comando de inicio
    commands.push('\x1B\x40'); // Initialize printer
    
    // Configurar formato
    commands.push(`\x1B\x61${formatConfig.alignment || '1'}`); // Alignment
    commands.push(`\x1B\x21${formatConfig.fontSize || '00'}`); // Font size
    
    // Imprimir encabezado
    if (formatConfig.header) {
      commands.push(`${formatConfig.header}\n`);
    }
    
    // Imprimir datos del ticket
    commands.push(`Evento: ${ticketData.eventName}\n`);
    commands.push(`Fecha: ${ticketData.eventDate}\n`);
    commands.push(`Hora: ${ticketData.eventTime}\n`);
    commands.push(`Asiento: ${ticketData.seatNumber}\n`);
    commands.push(`Zona: ${ticketData.zoneName}\n`);
    commands.push(`Precio: $${ticketData.price}\n`);
    commands.push(`Ticket #: ${ticketData.ticketNumber}\n`);
    
    // Imprimir código QR o código de barras
    if (ticketData.qrCode) {
      commands.push(`\x1D\x6B\x04${ticketData.qrCode}\x00`); // QR Code
    }
    
    // Imprimir pie de página
    if (formatConfig.footer) {
      commands.push(`${formatConfig.footer}\n`);
    }
    
    // Cortar papel
    commands.push('\x1D\x56\x00');
    
    return commands;
  }

  // Probar conexión
  async testConnection() {
    try {
      await this.sendCommand('\x1B\x40'); // Initialize command
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obtener estado de la impresora
  async getPrinterStatus() {
    try {
      await this.sendCommand('\x1B\x76'); // Status request
      return {
        connected: this.isConnected,
        ready: true,
        paperStatus: 'OK'
      };
    } catch (error) {
      return {
        connected: this.isConnected,
        ready: false,
        paperStatus: 'ERROR'
      };
    }
  }
}

// Configuración de formatos de impresión
export const DEFAULT_FORMAT_CONFIG = {
  paperWidth: 80, // mm
  paperHeight: 297, // mm
  marginTop: 5, // mm
  marginBottom: 5, // mm
  marginLeft: 5, // mm
  marginRight: 5, // mm
  fontSize: '00', // 00=normal, 01=double height, 02=double width, 03=double size
  alignment: '1', // 0=left, 1=center, 2=right
  header: 'BOLETERÍA SISTEMA\n',
  footer: 'Gracias por su compra\n',
  showQRCode: true,
  showBarcode: false,
  logo: null
};

// Plantilla predefinida para impresora Boca
export const BOCA_DEFAULT_TEMPLATE = {
  paperWidth: 80, // mm - Ancho estándar para Boca
  paperHeight: 297, // mm - Alto estándar A4
  marginTop: 3, // mm - Margen superior mínimo
  marginBottom: 3, // mm - Margen inferior mínimo
  marginLeft: 2, // mm - Margen izquierdo mínimo
  marginRight: 2, // mm - Margen derecho mínimo
  fontSize: '00', // Normal - Boca maneja mejor fuentes normales
  alignment: '1', // Centro - Mejor presentación
  header: `╔══════════════════════════════════════════════════════════════╗
║                    BOLETERÍA SISTEMA                    ║
║                                                          ║
║  🎭 EVENTOS Y ESPECTÁCULOS                             ║
║  📞 Tel: (555) 123-4567                                ║
║  📧 info@boleteria.com                                 ║
║  🌐 www.boleteria.com                                  ║
╚══════════════════════════════════════════════════════════════╝`,
  footer: `╔══════════════════════════════════════════════════════════════╗
║                                                          ║
║  ✅ TICKET VÁLIDO                                      ║
║  📅 Fecha de impresión: ${new Date().toLocaleDateString()}        ║
║  🕒 Hora: ${new Date().toLocaleTimeString()}                        ║
║                                                          ║
║  ⚠️  IMPORTANTE:                                       ║
║  • Lleve este ticket al evento                         ║
║  • No se permiten devoluciones                         ║
║  • Gracias por su compra                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════════╝`,
  showQRCode: true,
  showBarcode: false,
  logo: null,
  // Configuraciones específicas para Boca
  bocaSettings: {
    printDensity: 'normal', // normal, light, dark
    printSpeed: 'normal', // slow, normal, fast
    cutMode: 'full', // full, partial, none
    paperType: 'thermal', // thermal, normal
    characterSet: 'latin1', // latin1, latin2, etc.
    autoFeed: true,
    autoCut: true
  }
};

// Plantilla para eventos pequeños (58mm)
export const BOCA_SMALL_TEMPLATE = {
  paperWidth: 58, // mm - Boca pequeña
  paperHeight: 200, // mm - Más corto
  marginTop: 2,
  marginBottom: 2,
  marginLeft: 1,
  marginRight: 1,
  fontSize: '00',
  alignment: '1',
  header: `┌────────────────────────────────────────┐
│           BOLETERÍA SISTEMA           │
│                                        │
│  🎭 EVENTOS Y ESPECTÁCULOS            │
│  📞 (555) 123-4567                    │
└────────────────────────────────────────┘`,
  footer: `┌────────────────────────────────────────┐
│                                        │
│  ✅ TICKET VÁLIDO                     │
│  📅 ${new Date().toLocaleDateString()}                    │
│  🕒 ${new Date().toLocaleTimeString()}                        │
│                                        │
│  ⚠️  IMPORTANTE:                      │
│  • Lleve este ticket al evento        │
│  • No se permiten devoluciones        │
│  • Gracias por su compra              │
│                                        │
└────────────────────────────────────────┘`,
  showQRCode: true,
  showBarcode: false,
  logo: null,
  bocaSettings: {
    printDensity: 'normal',
    printSpeed: 'normal',
    cutMode: 'full',
    paperType: 'thermal',
    characterSet: 'latin1',
    autoFeed: true,
    autoCut: true
  }
};

// Plantilla para eventos premium (112mm)
export const BOCA_PREMIUM_TEMPLATE = {
  paperWidth: 112, // mm - Boca ancha
  paperHeight: 297, // mm - A4 completo
  marginTop: 5,
  marginBottom: 5,
  marginLeft: 3,
  marginRight: 3,
  fontSize: '01', // Doble alto para mejor legibilidad
  alignment: '1',
  header: `╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                              ║
║                                    🎭 BOLETERÍA SISTEMA 🎭                                    ║
║                                                                                                              ║
║                              EVENTOS Y ESPECTÁCULOS PREMIUM                                  ║
║                                                                                                              ║
║  📞 Teléfono: (555) 123-4567                    📧 Email: info@boleteria.com                ║
║  🌐 Sitio Web: www.boleteria.com                📍 Dirección: Calle Principal #123          ║
║                                                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝`,
  footer: `╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                              ║
║                                    ✅ TICKET VÁLIDO ✅                                      ║
║                                                                                                              ║
║  📅 Fecha de impresión: ${new Date().toLocaleDateString()}                    🕒 Hora: ${new Date().toLocaleTimeString()}                    ║
║                                                                                                              ║
║  ⚠️  INFORMACIÓN IMPORTANTE:                                                               ║
║  • Este ticket es su comprobante de compra                                                ║
║  • Llévelo consigo al evento                                                              ║
║  • No se permiten devoluciones ni cambios                                                 ║
║  • Gracias por elegir nuestros servicios                                                  ║
║                                                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝`,
  showQRCode: true,
  showBarcode: true,
  logo: null,
  bocaSettings: {
    printDensity: 'dark',
    printSpeed: 'slow',
    cutMode: 'full',
    paperType: 'thermal',
    characterSet: 'latin1',
    autoFeed: true,
    autoCut: true
  }
};

// Función para aplicar plantilla
export const applyBocaTemplate = async (templateName = 'default') => {
  try {
    let template;
    
    switch (templateName) {
      case 'small':
        template = BOCA_SMALL_TEMPLATE;
        break;
      case 'premium':
        template = BOCA_PREMIUM_TEMPLATE;
        break;
      default:
        template = BOCA_DEFAULT_TEMPLATE;
        break;
    }

    await saveFormatConfig(template);
    return template;
  } catch (error) {
    console.error('Error applying Boca template:', error);
    throw error;
  }
};

// Guardar configuración de formato
export const saveFormatConfig = async (config) => {
  try {
    // Obtener el tenant actual
    const { data: { user } } = await supabase.auth.getUser();
    let tenant_id = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        tenant_id = profile.tenant_id;
      }
    }

    const { data, error } = await supabase
      .from('printer_formats')
      .upsert({
        id: 1, // Solo una configuración global
        config: config,
        tenant_id: tenant_id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving format config:', error);
    throw error;
  }
};

// Obtener configuración de formato
export const getFormatConfig = async () => {
  try {
    // Obtener el tenant actual
    const { data: { user } } = await supabase.auth.getUser();
    let tenant_id = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        tenant_id = profile.tenant_id;
      }
    }

    let query = supabase
      .from('printer_formats')
      .select('config')
      .eq('id', 1);
    
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.config || DEFAULT_FORMAT_CONFIG;
  } catch (error) {
    console.error('Error getting format config:', error);
    return DEFAULT_FORMAT_CONFIG;
  }
};

// Instancia global del servicio
export const bocaPrinterService = new BocaPrinterService(); 
