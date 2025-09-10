import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { items, evento, funcion, cliente, paymentData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay items para procesar'
      });
    }

    // Validar datos requeridos
    if (!evento?.id || !funcion?.id) {
      return res.status(400).json({
        success: false,
        message: 'Evento y función son requeridos'
      });
    }

    if (!cliente?.id) {
      return res.status(400).json({
        success: false,
        message: 'Cliente es requerido'
      });
    }

    // Calcular totales
    const totalPrice = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.cantidad, 0);

    // Crear transacción de venta
    const ventaData = {
      evento_id: evento.id,
      funcion_id: funcion.id,
      cliente_id: cliente.id,
      total_precio: totalPrice,
      total_cantidad: totalQuantity,
      tipo_venta: 'grid',
      estado: 'completada',
      fecha_venta: new Date().toISOString(),
      payment_data: paymentData || {}
    };

    // Insertar venta
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert([ventaData])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Crear entradas para cada item
    const entradasData = [];
    for (const item of items) {
      for (let i = 0; i < item.cantidad; i++) {
        entradasData.push({
          venta_id: venta.id,
          zona_id: item.zona_id,
          funcion_id: funcion.id,
          precio: item.precio,
          tipo: 'grid',
          estado: 'vendida',
          codigo_entrada: generateTicketCode(),
          fecha_creacion: new Date().toISOString()
        });
      }
    }

    // Insertar entradas
    const { data: entradas, error: entradasError } = await supabase
      .from('entradas')
      .insert(entradasData)
      .select();

    if (entradasError) throw entradasError;

    // Actualizar aforo de zonas (opcional)
    for (const item of items) {
      await supabase
        .from('zonas')
        .update({ 
          aforo: supabase.raw(`aforo - ${item.cantidad}`) 
        })
        .eq('id', item.zona_id);
    }

    res.status(200).json({
      success: true,
      data: {
        venta: venta,
        entradas: entradas,
        total_price: totalPrice,
        total_quantity: totalQuantity
      },
      message: 'Venta procesada exitosamente'
    });

  } catch (error) {
    console.error('Error procesando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la venta',
      error: error.message
    });
  }
}

// Función para generar código de entrada
function generateTicketCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TKT-${timestamp}-${random}`.toUpperCase();
}
