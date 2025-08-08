# 🚀 Guía de Implementación SaaS Multi-Tenant

## 📋 Tabla de Contenidos
1. [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)
2. [Configuración DNS y SSL Wildcard](#configuración-dns-y-ssl-wildcard)
3. [Base de Datos Multi-Tenant](#base-de-datos-multi-tenant)
4. [Sistema de Facturación](#sistema-de-facturación)
5. [Panel de Administración SaaS](#panel-de-administración-saas)
6. [Implementación Técnica](#implementación-técnica)
7. [Monetización](#monetización)

---

## 🏗️ Arquitectura Multi-Tenant

### Estructura de Subdominios
```
empresa1.tudominio.com
empresa2.tudominio.com
empresa3.tudominio.com
```

### Componentes Principales
- **Tenant Manager**: Gestión de empresas/clientes
- **Billing System**: Facturación automática
- **Usage Analytics**: Métricas de uso
- **White-label**: Personalización por cliente

---

## 🌐 Configuración DNS y SSL Wildcard

### 1. Configuración DNS
```bash
# Registrar dominio principal
# Ejemplo: ticketera.com

# Configurar wildcard DNS
*.ticketera.com -> IP del servidor
```

### 2. SSL Wildcard Certificate
```bash
# Obtener certificado SSL wildcard
# Opciones:
# - Let's Encrypt (Gratis)
# - Comodo, DigiCert, etc. (Pago)

# Comando para Let's Encrypt
certbot certonly --manual --preferred-challenges=dns \
  -d *.ticketera.com -d ticketera.com
```

### 3. Configuración Nginx
```nginx
# /etc/nginx/sites-available/ticketera.com
server {
    listen 443 ssl http2;
    server_name *.ticketera.com;
    
    ssl_certificate /etc/letsencrypt/live/ticketera.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketera.com/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🗄️ Base de Datos Multi-Tenant

### 1. Esquema de Tenants
```sql
-- Tabla de empresas/tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}'
);

-- Tabla de suscripciones
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de facturas
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, cancelled
    due_date TIMESTAMP,
    paid_date TIMESTAMP,
    invoice_number VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de uso/métricas
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    metric_name VARCHAR(100) NOT NULL, -- events_created, tickets_sold, etc.
    metric_value INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Modificar tablas existentes para multi-tenant
ALTER TABLE eventos ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE usuarios ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE productos ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... agregar tenant_id a todas las tablas relevantes
```

### 2. Middleware de Tenant Detection
```javascript
// src/middleware/tenantMiddleware.js
import { createClient } from '@supabase/supabase-js';

export const detectTenant = (req, res, next) => {
  const host = req.headers.host;
  const subdomain = host.split('.')[0];
  
  // Buscar tenant por subdominio
  const tenant = await getTenantBySubdomain(subdomain);
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  req.tenant = tenant;
  next();
};

export const getTenantBySubdomain = async (subdomain) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'active')
    .single();
    
  return data;
};
```

---

## 💳 Sistema de Facturación

### 1. Integración con Stripe
```javascript
// src/services/billingService.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class BillingService {
  // Crear cliente en Stripe
  async createCustomer(tenant) {
    const customer = await stripe.customers.create({
      email: tenant.contact_email,
      name: tenant.company_name,
      metadata: {
        tenant_id: tenant.id,
        subdomain: tenant.subdomain
      }
    });
    
    return customer;
  }
  
  // Crear suscripción
  async createSubscription(tenantId, planId) {
    const tenant = await getTenant(tenantId);
    const customer = await this.createCustomer(tenant);
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: planId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    return subscription;
  }
  
  // Generar factura
  async generateInvoice(tenantId, amount, description) {
    const tenant = await getTenant(tenantId);
    const customer = await this.getCustomer(tenant.stripe_customer_id);
    
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      amount: amount * 100, // Stripe usa centavos
      currency: 'usd',
      description: description,
      auto_advance: true,
    });
    
    return invoice;
  }
}
```

### 2. Webhooks de Stripe
```javascript
// src/pages/api/stripe/webhook.js
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
  }
  
  res.json({ received: true });
}
```

---

## 🎛️ Panel de Administración SaaS

### 1. Dashboard de Administración
```javascript
// src/backoffice/pages/SaasDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Statistic, Table, Button, Modal, Form, Input, Select } from 'antd';
import { UserOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons';

const SaasDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({});
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  
  const columns = [
    {
      title: 'Empresa',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Subdominio',
      dataIndex: 'subdomain',
      key: 'subdomain',
    },
    {
      title: 'Plan',
      dataIndex: 'plan_type',
      key: 'plan_type',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Ingresos',
      dataIndex: 'revenue',
      key: 'revenue',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button.Group>
          <Button size="small">Ver</Button>
          <Button size="small">Editar</Button>
          <Button size="small" danger>Suspender</Button>
        </Button.Group>
      ),
    },
  ];
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard SaaS</h1>
        <p className="text-gray-600">Administra todas las empresas</p>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Statistic
            title="Total Empresas"
            value={stats.totalTenants}
            prefix={<UserOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Ingresos Mensuales"
            value={stats.monthlyRevenue}
            prefix={<DollarOutlined />}
            precision={2}
          />
        </Card>
        <Card>
          <Statistic
            title="Empresas Activas"
            value={stats.activeTenants}
            prefix={<BarChartOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Tasa de Retención"
            value={stats.retentionRate}
            suffix="%"
          />
        </Card>
      </div>
      
      {/* Tabla de Empresas */}
      <Card title="Empresas Registradas">
        <div className="mb-4">
          <Button type="primary" onClick={() => setShowCreateTenant(true)}>
            Nueva Empresa
          </Button>
        </div>
        <Table columns={columns} dataSource={tenants} />
      </Card>
      
      {/* Modal Crear Empresa */}
      <Modal
        title="Crear Nueva Empresa"
        open={showCreateTenant}
        onCancel={() => setShowCreateTenant(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Nombre de la Empresa" name="company_name">
            <Input />
          </Form.Item>
          <Form.Item label="Subdominio" name="subdomain">
            <Input addonAfter=".ticketera.com" />
          </Form.Item>
          <Form.Item label="Email de Contacto" name="contact_email">
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Plan" name="plan_type">
            <Select>
              <Select.Option value="basic">Básico</Select.Option>
              <Select.Option value="pro">Profesional</Select.Option>
              <Select.Option value="enterprise">Empresarial</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SaasDashboard;
```

### 2. Sistema de Planes
```javascript
// src/config/plans.js
export const PLANS = {
  basic: {
    name: 'Básico',
    price: 29,
    features: [
      'Hasta 5 eventos por mes',
      'Hasta 100 tickets por evento',
      'Soporte por email',
      'Plantillas básicas'
    ],
    limits: {
      events_per_month: 5,
      tickets_per_event: 100,
      storage_gb: 1
    }
  },
  pro: {
    name: 'Profesional',
    price: 79,
    features: [
      'Eventos ilimitados',
      'Hasta 1000 tickets por evento',
      'Soporte prioritario',
      'Plantillas personalizadas',
      'Analytics avanzados'
    ],
    limits: {
      events_per_month: -1, // ilimitado
      tickets_per_event: 1000,
      storage_gb: 10
    }
  },
  enterprise: {
    name: 'Empresarial',
    price: 199,
    features: [
      'Todo del plan Pro',
      'Soporte 24/7',
      'API personalizada',
      'White-label completo',
      'Integraciones avanzadas'
    ],
    limits: {
      events_per_month: -1,
      tickets_per_event: -1,
      storage_gb: 100
    }
  }
};
```

---

## 🔧 Implementación Técnica

### 1. Configuración de Vercel para Subdominios
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/tenant-handler?path=$1"
    }
  ],
  "functions": {
    "api/tenant-handler.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. API Handler para Subdominios
```javascript
// src/pages/api/tenant-handler.js
import { detectTenant } from '../../middleware/tenantMiddleware';

export default async function handler(req, res) {
  const host = req.headers.host;
  const subdomain = host.split('.')[0];
  
  // Detectar tenant
  const tenant = await detectTenant(subdomain);
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Redirigir a la aplicación con el tenant
  const url = new URL(req.url, `https://${host}`);
  url.searchParams.set('tenant', tenant.id);
  
  res.redirect(url.toString());
}
```

### 3. Contexto de Tenant
```javascript
// src/contexts/TenantContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const detectTenant = async () => {
      const host = window.location.host;
      const subdomain = host.split('.')[0];
      
      try {
        const response = await fetch(`/api/tenants/${subdomain}`);
        const tenantData = await response.json();
        setTenant(tenantData);
      } catch (error) {
        console.error('Error detecting tenant:', error);
      } finally {
        setLoading(false);
      }
    };
    
    detectTenant();
  }, []);
  
  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
```

---

## 💰 Monetización

### 1. Modelos de Precios
- **Freemium**: Plan básico gratis, características premium pagadas
- **Por Uso**: Pago por ticket vendido
- **Suscripción**: Planes mensuales/anuales
- **Enterprise**: Precios personalizados

### 2. Métricas de Ingresos
```javascript
// src/services/analyticsService.js
export class AnalyticsService {
  // Calcular MRR (Monthly Recurring Revenue)
  async calculateMRR() {
    const subscriptions = await this.getActiveSubscriptions();
    return subscriptions.reduce((total, sub) => total + sub.monthlyAmount, 0);
  }
  
  // Calcular Churn Rate
  async calculateChurnRate() {
    const totalCustomers = await this.getTotalCustomers();
    const churnedCustomers = await this.getChurnedCustomers();
    return (churnedCustomers / totalCustomers) * 100;
  }
  
  // Calcular LTV (Lifetime Value)
  async calculateLTV(customerId) {
    const customer = await this.getCustomer(customerId);
    const avgOrderValue = await this.getAverageOrderValue(customerId);
    const purchaseFrequency = await this.getPurchaseFrequency(customerId);
    const customerLifespan = await this.getCustomerLifespan(customerId);
    
    return avgOrderValue * purchaseFrequency * customerLifespan;
  }
}
```

### 3. Dashboard de Ingresos
```javascript
// src/backoffice/pages/RevenueDashboard.jsx
import React from 'react';
import { Card, Statistic, Chart } from 'antd';

const RevenueDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Ingresos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic title="MRR" value={mrr} prefix="$" />
        </Card>
        <Card>
          <Statistic title="ARR" value={arr} prefix="$" />
        </Card>
        <Card>
          <Statistic title="Churn Rate" value={churnRate} suffix="%" />
        </Card>
      </div>
      
      {/* Gráficos de ingresos */}
      <Card title="Ingresos por Mes">
        <Chart data={revenueData} />
      </Card>
    </div>
  );
};
```

---

## 🚀 Pasos de Implementación

### Fase 1: Infraestructura (2-3 semanas)
1. Configurar DNS wildcard
2. Obtener SSL wildcard certificate
3. Configurar Nginx/Apache
4. Modificar base de datos para multi-tenant

### Fase 2: Desarrollo Core (4-6 semanas)
1. Implementar tenant detection
2. Crear sistema de facturación
3. Desarrollar panel de administración SaaS
4. Implementar límites por plan

### Fase 3: Monetización (2-3 semanas)
1. Integrar Stripe/PayPal
2. Implementar webhooks
3. Crear dashboard de ingresos
4. Configurar métricas

### Fase 4: Optimización (2-3 semanas)
1. Optimizar rendimiento
2. Implementar cache
3. Configurar monitoreo
4. Testing y QA

---

## 💡 Consejos Adicionales

### 1. Seguridad
- Implementar rate limiting por tenant
- Validar límites de uso en tiempo real
- Backup automático por tenant

### 2. Escalabilidad
- Usar CDN para assets estáticos
- Implementar cache distribuido
- Considerar microservicios para escalar

### 3. Marketing
- Crear landing page para cada plan
- Implementar sistema de referidos
- A/B testing para optimizar conversiones

### 4. Soporte
- Sistema de tickets por tenant
- Chat en vivo
- Documentación personalizada

---

## 📊 ROI Estimado

### Inversión Inicial
- Desarrollo: $15,000 - $25,000
- Infraestructura: $2,000 - $5,000
- Marketing: $5,000 - $10,000

### Ingresos Proyectados (Año 1)
- 50 empresas x $79/mes = $47,400/año
- 20 empresas x $199/mes = $47,760/año
- **Total: $95,160/año**

### ROI: 300-400% en el primer año

---

¿Te gustaría que empecemos con alguna fase específica o tienes preguntas sobre algún aspecto particular?
