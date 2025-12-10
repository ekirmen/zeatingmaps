import { supabase } from '../../supabaseClient';

class ScheduledReportsService {
  // Get all scheduled reports for a tenant
  async getScheduledReports(tenantId) {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select(`
          *,
          evento:eventos(nombre, fecha_evento),
          executions:scheduled_report_executions(
            id, 
            fecha_ejecucion, 
            estado, 
            error_message,
            email_enviado_a,
            archivo_generado
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return { data: null, error };
    }
  }

  // Create a new scheduled report
  async createScheduledReport(reportData) {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      return { data: null, error };
    }
  }

  // Update a scheduled report
  async updateScheduledReport(id, reportData) {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(reportData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      return { data: null, error };
    }
  }

  // Delete a scheduled report
  async deleteScheduledReport(id) {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      return { error };
    }
  }

  // Toggle active status
  async toggleActiveStatus(id, active) {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update({ activo: active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error toggling active status:', error);
      return { data: null, error };
    }
  }

  // Get report executions
  async getReportExecutions(scheduledReportId) {
    try {
      const { data, error } = await supabase
        .from('scheduled_report_executions')
        .select('*')
        .eq('scheduled_report_id', scheduledReportId)
        .order('fecha_ejecucion', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching report executions:', error);
      return { data: null, error };
    }
  }

  // Create a report execution record
  async createReportExecution(executionData) {
    try {
      const { data, error } = await supabase
        .from('scheduled_report_executions')
        .insert(executionData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating report execution:', error);
      return { data: null, error };
    }
  }

  // Update report execution status
  async updateReportExecutionStatus(id, status, errorMessage = null) {
    try {
      const updateData = { estado: status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { data, error } = await supabase
        .from('scheduled_report_executions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating report execution status:', error);
      return { data: null, error };
    }
  }

  // Get report templates
  async getReportTemplates(tenantId) {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching report templates:', error);
      return { data: null, error };
    }
  }

  // Create a report template
  async createReportTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating report template:', error);
      return { data: null, error };
    }
  }

  // Generate report data based on type and filters
  async generateReportData(reportType, filters = {}) {
    try {
      let query;
      
      switch (reportType) {
        case 'sales':
          query = supabase
            .from('payment_transactions')
            .select(`
              *,
              user:profiles!user_id(*),
              event:eventos(*)
            `)
            .eq('status', 'pagado');
          break;
          
        case 'events':
          query = supabase
            .from('eventos')
            .select(`
              *,
              funciones(*),
              entradas(*)
            `);
          break;
          
        case 'users':
          query = supabase
            .from('profiles')
            .select('*');
          break;
          
        case 'payments':
          query = supabase
            .from('payment_transactions')
            .select(`
              *,
              user:profiles!user_id(*),
              event:eventos(*)
            `);
          break;
          
        case 'products':
          query = supabase
            .from('productos')
            .select('*');
          break;
          
        case 'promociones':
          query = supabase
            .from('promociones')
            .select('*');
          break;
          
        case 'carritos':
          query = supabase
            .from('saved_carts')
            .select('*');
          break;
          
        default:
          throw new Error(`Tipo de reporte no soportado: ${reportType}`);
      }

      // Apply filters
      if (filters.dateRange) {
        const startDate = filters.dateRange[0];
        const endDate = filters.dateRange[1];
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      if (filters.evento_id) {
        query = query.eq('evento_id', filters.evento_id);
      }

      if (filters.status && reportType === 'payments') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error generating report data:', error);
      return { data: null, error };
    }
  }

  // Get events for dropdown
  async getEvents(tenantId) {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre, fecha_evento')
        .eq('tenant_id', tenantId)
        .order('fecha_evento', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { data: null, error };
    }
  }

  // Validate email list
  validateEmailList(emailString) {
    const emails = emailString.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const validEmails = [];
    const invalidEmails = [];
    
    emails.forEach(email => {
      if (emailRegex.test(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });
    
    return {
      valid: validEmails,
      invalid: invalidEmails,
      isValid: invalidEmails.length === 0
    };
  }

  // Calculate next execution time
  calculateNextExecution(scheduledReport) {
    const now = new Date();
    const { periodicidad, hora_ejecucion, dias_semana, dia_mes } = scheduledReport;
    
    const [hours, minutes] = hora_ejecucion.split(':').map(Number);
    
    let nextExecution = new Date();
    nextExecution.setHours(hours, minutes, 0, 0);
    
    switch (periodicidad) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;
        
      case 'weekly':
        if (dias_semana && dias_semana.length > 0) {
          // Find next occurrence of any selected day
          const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const nextDays = dias_semana
            .map(day => day === 7 ? 0 : day) // Convert Sunday from 7 to 0
            .filter(day => day >= today)
            .sort((a, b) => a - b);
          
          if (nextDays.length > 0) {
            const daysUntilNext = nextDays[0] - today;
            nextExecution.setDate(nextExecution.getDate() + daysUntilNext);
          } else {
            // Next week
            const daysUntilNext = (7 - today) + dias_semana[0];
            nextExecution.setDate(nextExecution.getDate() + daysUntilNext);
          }
        }
        break;
        
      case 'monthly':
        if (dia_mes) {
          nextExecution.setDate(dia_mes);
          // If date has passed this month, schedule for next month
          if (nextExecution <= now) {
            nextExecution.setMonth(nextExecution.getMonth() + 1);
          }
        }
        break;
    }
    
    return nextExecution;
  }
}

export default new ScheduledReportsService();
