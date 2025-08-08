import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { apiKey, listId, customerData, doubleOptIn, tags } = await request.json();

    if (!apiKey || !listId || !customerData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Datos requeridos faltantes' 
      });
    }

    // Extraer el datacenter del API key
    const datacenter = apiKey.split('-').pop();
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;

    // Preparar datos para MailChimp
    const subscriberData = {
      email_address: customerData.email,
      status: doubleOptIn ? 'pending' : 'subscribed',
      merge_fields: {
        FNAME: customerData.firstName || '',
        LNAME: customerData.lastName || '',
        PHONE: customerData.phone || '',
        COMPANY: customerData.company || '',
        ADDRESS: customerData.address || ''
      },
      tags: tags || []
    };

    // Agregar campos personalizados si existen
    if (customerData.customFields) {
      Object.keys(customerData.customFields).forEach(key => {
        subscriberData.merge_fields[key.toUpperCase()] = customerData.customFields[key];
      });
    }

    // Suscribir a MailChimp
    const response = await fetch(`${baseUrl}/lists/${listId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriberData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Si el email ya existe, intentar actualizar
      if (result.title === 'Member Exists') {
        const updateResponse = await fetch(`${baseUrl}/lists/${listId}/members/${encodeURIComponent(customerData.email)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            merge_fields: subscriberData.merge_fields,
            tags: subscriberData.tags
          })
        });

        if (updateResponse.ok) {
          return NextResponse.json({
            success: true,
            message: 'Cliente actualizado en MailChimp'
          });
        }
      }

      throw new Error(result.detail || 'Error al suscribir');
    }

    return NextResponse.json({
      success: true,
      message: doubleOptIn ? 'Cliente suscrito (pendiente de confirmación)' : 'Cliente suscrito exitosamente'
    });

  } catch (error) {
    console.error('MailChimp subscribe error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error al suscribir cliente' 
    });
  }
}
