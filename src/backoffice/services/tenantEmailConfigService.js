import { supabase } from '../../supabaseClient';

export class TenantEmailConfigService {
  static isMissingTenantEmailTable(error) {
    if (!error) return false;

    const normalizedMessage = (error.message || '').toLowerCase();
    return (
      ['pgrst116', 'pgrst301', '42p01'].includes((error.code || '').toLowerCase()) ||
      normalizedMessage.includes('does not exist') ||
      normalizedMessage.includes('not found')
    );
  }

  // Obtener configuración de correo del tenant actual
  static async getTenantEmailConfig(tenantId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Si no se proporciona tenantId, obtenerlo del contexto actual
      let currentTenantId = tenantId;
      if (!currentTenantId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        currentTenantId = profile?.tenant_id;
      }

      if (!currentTenantId) {
        throw new Error('No se pudo determinar el tenant');
      }

      const { data, error } = await supabase
        .from('tenant_email_config')
        .select('*')
        .eq('tenant_id', currentTenantId)
        .maybeSingle();

      if (error) {
        if (this.isMissingTenantEmailTable(error)) {
          return await this.getGlobalEmailConfig();
        }
        if (error.code === 'PGRST116') {
          return await this.getGlobalEmailConfig();
        }
        throw error;
      }

      if (!data) {
        return await this.getGlobalEmailConfig();
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo configuración de correo del tenant:', error);
      throw error;
    }
  }

