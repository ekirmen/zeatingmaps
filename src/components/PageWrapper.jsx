import React from 'react';
import { Spin, Alert, Empty, Button } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * Componente wrapper para páginas que maneja estados comunes de loading, error y empty
 * @param {Object} props
 * @param {boolean} props.loading - Estado de carga
 * @param {Error|string} props.error - Error a mostrar
 * @param {any} props.data - Datos a verificar si están vacíos
 * @param {boolean} props.showEmpty - Si mostrar estado vacío cuando no hay data
 * @param {React.ReactNode} props.emptyMessage - Mensaje para estado vacío
 * @param {Function} props.onRetry - Función para reintentar
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {string} props.loadingMessage - Mensaje durante carga
 */
export const PageWrapper = ({
  loading = false,
  error = null,
  data = null,
  showEmpty = false,
  emptyMessage = 'No hay datos disponibles',
  onRetry = null,
  children,
  loadingMessage = 'Cargando...'
}) => {
  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert
          message="Error"
          description={
            typeof error === 'string' ? error : error?.message || 'Ha ocurrido un error'
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            onRetry && (
              <Button
                size="small"
                danger
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                Reintentar
              </Button>
            )
          }
        />
      </div>
    );
  }

  // Estado vacío
  if (showEmpty && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Empty
          description={emptyMessage}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  // Contenido normal
  return <>{children}</>;
};

/**
 * Hook para usar PageWrapper con estados comunes
 */
export const usePageState = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const executeWithState = React.useCallback(async (asyncFunction) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, setLoading, setError, executeWithState, reset };
};

