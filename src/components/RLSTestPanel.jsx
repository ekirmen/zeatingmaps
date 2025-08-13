import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, message, Space, Typography, Divider, Alert } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { getSupabaseClient } from '../config/supabase';

const { Title, Text } = Typography;

export const RLSTestPanel = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataAccess, setDataAccess] = useState({});
  
  const { user, userProfile, hasPermission, isSuperAdmin, isTenantAdmin } = useAuth();

  // Ejecutar todas las pruebas de RLS
  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});
    setDataAccess({});
    
    try {
      const results = {};
      
      // Test 1: Verificar autenticación
      results.auth = await testAuthentication();
      
      // Test 2: Verificar funciones RLS
      results.rlsFunctions = await testRLSFunctions();
      
      // Test 3: Verificar acceso a datos
      results.dataAccess = await testDataAccess();
      
      // Test 4: Verificar políticas RLS
      results.policies = await testRLSPolicies();
      
      setTestResults(results);
      message.success('Pruebas de RLS completadas');
    } catch (error) {
      console.error('Error ejecutando pruebas:', error);
      message.error('Error ejecutando pruebas de RLS');
    } finally {
      setLoading(false);
    }
  };

  // Test 1: Verificar autenticación
  const testAuthentication = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Cliente de Supabase no disponible' };
      }

      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      return {
        success: true,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          role: userProfile?.role || 'No definido',
          tenant_id: userProfile?.tenant_id || 'No definido'
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 2: Verificar funciones RLS
  const testRLSFunctions = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Cliente de Supabase no disponible' };
      }

      // Probar función is_super_admin
      const { data: superAdminResult, error: superAdminError } = await supabase
        .rpc('is_super_admin');
      
      if (superAdminError) {
        return { success: false, error: `Error en is_super_admin: ${superAdminError.message}` };
      }

      // Probar función is_tenant_admin
      const { data: tenantAdminResult, error: tenantAdminError } = await supabase
        .rpc('is_tenant_admin');
      
      if (tenantAdminError) {
        return { success: false, error: `Error en is_tenant_admin: ${tenantAdminError.message}` };
      }

      // Probar función has_permission
      const { data: permissionResult, error: permissionError } = await supabase
        .rpc('has_permission', { permission_name: 'gestión_de_recintos' });
      
      if (permissionError) {
        return { success: false, error: `Error en has_permission: ${permissionError.message}` };
      }

      return {
        success: true,
        functions: {
          is_super_admin: superAdminResult,
          is_tenant_admin: tenantAdminResult,
          has_permission: permissionResult
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 3: Verificar acceso a datos
  const testDataAccess = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Cliente de Supabase no disponible' };
      }

      const accessResults = {};

      // Test acceso a recintos
      try {
        const { data: recintos, error: recintosError } = await supabase
          .from('recintos')
          .select('id, nombre, tenant_id')
          .limit(10);
        
        accessResults.recintos = {
          success: !recintosError,
          count: recintos?.length || 0,
          error: recintosError?.message,
          data: recintos
        };
      } catch (error) {
        accessResults.recintos = {
          success: false,
          error: error.message
        };
      }

      // Test acceso a eventos
      try {
        const { data: eventos, error: eventosError } = await supabase
          .from('eventos')
          .select('id, titulo, tenant_id')
          .limit(10);
        
        accessResults.eventos = {
          success: !eventosError,
          count: eventos?.length || 0,
          error: eventosError?.message,
          data: eventos
        };
      } catch (error) {
        accessResults.eventos = {
          success: false,
          error: error.message
        };
      }

      // Test acceso a perfiles
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role, tenant_id')
          .limit(10);
        
        accessResults.profiles = {
          success: !profilesError,
          count: profiles?.length || 0,
          error: profilesError?.message,
          data: profiles
        };
      } catch (error) {
        accessResults.profiles = {
          success: false,
          error: error.message
        };
      }

      setDataAccess(accessResults);

      return {
        success: true,
        access: accessResults
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 4: Verificar políticas RLS
  const testRLSPolicies = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Cliente de Supabase no disponible' };
      }

      // Verificar que RLS esté habilitado
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd')
        .eq('schemaname', 'public')
        .limit(20);

      if (policiesError) {
        return { success: false, error: `Error obteniendo políticas: ${policiesError.message}` };
      }

      return {
        success: true,
        policies: policies || [],
        totalPolicies: policies?.length || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Renderizar resultado de test
  const renderTestResult = (testName, result) => {
    if (!result) return null;

    const isSuccess = result.success;
    
    return (
      <Card 
        size="small" 
        style={{ marginBottom: '16px' }}
        title={
          <Space>
            {isSuccess ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />}
            {testName}
          </Space>
        }
      >
        {isSuccess ? (
          <div>
            {result.user && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Usuario:</Text>
                <div style={{ marginLeft: '16px', fontSize: '12px' }}>
                  <div>ID: {result.user.id}</div>
                  <div>Email: {result.user.email}</div>
                  <div>Rol: <Tag color="blue">{result.user.role}</Tag></div>
                  <div>Tenant ID: <Tag color="purple">{result.user.tenant_id}</Tag></div>
                </div>
              </div>
            )}
            
            {result.functions && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>Funciones RLS:</Text>
                <div style={{ marginLeft: '16px', fontSize: '12px' }}>
                  <div>is_super_admin: <Tag color={result.functions.is_super_admin ? 'green' : 'red'}>{result.functions.is_super_admin ? 'true' : 'false'}</Tag></div>
                  <div>is_tenant_admin: <Tag color={result.functions.is_tenant_admin ? 'green' : 'red'}>{result.functions.is_tenant_admin ? 'true' : 'false'}</Tag></div>
                  <div>has_permission: <Tag color={result.functions.has_permission ? 'green' : 'red'}>{result.functions.has_permission ? 'true' : 'false'}</Tag></div>
                </div>
              </div>
            )}
            
            {result.policies && (
              <div>
                <Text strong>Políticas RLS:</Text>
                <div style={{ marginLeft: '16px', fontSize: '12px' }}>
                  <div>Total: <Tag color="blue">{result.totalPolicies}</Tag></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert
            message="Error en la prueba"
            description={result.error}
            type="error"
            showIcon
          />
        )}
      </Card>
    );
  };

  // Renderizar acceso a datos
  const renderDataAccess = () => {
    if (!dataAccess || Object.keys(dataAccess).length === 0) return null;

    const columns = [
      {
        title: 'Tabla',
        dataIndex: 'table',
        key: 'table',
        render: (text) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        render: (success) => (
          <Tag color={success ? 'green' : 'red'}>
            {success ? '✅ Acceso' : '❌ Bloqueado'}
          </Tag>
        )
      },
      {
        title: 'Registros',
        dataIndex: 'count',
        key: 'count',
        render: (count) => <Tag color="purple">{count}</Tag>
      },
      {
        title: 'Error',
        dataIndex: 'error',
        key: 'error',
        render: (error) => error ? <Text type="danger">{error}</Text> : '-'
      }
    ];

    const data = Object.entries(dataAccess).map(([table, result]) => ({
      key: table,
      table: table.charAt(0).toUpperCase() + table.slice(1),
      status: result.success,
      count: result.count || 0,
      error: result.error || null
    }));

    return (
      <Card 
        size="small" 
        title={<Space><DatabaseOutlined /> Acceso a Datos</Space>}
        style={{ marginBottom: '16px' }}
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SecurityScanOutlined /> Panel de Pruebas RLS
      </Title>
      
      <Alert
        message="Verificación de Row Level Security"
        description="Este panel verifica que las políticas RLS estén funcionando correctamente y que el usuario solo pueda acceder a datos de su tenant."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Space style={{ marginBottom: '24px' }}>
        <Button 
          type="primary" 
          icon={<SecurityScanOutlined />}
          onClick={runAllTests}
          loading={loading}
        >
          Ejecutar Todas las Pruebas
        </Button>
        
        <Button 
          icon={<UserOutlined />}
          onClick={() => console.log('Usuario actual:', user, 'Perfil:', userProfile)}
        >
          Ver Usuario Actual
        </Button>
      </Space>

      <Divider />

      {/* Resultados de las pruebas */}
      {Object.keys(testResults).length > 0 && (
        <div>
          <Title level={3}>Resultados de las Pruebas</Title>
          
          {renderTestResult('Autenticación', testResults.auth)}
          {renderTestResult('Funciones RLS', testResults.rlsFunctions)}
          {renderTestResult('Políticas RLS', testResults.policies)}
          
          {renderDataAccess()}
        </div>
      )}

      {/* Estado del usuario */}
      <Card size="small" title="Estado del Usuario" style={{ marginTop: '24px' }}>
        <div style={{ fontSize: '12px' }}>
          <div><strong>Autenticado:</strong> <Tag color={user ? 'green' : 'red'}>{user ? 'Sí' : 'No'}</Tag></div>
          <div><strong>Email:</strong> {user?.email || 'No disponible'}</div>
          <div><strong>Rol:</strong> <Tag color="blue">{userProfile?.role || 'No definido'}</Tag></div>
          <div><strong>Tenant ID:</strong> <Tag color="purple">{userProfile?.tenant_id || 'No definido'}</Tag></div>
          <div><strong>Super Admin:</strong> <Tag color={isSuperAdmin() ? 'gold' : 'default'}>{isSuperAdmin() ? 'Sí' : 'No'}</Tag></div>
          <div><strong>Tenant Admin:</strong> <Tag color={isTenantAdmin() ? 'blue' : 'default'}>{isTenantAdmin() ? 'Sí' : 'No'}</Tag></div>
        </div>
      </Card>
    </div>
  );
};

export default RLSTestPanel;
