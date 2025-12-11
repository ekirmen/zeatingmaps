import React from 'react';
import { Card, Typography, Button, Space, Alert, Divider } from '../../../utils/antdComponents';
import { BugOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {

    return {
      hasError: true,
      error: error,
      errorCount: this.state?.errorCount + 1 || 1,
      lastErrorTime: new Date()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ðŸš¨ [ErrorBoundary] Error caught:', error);
    console.error('ðŸš¨ [ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorCount: this.state.errorCount + 1,
      lastErrorTime: new Date()
    });

    // Log adicional para el error espec­fico de 'R'
    if (error.message && error.message.includes("Cannot access 'R' before initialization")) {
      console.error('ðŸš¨ [ErrorBoundary] Detected "R" initialization error');
      console.error('ðŸš¨ [ErrorBoundary] Stack trace:', error.stack);

      // Intentar identificar el origen del problema
      this.analyzeRVariableError(error);
    }
  }

  analyzeRVariableError(error) {
    // Verificar imports problem¡ticos
    const problematicImports = [
      'supabaseClient',
      'useBoleteria',
      'TenantContext',
      'ThemeContext',
      'seatLockStore'
    ];

    problematicImports.forEach(importName => {
      try {
        // Intentar importar din¡micamente para detectar problemas
        import(`../../../${importName}`).then(module => {
          console.log(`œ… [ErrorBoundary] ${importName} import successful:`, Object.keys(module));
        }).catch(importError => {
          console.error(`Œ [ErrorBoundary] ${importName} import failed:`, importError);
        });
      } catch (e) {
        console.error(`Œ [ErrorBoundary] Error testing ${importName}:`, e);
      }
    });

    // Verificar variables globales
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-gray-50 min-h-screen">
          <Card
            title={
              <Space>
                <BugOutlined style={{ color: '#ff4d4f' }} />
                <span>Error Boundary - Componente Fallido</span>
              </Space>
            }
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Error Summary */}
              <Alert
                message="Error Detectado"
                description={
                  <div>
                    <Text strong>Error: </Text>
                    <Text code>{this.state.error?.message || 'Error desconocido'}</Text>
                    <br />
                    <Text strong>Count: </Text>
                    <Text>{this.state.errorCount}</Text>
                    <br />
                    <Text strong>Time: </Text>
                    <Text>{this.state.lastErrorTime?.toLocaleString()}</Text>
                  </div>
                }
                type="error"
                showIcon
              />

              <Divider />

              {/* Specific R Variable Error */}
              {this.state.error?.message?.includes("Cannot access 'R' before initialization") && (
                <Alert
                  message="Error de Variable 'R' Detectado"
                  description={
                    <div>
                      <Paragraph>
                        Este error indica que el c³digo est¡ intentando usar la variable <Text code>R</Text> antes de que est© inicializada.
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Posibles causas:</Text>
                      </Paragraph>
                      <ul>
                        <li>Dependencia circular entre m³dulos</li>
                        <li>Importaci³n incorrecta de un m³dulo</li>
                        <li>Variable declarada con <Text code>let</Text> o <Text code>const</Text> usada antes de su declaraci³n</li>
                        <li>Problema con el bundler (webpack/vite)</li>
                      </ul>
                      <Paragraph>
                        <Text strong>Acciones recomendadas:</Text>
                      </Paragraph>
                      <ul>
                        <li>Verificar imports circulares</li>
                        <li>Revisar el orden de declaraci³n de variables</li>
                        <li>Limpiar cache del navegador</li>
                        <li>Reiniciar el servidor de desarrollo</li>
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                />
              )}

              <Divider />

              {/* Error Details */}
              <div>
                <Title level={5}>ðŸ“‹ Detalles del Error</Title>
                <details>
                  <summary>Stack Trace</summary>
                  <pre style={{
                    fontSize: '12px',
                    backgroundColor: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {this.state.error?.stack}
                  </pre>
                </details>
              </div>

              {this.state.errorInfo && (
                <div>
                  <Title level={5}>ðŸ“‹ Component Stack</Title>
                  <details>
                    <summary>Component Stack</summary>
                    <pre style={{
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <Divider />

              {/* Actions */}
              <div style={{ textAlign: 'center' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                  >
                    Reintentar
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={this.handleReload}
                  >
                    Recargar P¡gina
                  </Button>
                  <Button
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                    }}
                  >
                    Debug Info
                  </Button>
                </Space>
              </div>

              {/* Environment Info */}
              <Divider />
              <div>
                <Title level={5}>ðŸŒ Informaci³n del Entorno</Title>
                <Text>URL: {window.location.href}</Text>
                <br />
                <Text>User Agent: {navigator.userAgent}</Text>
                <br />
                <Text>NODE_ENV: {process.env.NODE_ENV}</Text>
                <br />
                <Text>React Version: {React.version}</Text>
              </div>
            </Space>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


