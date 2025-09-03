import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Alert, Divider, List } from 'antd';
import { BugOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getSupabaseClient, getSupabaseAdminClient, getDebugInfo } from '../../../utils/lazyImports';

const { Title, Text, Paragraph } = Typography;

const DebugPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    setDebugInfo(getDebugInfo());
  }, []);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Test Supabase Client Import',
        test: async () => {
          try {
            const client = await getSupabaseClient();
            return { success: true, message: 'Supabase client loaded successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test Supabase Admin Client Import',
        test: async () => {
          try {
            const client = await getSupabaseAdminClient();
            return { success: true, message: 'Supabase admin client loaded successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test useBoleteria Hook Import',
        test: async () => {
          try {
            const { useBoleteria } = await import('../../hooks/useBoleteria');
            return { success: true, message: 'useBoleteria hook imported successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test TenantContext Import',
        test: async () => {
          try {
            const { useTenant } = await import('../../../contexts/TenantContext');
            return { success: true, message: 'TenantContext imported successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test ThemeContext Import',
        test: async () => {
          try {
            const { ThemeProvider } = await import('../../../contexts/ThemeContext');
            return { success: true, message: 'ThemeContext imported successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test seatLockStore Import',
        test: async () => {
          try {
            const { useSeatLockStore } = await import('../../../components/seatLockStore');
            return { success: true, message: 'seatLockStore imported successfully' };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test Global Variables',
        test: async () => {
          try {
            // Verificar variables globales que podrían causar el error 'R'
            const globalVars = {
              'window.R': typeof window.R,
              'global.R': typeof global?.R,
              'window.React': typeof window.React,
              'window.ReactDOM': typeof window.ReactDOM
            };
            
            const hasRVariable = Object.values(globalVars).some(type => type !== 'undefined');
            
            return { 
              success: !hasRVariable, 
              message: hasRVariable ? 
                `Found global R variable: ${JSON.stringify(globalVars)}` : 
                'No global R variable found' 
            };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      },
      {
        name: 'Test Module Resolution',
        test: async () => {
          try {
            // Verificar si hay problemas con la resolución de módulos
            const modules = [
              'react',
              'react-dom',
              'antd',
              '@ant-design/icons'
            ];
            
            const results = {};
            for (const module of modules) {
              try {
                await import(module);
                results[module] = 'success';
              } catch (error) {
                results[module] = `error: ${error.message}`;
              }
            }
            
            const hasErrors = Object.values(results).some(result => result !== 'success');
            
            return { 
              success: !hasErrors, 
              message: hasErrors ? 
                `Module resolution errors: ${JSON.stringify(results)}` : 
                'All modules resolved successfully' 
            };
          } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        setTestResults(prev => [...prev, {
          name: test.name,
          ...result,
          timestamp: new Date()
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          name: test.name,
          success: false,
          message: `Test failed: ${error.message}`,
          timestamp: new Date()
        }]);
      }
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card 
        title={
          <Space>
            <BugOutlined />
            <span>Debug Page - Test Imports</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={runTests}
              loading={loading}
            >
              Run Tests
            </Button>
            <Button 
              onClick={clearResults}
            >
              Clear Results
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Environment Info */}
          <div>
            <Title level={5}>🌍 Environment Information</Title>
            {debugInfo && (
              <div>
                <Text>URL: {debugInfo.url}</Text>
                <br />
                <Text>User Agent: {debugInfo.userAgent}</Text>
                <br />
                <Text>Timestamp: {debugInfo.timestamp}</Text>
                <br />
                <Text>Clients Loaded: {JSON.stringify(debugInfo.clientsLoaded)}</Text>
              </div>
            )}
          </div>

          <Divider />

          {/* Test Results */}
          <div>
            <Title level={5}>🧪 Test Results ({testResults.length})</Title>
            {testResults.length === 0 ? (
              <Text type="secondary">No tests run yet. Click "Run Tests" to start.</Text>
            ) : (
              <List
                dataSource={testResults}
                renderItem={(result, index) => (
                  <List.Item>
                    <Alert
                      message={result.name}
                      description={
                        <div>
                          <Text>{result.message}</Text>
                          <br />
                          <Text type="secondary">
                            Time: {result.timestamp?.toLocaleTimeString()}
                          </Text>
                        </div>
                      }
                      type={result.success ? 'success' : 'error'}
                      showIcon
                      icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>

          <Divider />

          {/* Instructions */}
          <div>
            <Title level={5}>📋 Instructions</Title>
            <Paragraph>
              This debug page helps identify the source of the "Cannot access 'R' before initialization" error.
            </Paragraph>
            <Paragraph>
              <Text strong>Steps to debug:</Text>
            </Paragraph>
            <ol>
              <li>Click "Run Tests" to test all imports</li>
              <li>Check which tests fail</li>
              <li>Look for any "R" variable references</li>
              <li>Check the console for additional error details</li>
            </ol>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default DebugPage;
