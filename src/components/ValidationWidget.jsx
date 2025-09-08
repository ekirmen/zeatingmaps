import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  Badge, 
  Tooltip, 
  Button, 
  Space, 
  Typography,
  Card,
  Progress,
  Divider
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import VisualNotifications from '../utils/VisualNotifications';

const { Text, Title } = Typography;

// ===== COMPONENTE DE VALIDACIÓN FLOTANTE =====
const ValidationWidget = ({ 
  selectedSeats = [], 
  selectedClient, 
  paymentData,
  onValidationChange,
  showNotifications = true,
  position = 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) => {
  const [validationResults, setValidationResults] = useState({
    seats: { isValid: true, errors: [], warnings: [], totalPrice: 0 },
    payment: { isValid: true, errors: [], warnings: [] }
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // ===== EFECTO PARA VALIDAR ASIENTOS =====
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setValidationResults(prev => ({
        ...prev,
        seats: { isValid: true, errors: [], warnings: [], totalPrice: 0 }
      }));
      return;
    }

    // Validación básica de asientos
    const errors = [];
    const warnings = [];
    let totalPrice = 0;

    // Validar límite de asientos
    if (selectedSeats.length > 10) {
      errors.push('Máximo 10 asientos por usuario');
    } else if (selectedSeats.length > 5) {
      warnings.push('Selección de muchos asientos');
    }

    // Calcular precio total
    selectedSeats.forEach(seat => {
      if (seat.precio) {
        totalPrice += parseFloat(seat.precio);
      }
    });

    // Validar precio total
    if (totalPrice > 1000) {
      warnings.push('Transacción de alto valor');
    }

    const seatValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalPrice
    };

    setValidationResults(prev => ({
      ...prev,
      seats: seatValidation
    }));

    // Notificaciones automáticas (deshabilitadas para evitar spam)
    if (showNotifications && false) { // Deshabilitado temporalmente
      if (seatValidation.errors.length > 0) {
        VisualNotifications.show('error', seatValidation.errors[0]);
        setNotificationCount(prev => prev + 1);
      } else if (seatValidation.warnings.length > 0) {
        VisualNotifications.show('validationWarning', seatValidation.warnings[0]);
        setNotificationCount(prev => prev + 1);
      } else if (selectedSeats.length === 1) {
        VisualNotifications.show('seatSelected');
      } else if (selectedSeats.length > 1) {
        VisualNotifications.show('seatLimit', `${selectedSeats.length} asientos seleccionados`);
      }
    }

    // Callback para el componente padre
    onValidationChange && onValidationChange(seatValidation);
  }, [selectedSeats, selectedClient, showNotifications, onValidationChange]);

  // ===== EFECTO PARA VALIDAR PAGO =====
  useEffect(() => {
    if (!paymentData) return;

    const errors = [];
    const warnings = [];

    if (!paymentData.method) {
      errors.push('Método de pago requerido');
    }
    
    if (!paymentData.clientId) {
      errors.push('Información del cliente requerida');
    }
    
    if (paymentData.amount <= 0) {
      errors.push('Monto inválido');
    }
    
    if (paymentData.amount > 1000) {
      warnings.push('Transacción de alto valor, verificar documentación');
    }

    const paymentValidation = {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
    setValidationResults(prev => ({
      ...prev,
      payment: paymentValidation
    }));

    // Notificaciones automáticas (deshabilitadas para evitar spam)
    if (showNotifications && false) { // Deshabilitado temporalmente
      if (paymentValidation.errors.length > 0) {
        VisualNotifications.show('error', paymentValidation.errors[0]);
        setNotificationCount(prev => prev + 1);
      } else if (paymentValidation.warnings.length > 0) {
        VisualNotifications.show('paymentWarning', paymentValidation.warnings[0]);
        setNotificationCount(prev => prev + 1);
      }
    }
  }, [paymentData, showNotifications]);

  // ===== FUNCIONES DE UTILIDAD =====
  const getValidationStatus = () => {
    const hasErrors = validationResults.seats.errors.length > 0 || validationResults.payment.errors.length > 0;
    const hasWarnings = validationResults.seats.warnings.length > 0 || validationResults.payment.warnings.length > 0;
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    const status = getValidationStatus();
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = () => {
    const status = getValidationStatus();
    switch (status) {
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'fixed',
      zIndex: 50
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, bottom: '16px', left: '16px' };
      case 'top-right':
        return { ...baseStyle, top: '16px', right: '16px' };
      case 'top-left':
        return { ...baseStyle, top: '16px', left: '16px' };
      default: // bottom-right
        return { ...baseStyle, bottom: '16px', right: '16px' };
    }
  };

  // ===== RENDERIZADO =====
  if (selectedSeats.length === 0 && !paymentData) {
    return null;
  }

  return (
    <div style={getPositionStyle()}>
      {/* Botón principal con badge */}
      <Tooltip title="Validaciones en Tiempo Real">
        <Badge count={notificationCount} size="small">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<BellOutlined />}
            onClick={() => setShowDetails(!showDetails)}
            style={{
              backgroundColor: getStatusColor(),
              borderColor: getStatusColor(),
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          />
        </Badge>
      </Tooltip>

      {/* Panel de detalles */}
      {showDetails && (
        <Card
          title={
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Validaciones en Tiempo Real</span>
            </div>
          }
          className="mt-2 w-80 shadow-lg"
          extra={
            <Button
              size="small"
              icon={showDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowDetails(false)}
            />
          }
        >
          <div className="space-y-4">
            {/* Estado general */}
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                Estado: {getValidationStatus().toUpperCase()}
              </div>
              <Progress
                percent={
                  getValidationStatus() === 'success' ? 100 :
                  getValidationStatus() === 'warning' ? 75 :
                  getValidationStatus() === 'error' ? 25 : 0
                }
                status={getValidationStatus()}
                strokeColor={getStatusColor()}
                size="small"
              />
            </div>

            <Divider />

            {/* Validación de asientos */}
            {selectedSeats.length > 0 && (
              <div>
                <Title level={5} className="mb-2">
                  🪑 Validación de Asientos ({selectedSeats.length})
                </Title>
                
                {validationResults.seats.errors.length > 0 && (
                  <div className="mb-2">
                    <Text type="danger" strong>Errores:</Text>
                    <div className="space-y-1 mt-1">
                      {validationResults.seats.errors.map((error, index) => (
                        <Alert
                          key={index}
                          message={error}
                          type="error"
                          showIcon
                          size="small"
                          className="mb-1"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {validationResults.seats.warnings.length > 0 && (
                  <div className="mb-2">
                    <Text type="warning" strong>Advertencias:</Text>
                    <div className="space-y-1 mt-1">
                      {validationResults.seats.warnings.map((warning, index) => (
                        <Alert
                          key={index}
                          message={warning}
                          type="warning"
                          showIcon
                          size="small"
                          className="mb-1"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {validationResults.seats.isValid && validationResults.seats.warnings.length === 0 && (
                  <Alert
                    message="✅ Selección de asientos válida"
                    type="success"
                    showIcon
                    size="small"
                  />
                )}

                {validationResults.seats.totalPrice > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <Text strong>Precio Total: </Text>
                    <Text className="text-green-600">${validationResults.seats.totalPrice.toFixed(2)}</Text>
                  </div>
                )}
              </div>
            )}

            {/* Validación de pago */}
            {paymentData && (
              <div>
                <Divider />
                <Title level={5} className="mb-2">
                  💳 Validación de Pago
                </Title>
                
                {validationResults.payment.errors.length > 0 && (
                  <div className="mb-2">
                    <Text type="danger" strong>Errores:</Text>
                    <div className="space-y-1 mt-1">
                      {validationResults.payment.errors.map((error, index) => (
                        <Alert
                          key={index}
                          message={error}
                          type="error"
                          showIcon
                          size="small"
                          className="mb-1"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {validationResults.payment.warnings.length > 0 && (
                  <div className="mb-2">
                    <Text type="warning" strong>Advertencias:</Text>
                    <div className="space-y-1 mt-1">
                      {validationResults.payment.warnings.map((warning, index) => (
                        <Alert
                          key={index}
                          message={warning}
                          type="warning"
                          showIcon
                          size="small"
                          className="mb-1"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {validationResults.payment.isValid && validationResults.payment.warnings.length === 0 && (
                  <Alert
                    message="✅ Datos de pago válidos"
                    type="success"
                    showIcon
                    size="small"
                  />
                )}
              </div>
            )}

            {/* Resumen de reglas */}
            <Divider />
            <div>
              <Text type="secondary" className="text-xs">
                <strong>Reglas activas:</strong> Máx. 10 asientos por usuario, 
                Máx. 20 por transacción
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ValidationWidget;
