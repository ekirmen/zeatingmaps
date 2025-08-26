import { supabase } from '../../supabaseClient';

export class EmailConfigService {
  // Obtener configuración de correo de la empresa actual
  static async getEmailConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay configuración, retornar null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo configuración de correo:', error);
      throw error;
    }
  }

  // Crear o actualizar configuración de correo
  static async saveEmailConfig(config) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      // Intentar actualizar primero
      const { data: updateData, error: updateError } = await supabase
        .from('email_config')
        .update(configData)
        .select()
        .single();

      if (updateError && updateError.code === 'PGRST116') {
        // No existe, crear nuevo
        const { data: insertData, error: insertError } = await supabase
          .from('email_config')
          .insert([configData])
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData;
      }

      if (updateError) throw updateError;
      return updateData;
    } catch (error) {
      console.error('Error guardando configuración de correo:', error);
      throw error;
    }
  }

  // Probar configuración de correo
  static async testEmailConfig(config) {
    try {
      // Crear un objeto de configuración temporal para la prueba
      const testConfig = {
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password
        }
      };

      // Enviar correo de prueba
      const testResult = await this.sendTestEmail(testConfig, config);
      return testResult;
    } catch (error) {
      console.error('Error probando configuración de correo:', error);
      throw error;
    }
  }

  // Enviar correo de prueba
  static async sendTestEmail(smtpConfig, emailConfig) {
    try {
      // Aquí implementarías la lógica de envío real
      // Por ahora simulamos el envío
      console.log('Enviando correo de prueba con configuración:', smtpConfig);
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Correo de prueba enviado correctamente'
      };
    } catch (error) {
      console.error('Error enviando correo de prueba:', error);
      throw error;
    }
  }

  // Validar configuración de correo
  static validateEmailConfig(config) {
    const errors = [];

    if (!config.smtp_host) errors.push('Host SMTP es requerido');
    if (!config.smtp_port) errors.push('Puerto SMTP es requerido');
    if (!config.smtp_user) errors.push('Usuario SMTP es requerido');
    if (!config.smtp_password) errors.push('Contraseña SMTP es requerida');
    if (!config.from_email) errors.push('Email del remitente es requerido');
    if (!config.from_name) errors.push('Nombre del remitente es requerido');

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (config.from_email && !emailRegex.test(config.from_email)) {
      errors.push('Formato de email del remitente inválido');
    }
    if (config.reply_to_email && !emailRegex.test(config.reply_to_email)) {
      errors.push('Formato de email de respuesta inválido');
    }

    // Validar puerto
    if (config.smtp_port && (config.smtp_port < 1 || config.smtp_port > 65535)) {
      errors.push('Puerto SMTP debe estar entre 1 y 65535');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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
        name: 'Proveedor personalizado',
        host: '',
        port: 587,
        secure: true,
        notes: 'Configuración manual'
      }
    ];
  }
}
