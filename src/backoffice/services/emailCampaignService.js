import { supabase as supabaseClient } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import emailService from './emailService';

// Email Campaign Service
export const emailCampaignService = {
  // Obtener todas las campañas
  async getCampaigns() {
    try {
      const { data, error } = await supabaseClient
        .from('email_campaigns')
        .select(`
          *,
          events:eventos(id, nombre),
          channels:canales_venta(id, nombre, url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Error al cargar las campañas');
      return [];
    }
  },

  // Obtener una campaña específica
  async getCampaign(id) {
    try {
      const { data, error } = await supabaseClient
        .from('email_campaigns')
        .select(`
          *,
          events:eventos(id, nombre),
          channels:canales_venta(id, nombre, url),
          widgets:campaign_widgets(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Error al cargar la campaña');
      return null;
    }
  },

  // Crear nueva campaña
  async createCampaign(campaignData) {
    try {
      const { data, error } = await supabaseClient
        .from('email_campaigns')
        .insert([{
          nombre: campaignData.nombre,
          tipo: campaignData.tipo,
          estado: 'draft',
          configuracion: campaignData.configuracion || {},
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Campaña creada exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Error al crear la campaña');
      return null;
    }
  },

  // Actualizar campaña
  async updateCampaign(id, campaignData) {
    try {
      const { data, error } = await supabaseClient
        .from('email_campaigns')
        .update({
          nombre: campaignData.nombre,
          tipo: campaignData.tipo,
          configuracion: campaignData.configuracion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Campaña actualizada exitosamente');
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Error al actualizar la campaña');
      return null;
    }
  },

  // Eliminar campaña
  async deleteCampaign(id) {
    try {
      const { error } = await supabaseClient
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Campaña eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Error al eliminar la campaña');
      return false;
    }
  },

  // Guardar widgets de campaña
  async saveCampaignWidgets(campaignId, widgets) {
    try {
      // Eliminar widgets existentes
      await supabaseClient
        .from('campaign_widgets')
        .delete()
        .eq('campaign_id', campaignId);

      // Insertar nuevos widgets
      if (widgets.length > 0) {
        const widgetsData = widgets.map((widget, index) => ({
          campaign_id: campaignId,
          tipo: widget.type,
          configuracion: widget.config,
          orden: index
        }));

        const { error } = await supabaseClient
          .from('campaign_widgets')
          .insert(widgetsData);

        if (error) throw error;
      }

      toast.success('Widgets guardados exitosamente');
      return true;
    } catch (error) {
      console.error('Error saving widgets:', error);
      toast.error('Error al guardar los widgets');
      return false;
    }
  },

  // Obtener eventos disponibles
  async getEvents() {
    try {
      const { data, error } = await supabaseClient
        .from('eventos')
        .select('id, nombre, fecha_inicio, fecha_fin')
        .eq('activo', true)
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Obtener canales de venta
  async getChannels() {
    try {
      const { data, error } = await supabaseClient
        .from('canales_venta')
        .select('id, nombre, url, activo')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  },

  // Enviar campaña de email
  async sendCampaign(campaignId, recipients) {
    try {
      // Actualizar estado de la campaña
      await supabaseClient
        .from('email_campaigns')
        .update({
          estado: 'sending',
          fecha_envio: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Obtener datos de la campaña
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) throw new Error('Campaña no encontrada');

      // Generar HTML del email
      const emailHtml = await this.generateEmailHtml(campaign);

      // Enviar emails
      const sendResults = await this.sendEmails(recipients, campaign, emailHtml);

      // Actualizar estadísticas
      await this.updateCampaignStats(campaignId, sendResults);

      // Actualizar estado final
      await supabaseClient
        .from('email_campaigns')
        .update({
          estado: 'sent',
          total_enviados: sendResults.sent,
          total_fallidos: sendResults.failed
        })
        .eq('id', campaignId);

      toast.success(`Campaña enviada: ${sendResults.sent} emails enviados`);
      return sendResults;
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Error al enviar la campaña');
      
      // Actualizar estado a error
      await supabaseClient
        .from('email_campaigns')
        .update({ estado: 'error' })
        .eq('id', campaignId);

      return { sent: 0, failed: 0, error: error.message };
    }
  },

  // Generar HTML del email
  async generateEmailHtml(campaign) {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${campaign.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .widget { margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${campaign.nombre}</h1>
          </div>
    `;

    // Renderizar widgets
    if (campaign.widgets) {
      for (const widget of campaign.widgets) {
        html += this.renderWidgetHtml(widget);
      }
    }

    html += `
          <div class="footer">
            <p>© 2024 Kreatickets. Todos los derechos reservados.</p>
            <p><a href="{{unsubscribe_url}}">Cancelar suscripción</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  },

  // Renderizar HTML de widget
  renderWidgetHtml(widget) {
    const config = widget.configuracion || {};

    switch (widget.tipo) {
      case 'Título':
        return `<div class="widget"><h2 style="text-align: center; color: #333;">${config.texto || 'Título'}</h2></div>`;

      case 'Subtítulo':
        return `<div class="widget"><h3 style="text-align: center; color: #666;">${config.texto || 'Subtítulo'}</h3></div>`;

      case 'Paragraph':
        return `<div class="widget"><p>${config.texto || 'Contenido del párrafo...'}</p></div>`;

      case 'Banner':
        return `
          <div class="widget">
            ${config.imagen ? `<img src="${config.imagen}" alt="Banner" style="max-width: 100%; height: auto; border-radius: 8px;">` : ''}
            ${config.texto ? `<p style="text-align: center; margin-top: 8px;">${config.texto}</p>` : ''}
          </div>
        `;

      case 'Botón':
        const buttonText = config.textButton || 'Hacer clic';
        const buttonUrl = this.getButtonUrl(config);
        return `
          <div class="widget" style="text-align: center;">
            <a href="${buttonUrl}" class="button" style="margin-top: ${config.margin_top || 10}px; margin-bottom: ${config.margin_bottom || 10}px;">
              ${buttonText}
            </a>
          </div>
        `;

      case 'Información del evento':
        return `
          <div class="widget" style="background-color: #f8f9fa; padding: 16px; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Información del Evento</h4>
            <p style="margin: 0; color: #666; font-size: 14px;">ID del evento: ${config.eventoId || 'No especificado'}</p>
          </div>
        `;

      case 'Código HTML':
        return `<div class="widget">${config.html || '<div>Contenido HTML personalizado</div>'}</div>`;

      default:
        return `<div class="widget"><p>Widget no reconocido: ${widget.tipo}</p></div>`;
    }
  },

  // Obtener URL del botón
  getButtonUrl(config) {
    if (config.urlButton) return config.urlButton;

    // Construir URL basada en evento y canal
    if (config.eventId && config.channelId) {
      const baseUrl = this.getChannelUrl(config.channelId);
      return `${baseUrl}evento/${config.eventId}`;
    }

    return '#';
  },

  // Obtener URL del canal
  getChannelUrl(channelId) {
    const channels = {
      '8': 'https://kreatickets.pagatusboletos.com/tickets/',
      '2': 'https://ventas.kreatickets.com/venta/',
      '999': 'https://ventas.kreatickets.com/test/'
    };
    return channels[channelId] || 'https://ventas.kreatickets.com/venta/';
  },

  // Enviar emails
  async sendEmails(recipients, campaign, emailHtml) {
    try {
      // Usar el servicio de email real
      const results = await emailService.sendCampaign(recipients, campaign, emailHtml);
      return results;
    } catch (error) {
      console.error('Error sending emails:', error);
      return { sent: 0, failed: recipients.length, errors: [error.message] };
    }
  },

  // Personalizar email
  personalizeEmail(html, recipient) {
    return html
      .replace(/\{\{nombre\}\}/g, recipient.nombre || 'Usuario')
      .replace(/\{\{email\}\}/g, recipient.email)
      .replace(/\{\{unsubscribe_url\}\}/g, `https://kreatickets.com/unsubscribe?email=${recipient.email}`);
  },

  // Enviar email individual usando el servicio de email
  async sendEmail(to, subject, html) {
    try {
      return await emailService.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending individual email:', error);
      throw error;
    }
  },

  // Actualizar estadísticas de campaña
  async updateCampaignStats(campaignId, stats) {
    try {
      await supabaseClient
        .from('email_campaigns')
        .update({
          total_enviados: stats.sent,
          total_fallidos: stats.failed,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', campaignId);
    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  },

  // Obtener estadísticas de campaña
  async getCampaignStats(campaignId) {
    try {
      const { data, error } = await supabaseClient
        .from('email_campaigns')
        .select('total_enviados, total_fallidos, fecha_envio, fecha_actualizacion')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      return null;
    }
  },

  // Enviar email de prueba
  async sendTestEmail(campaignId, testEmail) {
    try {
      // Obtener datos de la campaña
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) throw new Error('Campaña no encontrada');

      // Generar HTML del email
      const emailHtml = await this.generateEmailHtml(campaign);

      // Enviar email de prueba
      const emailServiceInstance = new emailService();
      await emailServiceInstance.sendEmail(
        testEmail,
        `[PRUEBA] ${campaign.nombre}`,
        emailHtml
      );

      toast.success('Email de prueba enviado exitosamente');
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error al enviar email de prueba');
      return false;
    }
  },

  // Lanzar campaña
  async launchCampaign(campaignId) {
    try {
      // Obtener destinatarios de la campaña
      const { data: recipients, error } = await supabaseClient
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      if (!recipients || recipients.length === 0) {
        toast.error('No hay destinatarios para esta campaña');
        return false;
      }

      // Enviar la campaña
      const result = await this.sendCampaign(campaignId, recipients);
      return result.sent > 0;
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error('Error al lanzar la campaña');
      return false;
    }
  },

  // Guardar campaña
  async saveCampaign(campaignId, campaignData) {
    try {
      const result = await this.updateCampaign(campaignId, campaignData);
      return result !== null;
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Error al guardar la campaña');
      return false;
    }
  }
};

export default emailCampaignService; 