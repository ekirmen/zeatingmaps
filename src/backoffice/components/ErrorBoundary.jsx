import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    // Recargar la página
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <Alert
              message="Error de Inicialización"
              description={
                <div className="space-y-4">
                  <p>
                    Ha ocurrido un error al cargar la aplicación. Esto puede deberse a un problema 
                    temporal de inicialización del código.
                  </p>
                  <div className="text-sm text-gray-600">
                    <p><strong>Error:</strong> {this.state.error?.message || 'Error desconocido'}</p>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Detalles técnicos</summary>
                        <pre className="text-xs mt-2 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />} 
                      onClick={this.handleReload}
                    >
                      Recargar Página
                    </Button>
                    <Button 
                      onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              }
              type="error"
              showIcon
              className="w-full"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
