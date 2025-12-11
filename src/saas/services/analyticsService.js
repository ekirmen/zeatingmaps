import { supabase } from '../../supabaseClient';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Obtener métricas generales del sistema
  async getSystemMetrics() {
    try {
      const cacheKey = 'system_metrics';

      if (cached) return cached;

      const [
        { count: totalTenants },
        { count: activeTenants },
        { count: suspendedTenants },
        { count: totalEvents },
        { count: totalUsers },
        { count: totalSales }
      ] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('eventos').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('ventas').select('*', { count: 'exact', head: true })
      ]);

      const metrics = {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        suspendedTenants: suspendedTenants || 0,
        totalEvents: totalEvents || 0,
        totalUsers: totalUsers || 0,
        totalSales: totalSales || 0,
        tenantGrowthRate: await this.getTenantGrowthRate(),
        revenueGrowth: await this.getRevenueGrowth(),
        averageRevenuePerTenant: await this.getAverageRevenuePerTenant()
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  // Obtener métricas por tenant
  async getTenantMetrics(tenantId) {
    try {
      const cacheKey = `tenant_metrics_${tenantId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const [
        { data: tenant },
        { count: events },
        { count: users },
        { count: sales },
        { data: revenue }
      ] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', tenantId).single(),
        supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('ventas').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('payment_transactions').select('amount').eq('tenant_id', tenantId).eq('status', 'completed')
      ]);

      const totalRevenue = revenue?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

      const metrics = {
        tenant: tenant,
        events: events || 0,
        users: users || 0,
        sales: sales || 0,
        revenue: totalRevenue,
        eventsThisMonth: await this.getEventsThisMonth(tenantId),
        usersThisMonth: await this.getUsersThisMonth(tenantId),
        revenueThisMonth: await this.getRevenueThisMonth(tenantId),
        averageEventRevenue: sales > 0 ? totalRevenue / sales : 0,
        userEngagement: await this.getUserEngagement(tenantId)
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting tenant metrics:', error);
      return this.getDefaultTenantMetrics();
    }
  }

  // Obtener tendencias de crecimiento de tenants
  async getTenantGrowthRate() {
    try {
      const currentMonth = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [currentCount, lastCount] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }).gte('created_at', this.getMonthStart(currentMonth)),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).gte('created_at', this.getMonthStart(lastMonth)).lt('created_at', this.getMonthStart(currentMonth))
      ]);

      const current = currentCount.count || 0;
      const last = lastCount.count || 0;

      return last > 0 ? ((current - last) / last) * 100 : 0;
    } catch (error) {
      console.error('Error getting tenant growth rate:', error);
      return 0;
    }
  }

  // Obtener crecimiento de ingresos
  async getRevenueGrowth() {
    try {
      const currentMonth = this.getMonthStart(new Date());
      const lastMonth = this.getMonthStart(new Date(new Date().setMonth(new Date().getMonth() - 1)));

      const [currentRevenue, lastRevenue] = await Promise.all([
        supabase.from('payment_transactions').select('amount').eq('status', 'completed').gte('created_at', currentMonth),
        supabase.from('payment_transactions').select('amount').eq('status', 'completed').gte('created_at', lastMonth).lt('created_at', currentMonth)
      ]);

      const current = currentRevenue.data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const last = lastRevenue.data?.reduce((sum, t) => sum + t.amount, 0) || 0;

      return last > 0 ? ((current - last) / last) * 100 : 0;
    } catch (error) {
      console.error('Error getting revenue growth:', error);
      return 0;
    }
  }

  // Obtener ingresos promedio por tenant
  async getAverageRevenuePerTenant() {
    try {
      const { data: tenants } = await supabase.from('tenants').select('id');
      if (!tenants || tenants.length === 0) return 0;

      const totalRevenue = await Promise.all(
        tenants.map(async (tenant) => {
          const { data } = await supabase
            .from('payment_transactions')
            .select('amount')
            .eq('tenant_id', tenant.id)
            .eq('status', 'completed');
          
          return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
        })
      );

      const sum = totalRevenue.reduce((sum, revenue) => sum + revenue, 0);
      return sum / tenants.length;
    } catch (error) {
      console.error('Error getting average revenue per tenant:', error);
      return 0;
    }
  }

  // Obtener eventos de este mes
  async getEventsThisMonth(tenantId) {
    try {
      const { count } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', this.getMonthStart(new Date()));

      return count || 0;
    } catch (error) {
      console.error('Error getting events this month:', error);
      return 0;
    }
  }

  // Obtener usuarios de este mes
  async getUsersThisMonth(tenantId) {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', this.getMonthStart(new Date()));

      return count || 0;
    } catch (error) {
      console.error('Error getting users this month:', error);
      return 0;
    }
  }

  // Obtener ingresos de este mes
  async getRevenueThisMonth(tenantId) {
    try {
      const { data } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('created_at', this.getMonthStart(new Date()));

      return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
    } catch (error) {
      console.error('Error getting revenue this month:', error);
      return 0;
    }
  }

  // Obtener engagement de usuarios
  async getUserEngagement(tenantId) {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('last_login')
        .eq('tenant_id', tenantId)
        .not('last_login', 'is', null);

      if (!users || users.length === 0) return 0;

      const now = new Date();
      const activeUsers = users.filter(user => {
        const lastLogin = new Date(user.last_login);
        const daysDiff = (now - lastLogin) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Usuarios activos en los últimos 30 días
      });

      return (activeUsers.length / users.length) * 100;
    } catch (error) {
      console.error('Error getting user engagement:', error);
      return 0;
    }
  }

  // Obtener top tenants por rendimiento
  async getTopPerformingTenants(limit = 10) {
    try {
      const { data: tenants } = await supabase.from('tenants').select('id, company_name, plan_type');

      const tenantMetrics = await Promise.all(
        tenants.map(async (tenant) => {
          const metrics = await this.getTenantMetrics(tenant.id);
          return {
            ...tenant,
            ...metrics,
            performanceScore: this.calculatePerformanceScore(metrics)
          };
        })
      );

      return tenantMetrics
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top performing tenants:', error);
      return [];
    }
  }

  // Calcular score de rendimiento
  calculatePerformanceScore(metrics) {
    const weights = {
      revenue: 0.4,
      events: 0.3,
      users: 0.2,
      userEngagement: 0.1
    };

    const normalizedRevenue = Math.min(metrics.revenue / 10000, 1); // Normalizar a 0-1
    const normalizedEvents = Math.min(metrics.events / 100, 1);
    const normalizedUsers = Math.min(metrics.users / 1000, 1);
    const normalizedEngagement = metrics.userEngagement / 100;

    return (
      normalizedRevenue * weights.revenue +
      normalizedEvents * weights.events +
      normalizedUsers * weights.users +
      normalizedEngagement * weights.userEngagement
    ) * 100;
  }

  // Obtener datos de uso por período
  async getUsageData(period = 'month', tenantId = null) {
    try {
      const startDate = this.getPeriodStart(period);
      const endDate = new Date().toISOString();

      let query = supabase
        .from('audit_logs')
        .select('action, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      // Agrupar por día
      const usageByDay = {};
      data.forEach(log => {
        const date = log.created_at.split('T')[0];
        usageByDay[date] = (usageByDay[date] || 0) + 1;
      });

      return Object.entries(usageByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting usage data:', error);
      return [];
    }
  }

  // Obtener inicio del período
  getPeriodStart(period) {
    const now = new Date();
    switch (period) {
      case 'day':
        now.setHours(0, 0, 0, 0);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now.toISOString();
  }

  // Obtener inicio del mes
  getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  }

  // Gestión de caché
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Limpiar caché
  clearCache() {
    this.cache.clear();
  }

  // Métricas por defecto
  getDefaultMetrics() {
    return {
      totalTenants: 0,
      activeTenants: 0,
      suspendedTenants: 0,
      totalEvents: 0,
      totalUsers: 0,
      totalSales: 0,
      tenantGrowthRate: 0,
      revenueGrowth: 0,
      averageRevenuePerTenant: 0
    };
  }

  getDefaultTenantMetrics() {
    return {
      tenant: null,
      events: 0,
      users: 0,
      sales: 0,
      revenue: 0,
      eventsThisMonth: 0,
      usersThisMonth: 0,
      revenueThisMonth: 0,
      averageEventRevenue: 0,
      userEngagement: 0
    };
  }
}

export default new AnalyticsService();
