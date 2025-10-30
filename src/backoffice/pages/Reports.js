import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert } from 'antd';

const iframeStyle = {
  width: '100%',
  border: 'none',
  borderRadius: '16px',
  minHeight: 'calc(100vh - 200px)',
  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)'
};

const containerStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 'calc(100vh - 140px)',
  display: 'flex',
  flexDirection: 'column'
};

const loaderStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(248, 250, 252, 0.6)',
  zIndex: 2,
  borderRadius: '16px'
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div style={containerStyle}>
      {loading && (
        <div style={loaderStyle}>
          <Spin tip="Cargando centro de reportes" size="large" />
        </div>
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message="No se pudo cargar el centro de reportes"
          description="Verifica tu conexión o recarga la página para intentarlo nuevamente."
          style={{ marginBottom: 24 }}
        />
      )}
      <iframe
        title="Centro de reportes"
        src="/legacy/ventas-reportes.html"
        style={iframeStyle}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default Reports;