  // Obtener configuración global del SaaS
  static async getGlobalEmailConfig() {
    try {
      const { data, error } = await supabase
        .from('global_email_config')
        .select('*')
        .maybeSingle();

      if (error) {
        if (this.isMissingTenantEmailTable(error)) {
          return this.getDefaultEmailConfig();
        }
        if (error.code === 'PGRST116') {
          // No hay configuración global, retornar configuración por defecto
          return this.getDefaultEmailConfig();
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo configuración global de correo:', error);
      return this.getDefaultEmailConfig();
    }
  }

  // Configuración por defecto usando los datos de omegaboletos.com
  static getDefaultEmailConfig() {
    return {
      id: 'default',
      tenant_id: null,
      provider: 'smtp',
      smtp_host: 'mail.omegaboletos.com',
      smtp_port: 465,
      smtp_secure: true,
      smtp_user: 'reportes@omegaboletos.com',
      smtp_pass: '', // Se debe configurar
      from_email: 'reportes@omegaboletos.com',
      from_name: 'Omega Boletos',
      reply_to: 'reportes@omegaboletos.com',
      is_global: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Guardar configuración de correo del tenant
  static async saveTenantEmailConfig(config, tenantId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Si no se proporciona tenantId, obtenerlo del contexto actual
      let currentTenantId = tenantId;
      if (!currentTenantId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        currentTenantId = profile?.tenant_id;
      }

      if (!currentTenantId) {
        throw new Error('No se pudo determinar el tenant');
      }

      // Preparar datos para guardar
      const configData = {
        tenant_id: currentTenantId,
        provider: config.provider || 'smtp',
        smtp_host: config.smtp_host,
        smtp_port: parseInt(config.smtp_port),
        smtp_secure: config.smtp_secure === true || config.smtp_secure === 'true',
        smtp_user: config.smtp_user,
        smtp_pass: config.smtp_pass,
        from_email: config.from_email,
        from_name: config.from_name,
        reply_to: config.reply_to || config.from_email,
        is_active: config.is_active !== false,
        updated_at: new Date().toISOString()
      };

      // Verificar si ya existe configuración
      const { data: existing, error: existingError } = await supabase
        .from('tenant_email_config')
        .select('id')
        .eq('tenant_id', currentTenantId)
        .maybeSingle();

      if (existingError) {
        if (this.isMissingTenantEmailTable(existingError)) {
          throw new Error('La tabla tenant_email_config no existe en la base de datos. Ejecuta la migración correspondiente para habilitar la configuración de correo por tenant.');
        }
        throw existingError;
      }

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('tenant_email_config')
          .update(configData)
          .eq('tenant_id', currentTenantId)
          .select()
          .single();

        if (error) {
          if (this.isMissingTenantEmailTable(error)) {
            throw new Error('No fue posible actualizar la configuración porque la tabla tenant_email_config no existe.');
          }
          throw error;
        }
        result = data;
      } else {
        configData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('tenant_email_config')
          .insert(configData)
          .select()
          .single();

        if (error) {
          if (this.isMissingTenantEmailTable(error)) {
            throw new Error('No fue posible guardar la configuración porque la tabla tenant_email_config no existe.');
          }
          throw error;
        }
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error guardando configuración de correo del tenant:', error);
      throw error;
    }
  }

  // Guardar configuración global del SaaS
  static async saveGlobalEmailConfig(config) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar permisos de administrador global
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'super_admin') {
        throw new Error('No tienes permisos para modificar la configuración global');
      }

      // Preparar datos para guardar
      const configData = {
        provider: config.provider || 'smtp',
        smtp_host: config.smtp_host,
        smtp_port: parseInt(config.smtp_port),
        smtp_secure: config.smtp_secure === true || config.smtp_secure === 'true',
        smtp_user: config.smtp_user,
        smtp_pass: config.smtp_pass,
        from_email: config.from_email,
        from_name: config.from_name,
        reply_to: config.reply_to || config.from_email,
        is_active: config.is_active !== false,
        updated_at: new Date().toISOString()
      };

      // Verificar si ya existe configuración global
      const { data: existing, error: existingError } = await supabase
        .from('global_email_config')
        .select('id')
        .maybeSingle();

      if (existingError) {
        if (this.isMissingTenantEmailTable(existingError)) {
          throw new Error('La tabla global_email_config no existe en la base de datos.');
        }
        throw existingError;
      }

      let result;
      if (existing) {
        // Actualizar configuración existente
        const { data, error } = await supabase
          .from('global_email_config')
          .update(configData)
          .select()
          .single();

        if (error) {
          if (this.isMissingTenantEmailTable(error)) {
            throw new Error('La tabla global_email_config no existe en la base de datos.');
          }
          throw error;
        }
        result = data;
      } else {
        // Crear nueva configuración
        configData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('global_email_config')
          .insert(configData)
          .select()
          .single();

        if (error) {
          if (this.isMissingTenantEmailTable(error)) {
            throw new Error('La tabla global_email_config no existe en la base de datos.');
          }
          throw error;
        }
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error guardando configuración global de correo:', error);
      throw error;
    }
  }

  static async executeEmailTest(config, { to, subject, html } = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const emailToTest = to || user.email;

      if (!emailToTest) {
        throw new Error('No se proporcionó un correo de destino para la prueba');
      }

      const response = await fetch('/api/test-email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            host: config.smtp_host,
            port: parseInt(config.smtp_port),
            secure: config.smtp_secure === true || config.smtp_secure === 'true',
            auth: {
              user: config.smtp_user,
              pass: config.smtp_pass
            }
          },
          from: config.from_email || config.smtp_user,
          to: emailToTest,
          subject: subject || 'Prueba de Configuración de Correo',
          html: html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1890ff;">✅ Configuración de Correo Exitosa</h2>
              <p>Este es un correo de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
              <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Detalles de la configuración:</h3>
                <ul>
                  <li><strong>Servidor:</strong> ${config.smtp_host}</li>
                  <li><strong>Puerto:</strong> ${config.smtp_port}</li>
                  <li><strong>Seguro:</strong> ${config.smtp_secure ? 'Sí' : 'No'}</li>
                  <li><strong>Usuario:</strong> ${config.smtp_user}</li>
                  <li><strong>Desde:</strong> ${config.from_email || config.smtp_user}</li>
                </ul>
              </div>
              <p style="color: #666; font-size: 12px;">
                Enviado el ${new Date().toLocaleString()} desde el sistema de gestión de eventos.
              </p>
            </div>
          `
        })
      });

      if (!response.ok) {
        let errorData = null;
        let rawBody = null;

        try {
          errorData = await response.clone().json();
        } catch (jsonError) {
          try {
            rawBody = await response.text();
          } catch (textError) {
            rawBody = null;
          }
        }

        if (!errorData && rawBody) {
          errorData = { message: rawBody };
        }

        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          `Error probando configuración de correo (HTTP ${response.status})`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        error.raw = rawBody;

        if (errorData?.diagnostics) {
          error.diagnostics = errorData.diagnostics;
        } else if (errorData?.debug) {
          error.diagnostics = { steps: errorData.debug };
        }

        throw error;
      }

      const result = await response.json().catch(async (parseError) => {
        const fallbackText = await response.text().catch(() => null);
        const error = new Error('Respuesta inválida del servidor de pruebas SMTP');
        error.details = { parseError: parseError?.message, raw: fallbackText };
        throw error;
      });

      return result;
    } catch (error) {
      console.error('Error probando configuración de correo:', error);
      throw error;
    }
  }

  // Probar configuración de correo
  static async testEmailConfig(config, testEmail = null) {
    return this.executeEmailTest(config, { to: testEmail });
  }

  static async sendInboundTestEmail(config) {
    return this.executeEmailTest(config, {
      to: 'email@omegaboletos.com',
      subject: 'Prueba de entrada - Omega Boletos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #722ed1;">📥 Prueba de correo entrante</h2>
          <p>Este mensaje confirma que el servidor SMTP puede enviar correos hacia <strong>email@omegaboletos.com</strong>.</p>
          <p>Si estás viendo este mensaje en la bandeja de entrada, la prueba fue exitosa.</p>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            Enviado automáticamente el ${new Date().toLocaleString()} desde la consola de configuración de Omega Boletos.
          </div>
        </div>
      `
    });
  }

  static async sendWelcomeEmail(config, targetEmail) {
    return this.executeEmailTest(config, {
      to: targetEmail,
      subject: 'Bienvenido a Omega Boletos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #52c41a;">🎉 ¡Bienvenido!</h2>
          <p>Te damos la bienvenida a <strong>Omega Boletos</strong>. Este correo confirma que la configuración de envío está funcionando correctamente.</p>
          <p>Muy pronto recibirás toda la información necesaria para comenzar a operar tus eventos con nosotros.</p>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            Enviado el ${new Date().toLocaleString()} desde ${config.from_name || 'Omega Boletos'} (${config.from_email || config.smtp_user}).
          </div>
        </div>
      `
    });
  }

  // Obtener proveedores de correo comunes
  static getCommonEmailProviders() {
    return [
      {
        name: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        notes: 'Requiere contraseña de aplicación'
      },
      {
        name: 'Outlook/Hotmail',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        notes: 'Requiere autenticación de dos factores'
      },
      {
        name: 'Yahoo',
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        notes: 'Requiere contraseña de aplicación'
      },
      {
        name: 'Omega Boletos (Personalizado)',
        host: 'mail.omegaboletos.com',
        port: 465,
        secure: true,
        notes: 'Configuración personalizada del hosting'
      },
      {
        name: 'Personalizado',
        host: '',
        port: 587,
        secure: false,
        notes: 'Configuración manual'
      }
    ];
  }

  // Obtener configuración activa (tenant o global)
  static async getActiveEmailConfig(tenantId = null) {
    try {
      // Primero intentar obtener configuración del tenant
      const tenantConfig = await this.getTenantEmailConfig(tenantId);

      // Si el tenant tiene configuración específica y está activa, usarla
      if (tenantConfig && !tenantConfig.is_global && tenantConfig.is_active) {
        return tenantConfig;
      }

      // Si no, usar configuración global
      return await this.getGlobalEmailConfig();
    } catch (error) {
      console.error('Error obteniendo configuración activa de correo:', error);
      return this.getDefaultEmailConfig();
    }
  }
}
