import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Button, Alert, Divider } from 'antd';
import { BugOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const DebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState({
    mountTime: null,
    renderCount: 0,
    errors: [],
    warnings: [],
    imports: [],
    dependencies: {}
  });
  
  const renderCountRef = useRef(0);
  const errorLogRef = useRef([]);
  const warningLogRef = useRef([]);

  // Monitor component lifecycle
  useEffect(() => {
    const mountTime = new Date();
    renderCountRef.current += 1;
    
    setDebugInfo(prev => ({
      ...prev,
      mountTime,
      renderCount: renderCountRef.current
    }));

    console.log('🐛 [DebugComponent] Component mounted at:', mountTime.toISOString());
    console.log('🐛 [DebugComponent] Render count:', renderCountRef.current);

    // Monitor for errors
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const errorMsg = args.join(' ');
      errorLogRef.current.push({
        timestamp: new Date(),
        message: errorMsg,
        stack: new Error().stack
      });
      
      setDebugInfo(prev => ({
        ...prev,
        errors: [...errorLogRef.current]
      }));
      
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const warnMsg = args.join(' ');
      warningLogRef.current.push({
        timestamp: new Date(),
        message: warnMsg
      });
      
      setDebugInfo(prev => ({
        ...prev,
        warnings: [...warningLogRef.current]
      }));
      
      originalWarn.apply(console, args);
    };

    // Check for potential circular dependencies
    try {
      // Test imports that might cause issues
      const testImports = [
        () => import('../../../../supabaseClient'),
        () => import('../../hooks/useBoleteria'),
        () => import('../../../contexts/TenantContext'),
        () => import('../../../contexts/ThemeContext'),
        () => import('../../../components/seatLockStore')
      ];

      testImports.forEach(async (importFn, index) => {
        try {
          const module = await importFn();
          setDebugInfo(prev => ({
            ...prev,
            imports: [...prev.imports, { index, status: 'success', name: Object.keys(module)[0] || 'unknown' }]
          }));
        } catch (error) {
          setDebugInfo(prev => ({
            ...prev,
            imports: [...prev.imports, { index, status: 'error', error: error.message }]
          }));
        }
      });
    } catch (error) {
      console.error('🐛 [DebugComponent] Error testing imports:', error);
    }

    return () => {
      console.log('🐛 [DebugComponent] Component unmounted');
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Monitor window errors
  useEffect(() => {
    const handleError = (event) => {
      const errorInfo = {
        timestamp: new Date(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      };
      
      errorLogRef.current.push(errorInfo);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...errorLogRef.current]
      }));
    };

    const handleUnhandledRejection = (event) => {
      const errorInfo = {
        timestamp: new Date(),
        message: 'Unhandled Promise Rejection',
        reason: event.reason
      };
      
      errorLogRef.current.push(errorInfo);
      setDebugInfo(prev => ({
        ...prev,
        errors: [...errorLogRef.current]
      }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearLogs = () => {
    errorLogRef.current = [];
    warningLogRef.current = [];
    setDebugInfo(prev => ({
      ...prev,
      errors: [],
      warnings: []
    }));
  };

  const exportDebugInfo = () => {
    const dataStr = JSON.stringify(debugInfo, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-info-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          <span>Debug Information</span>
        </Space>
      }
      extra={
        <Space>
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={clearLogs}
          >
            Clear Logs
          </Button>
          <Button 
            size="small" 
            type="primary" 
            onClick={exportDebugInfo}
          >
            Export
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Basic Info */}
        <div>
          <Title level={5}>📊 Basic Information</Title>
          <Text>Mount Time: {debugInfo.mountTime?.toLocaleString()}</Text>
          <br />
          <Text>Render Count: {debugInfo.renderCount}</Text>
          <br />
          <Text>Uptime: {debugInfo.mountTime ? Math.round((new Date() - debugInfo.mountTime) / 1000) : 0}s</Text>
        </div>

        <Divider />

        {/* Import Status */}
        <div>
          <Title level={5}>📦 Import Status</Title>
          {debugInfo.imports.map((imp, index) => (
            <div key={index}>
              <Text>
                Import {index}: {imp.status === 'success' ? '✅' : '❌'} {imp.name || imp.error}
              </Text>
            </div>
          ))}
        </div>

        <Divider />

        {/* Errors */}
        <div>
          <Title level={5}>❌ Errors ({debugInfo.errors.length})</Title>
          {debugInfo.errors.length === 0 ? (
            <Text type="secondary">No errors detected</Text>
          ) : (
            debugInfo.errors.slice(-5).map((error, index) => (
              <Alert
                key={index}
                message={error.message}
                description={
                  <div>
                    <Text>Time: {error.timestamp?.toLocaleTimeString()}</Text>
                    {error.filename && <br />}
                    {error.filename && <Text>File: {error.filename}:{error.lineno}</Text>}
                    {error.stack && (
                      <details style={{ marginTop: 8 }}>
                        <summary>Stack Trace</summary>
                        <pre style={{ fontSize: '12px', marginTop: 4 }}>
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                }
                type="error"
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))
          )}
        </div>

        <Divider />

        {/* Warnings */}
        <div>
          <Title level={5}>⚠️ Warnings ({debugInfo.warnings.length})</Title>
          {debugInfo.warnings.length === 0 ? (
            <Text type="secondary">No warnings detected</Text>
          ) : (
            debugInfo.warnings.slice(-3).map((warning, index) => (
              <Alert
                key={index}
                message={warning.message}
                description={`Time: ${warning.timestamp?.toLocaleTimeString()}`}
                type="warning"
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))
          )}
        </div>

        <Divider />

        {/* Environment Info */}
        <div>
          <Title level={5}>🌍 Environment</Title>
          <Text>User Agent: {navigator.userAgent}</Text>
          <br />
          <Text>URL: {window.location.href}</Text>
          <br />
          <Text>NODE_ENV: {process.env.NODE_ENV}</Text>
          <br />
          <Text>React Version: {React.version}</Text>
        </div>
      </Space>
    </Card>
  );
};

export default DebugComponent;
