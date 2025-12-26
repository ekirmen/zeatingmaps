import { supabase } from '../../supabaseClient';

class SupportService {
  constructor() {
    this.priorities = ['low', 'medium', 'high', 'urgent'];
    this.statuses = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'];
    this.categories = ['technical', 'billing', 'feature_request', 'bug_report', 'general'];
  }

  // Crear ticket de soporte
  async createTicket(ticketData) {
    try {
      const ticket = {
        ...ticketData,
        ticket_number: await this.generateTicketNumber(),
        status: 'open',
        priority: ticketData.priority || 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticket])
        .select()
        .single();

      if (error) throw error;

      // Crear mensaje inicial
      await this.addMessage(data.id, {
        content: ticketData.description,
        sender_type: 'customer',
        sender_id: ticketData.customer_id
      });

      // Enviar notificación
      await this.sendTicketNotification(data.id, 'created');

      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  // Generar número de ticket
  async generateTicketNumber() {
    try {
      const { count } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true });

      const ticketNumber = `TK-${String(count + 1).padStart(6, '0')}`;
      return ticketNumber;
    } catch (error) {
      console.error('Error generating ticket number:', error);
      return `TK-${Date.now()}`;
    }
  }

  // Obtener tickets
  async getTickets(filters = {}) {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          tenants!support_tickets_tenant_id_fkey (
            company_name,
            contact_email
          ),
          profiles!support_tickets_customer_id_fkey (
            nombre,
            email
          ),
          profiles!support_tickets_assigned_to_fkey (
            nombre,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting support tickets:', error);
      return [];
    }
  }

  // Obtener ticket por ID
  async getTicket(ticketId) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          tenants!support_tickets_tenant_id_fkey (
            company_name,
            contact_email
          ),
          profiles!support_tickets_customer_id_fkey (
            nombre,
            email
          ),
          profiles!support_tickets_assigned_to_fkey (
            nombre,
            email
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;

      // Obtener mensajes del ticket
      const messages = await this.getTicketMessages(ticketId);
      data.messages = messages;

      return data;
    } catch (error) {
      console.error('Error getting support ticket:', error);
      return null;
    }
  }

  // Actualizar ticket
  async updateTicket(ticketId, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación si cambió el estado
      if (updates.status) {
        await this.sendTicketNotification(ticketId, 'status_changed', updates.status);
      }

      return data;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  // Asignar ticket
  async assignTicket(ticketId, assignedTo) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: assignedTo,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación
      await this.sendTicketNotification(ticketId, 'assigned', assignedTo);

      return data;
    } catch (error) {
      console.error('Error assigning support ticket:', error);
      throw error;
    }
  }

  // Agregar mensaje al ticket
  async addMessage(ticketId, messageData) {
    try {
      const message = {
        ...messageData,
        ticket_id: ticketId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('support_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      // Actualizar timestamp del ticket
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      // Enviar notificación
      await this.sendTicketNotification(ticketId, 'message_added');

      return data;
    } catch (error) {
      console.error('Error adding message to ticket:', error);
      throw error;
    }
  }

  // Obtener mensajes del ticket
  async getTicketMessages(ticketId) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles!support_messages_sender_id_fkey (
            nombre,
            email
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting ticket messages:', error);
      return [];
    }
  }

  // Resolver ticket
  async resolveTicket(ticketId, resolution) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación
      await this.sendTicketNotification(ticketId, 'resolved');

      return data;
    } catch (error) {
      console.error('Error resolving support ticket:', error);
      throw error;
    }
  }

  // Cerrar ticket
  async closeTicket(ticketId) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación
      await this.sendTicketNotification(ticketId, 'closed');

      return data;
    } catch (error) {
      console.error('Error closing support ticket:', error);
      throw error;
    }
  }

  // Enviar notificación de ticket
  async sendTicketNotification(ticketId, type, data = null) {
    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) return;

      let title, message;
      
      switch (type) {
        case 'created':
          title = 'Nuevo Ticket de Soporte';
          message = `Se ha creado un nuevo ticket de soporte: ${ticket.ticket_number}`;
          break;
        case 'assigned':
          title = 'Ticket Asignado';
          message = `El ticket ${ticket.ticket_number} ha sido asignado a un agente`;
          break;
        case 'status_changed':
          title = 'Estado del Ticket Actualizado';
          message = `El estado del ticket ${ticket.ticket_number} ha cambiado a: ${data}`;
          break;
        case 'message_added':
          title = 'Nuevo Mensaje en Ticket';
          message = `Se ha agregado un nuevo mensaje al ticket ${ticket.ticket_number}`;
          break;
        case 'resolved':
          title = 'Ticket Resuelto';
          message = `El ticket ${ticket.ticket_number} ha sido resuelto`;
          break;
        case 'closed':
          title = 'Ticket Cerrado';
          message = `El ticket ${ticket.ticket_number} ha sido cerrado`;
          break;
        default:
          title = 'Actualización de Ticket';
          message = `El ticket ${ticket.ticket_number} ha sido actualizado`;
      }

      // Crear notificación
      await supabase
        .from('notifications')
        .insert([{
          tenant_id: ticket.tenant_id,
          type: `support_${type}`,
          title,
          message,
          read: false,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error sending ticket notification:', error);
    }
  }

  // Obtener estadísticas de soporte
  async getSupportStats() {
    try {
      const [
        { count: totalTickets },
        { count: openTickets },
        { count: inProgressTickets },
        { count: resolvedTickets },
        { count: urgentTickets }
      ] = await Promise.all([
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('priority', 'urgent')
      ]);

      return {
        total: totalTickets || 0,
        open: openTickets || 0,
        inProgress: inProgressTickets || 0,
        resolved: resolvedTickets || 0,
        urgent: urgentTickets || 0,
        resolutionRate: totalTickets > 0 ? ((resolvedTickets || 0) / totalTickets) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting support stats:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        urgent: 0,
        resolutionRate: 0
      };
    }
  }

  // Obtener tickets por categoría
  async getTicketsByCategory() {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('category');

      if (error) throw error;

      const categoryCounts = {};
      data.forEach(ticket => {
        categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
      });

      return Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting tickets by category:', error);
      return [];
    }
  }

  // Obtener tiempo promedio de resolución
  async getAverageResolutionTime() {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('created_at, resolved_at')
        .not('resolved_at', 'is', null);

      if (error) throw error;

      const resolutionTimes = data.map(ticket => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return resolved - created;
      });

      const averageTime = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
      return averageTime / (1000 * 60 * 60); // Convertir a horas
    } catch (error) {
      console.error('Error getting average resolution time:', error);
      return 0;
    }
  }

  // Buscar tickets
  async searchTickets(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          tenants!support_tickets_tenant_id_fkey (
            company_name,
            contact_email
          ),
          profiles!support_tickets_customer_id_fkey (
            nombre,
            email
          )
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,ticket_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      // Aplicar filtros adicionales
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching support tickets:', error);
      return [];
    }
  }

  // Exportar tickets
  async exportTickets(filters = {}) {
    try {
      const tickets = await this.getTickets({ ...filters, limit: 10000 });
      
      const csvData = tickets.map(ticket => ({
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        tenant: ticket.tenants?.company_name || 'N/A',
        customer: ticket.profiles?.nombre || 'N/A',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at
      }));

      return csvData;
    } catch (error) {
      console.error('Error exporting support tickets:', error);
      return [];
    }
  }
}

export default new SupportService();
