import { supabase } from '../../src/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { items, evento, funcion } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay items para validar'
      });
    }

    const validationResults = [];
    let totalPrice = 0;
    let totalQuantity = 0;

    for (const item of items) {
      // Validar que la zona existe
      const { data: zona, error: zonaError } = await supabase
        .from('zonas')
        .select('*')
        .eq('id', item.zona_id)
        .single();

      if (zonaError || !zona) {
        validationResults.push({
          item_id: item.id,
          valid: false,
          error: 'Zona no encontrada'
        });
        continue;
      }

      // Validar aforo disponible
      if (zona.aforo && item.cantidad > zona.aforo) {
        validationResults.push({
          item_id: item.id,
          valid: false,
          error: `Cantidad excede el aforo disponible (${zona.aforo})`
        });
        continue;
      }

      // Validar precio
      if (!item.precio || item.precio <= 0) {
        validationResults.push({
          item_id: item.id,
          valid: false,
          error: 'Precio inválido'
        });
        continue;
      }

      // Item válido
      validationResults.push({
        item_id: item.id,
        valid: true,
        zona_nombre: zona.nombre,
        precio_unitario: item.precio,
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad
      });

      totalPrice += item.precio * item.cantidad;
      totalQuantity += item.cantidad;
    }

    const allValid = validationResults.every(result => result.valid);

    res.status(200).json({
      success: allValid,
      data: {
        validation_results: validationResults,
        summary: {
          total_items: items.length,
          valid_items: validationResults.filter(r => r.valid).length,
          total_quantity: totalQuantity,
          total_price: totalPrice
        }
      },
      message: allValid ? 'Validación exitosa' : 'Algunos items tienen errores'
    });

  } catch (error) {
    console.error('Error validando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar la venta',
      error: error.message
    });
  }
}
