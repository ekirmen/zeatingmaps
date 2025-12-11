import React, { useState } from 'react';
import { Select, Button, Tooltip, Avatar, Dropdown, Menu } from '../utils/antdComponents';
import { useMultiTenant } from '../hooks/useMultiTenant';
import { 
  BankOutlined, 
  SwapOutlined, 
  PlusOutlined,
  CheckCircleOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Option } = Select;

const TenantSwitcher = ({ 
  showLabel = true, 
  size = 'middle', 
  style = {},
  onTenantChange = null 
}) => {
  const { 
    userTenants, 
    activeTenant, 
    loading, 
    canSwitchTenants,
    switchToTenant,
    totalTenants 
  } = useMultiTenant();
  
  const [switching, setSwitching] = useState(false);

  // Si no hay múltiples tenants, no mostrar nada

    return null;
  }

  const handleTenantChange = async (tenantId) => {
    if (tenantId === activeTenant?.tenant_id) return;
    
    setSwitching(true);
    try {
      const success = await switchToTenant(tenantId);
      if (success && onTenantChange) {
        onTenantChange(tenantId);
      }
    } finally {
      setSwitching(false);
    }
  };

  const getTenantDisplayName = (tenant) => {
    if (tenant.tenants?.company_name) {
      return tenant.tenants.company_name;
    }
    if (tenant.tenants?.subdomain) {
      return tenant.tenants.subdomain.charAt(0).toUpperCase() + tenant.tenants.subdomain.slice(1);
    }
    return 'Empresa';
  };

  const getTenantIcon = (tenant) => {
    if (tenant.tenants?.logo_url) {
      return <Avatar size="small" src={tenant.tenants.logo_url} />;
    }
    return <BankOutlined />;
  };

  // Si solo hay 2 tenants, mostrar como botones simples
  if (totalTenants === 2) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', ...style }}>
        {showLabel && <span style={{ fontSize: '12px', color: '#666' }}>Empresa:</span>}
        
        {userTenants.map((tenant) => (
          <Tooltip 
            key={tenant.tenant_id} 
            title={`Cambiar a ${getTenantDisplayName(tenant)}`}
          >
            <Button
              type={tenant.tenant_id === activeTenant?.tenant_id ? 'primary' : 'default'}
              size={size}
              icon={getTenantIcon(tenant)}
              onClick={() => handleTenantChange(tenant.tenant_id)}
              loading={switching}
              style={{
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {getTenantDisplayName(tenant)}
              {tenant.tenant_id === activeTenant?.tenant_id && (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              )}
            </Button>
          </Tooltip>
        ))}
      </div>
    );
  }

  // Si hay más de 2 tenants, mostrar como dropdown
  const menu = (
    <Menu>
      {userTenants.map((tenant) => (
        <Menu.Item
          key={tenant.tenant_id}
          icon={getTenantIcon(tenant)}
          onClick={() => handleTenantChange(tenant.tenant_id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: tenant.is_primary ? 'bold' : 'normal' }}>
              {getTenantDisplayName(tenant)}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {tenant.role} • {tenant.tenants?.subdomain || 'N/A'}
            </div>
          </div>
          {tenant.tenant_id === activeTenant?.tenant_id && (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          )}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      {showLabel && <span style={{ fontSize: '12px', color: '#666' }}>Empresa:</span>}
      
      <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
        <Button
          size={size}
          icon={<SwapOutlined />}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: '120px'
          }}
        >
          <span style={{ flex: 1, textAlign: 'left' }}>
            {activeTenant ? getTenantDisplayName(activeTenant) : 'Seleccionar...'}
          </span>
        </Button>
      </Dropdown>
      
      <span style={{ fontSize: '11px', color: '#999' }}>
        ({totalTenants})
      </span>
    </div>
  );
};

export default TenantSwitcher;

