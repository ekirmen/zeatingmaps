import React, { useState, useEffect, useCallback } from 'react';
import { 
  Alert, 
  notification, 
  Badge, 
  Tooltip, 
  Button, 
  Space, 
  Typography,
  Card,
  Tag,
  Progress,
  Divider
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

// ===== SISTEMA DE NOTIFICACIONES VISUALES =====
const VisualNotifications = {
  types: {
    seatSelected: { 
      type: 'success', 
      message: 'Asiento seleccionado', 
      icon: '✅',
      color: '#52c41a',
      duration: 2000
    },
    seatReserved: { 
      type: 'warning', 
      message: 'Asiento reservado temporalmente', 
      icon: '⏰',
      color: '#faad14',
      duration: 5000
    },
    purchaseComplete: { 
      type: 'success', 
      message: 'Compra realizada exitosamente', 
      icon: '🎉',
      color: '#52c41a',
      duration: 3000
    },
    error: { 
      type: 'error', 
      message: 'Error en la transacción', 
      icon: '❌',
      color: '#ff4d4f',
      duration: 4000
    },
    validationWarning: {
      type: 'warning',
      message: 'Advertencia de validación',
      icon: '⚠️',
      color: '#faad14',
      duration: 3000
    },
    seatLimit: {
      type: 'info',
      message: 'Límite de asientos alcanzado',
      icon: 'ℹ️',
      color: '#1890ff',
      duration: 3000
    }
  },

  show: (type, customMessage = null) => {
    const notificationConfig = VisualNotifications.types[type];
    if (!notificationConfig) return;

    notification[notificationConfig.type]({
      message: customMessage || notificationConfig.message,
      description: `Notificación del sistema de tickera`,
      icon: <span style={{ fontSize: '16px' }}>{notificationConfig.icon}</span>,
      duration: notificationConfig.duration,
      placement: 'topRight',
      style: {
        borderLeft: `4px solid ${notificationConfig.color}`,
        borderRadius: '8px'
      }
    });
  }
};

// ===== SISTEMA DE VALIDACIONES EN TIEMPO REAL =====
const RealTimeValidation = {
  rules: {
    maxSeatsPerUser: 10,
    maxSeatsPerTransaction: 20,
    minTimeBetweenReservations: 300000, // 5 minutos
    maxReservationTime: 900000, // 15 minutos
    requireClientInfo: true,
    requirePaymentMethod: true,
    maxPricePerTransaction: 5000, // $5000
    allowConsecutiveSeats: true,
    maxGapBetweenSeats: 3
  },

  validateSeatSelection: (seats, userId, eventId, currentSeats = []) => {
    const errors = [];
    const warnings = [];
    
    // Validar límite de asientos por usuario
    if (seats.length > RealTimeValidation.rules.maxSeatsPerUser) {
      errors.push(`Máximo ${RealTimeValidation.rules.maxSeatsPerUser} asientos por usuario`);
    }
    
    // Validar límite de asientos por transacción
    if (seats.length > RealTimeValidation.rules.maxSeatsPerTransaction) {
      errors.push(`Máximo ${RealTimeValidation.rules.maxSeatsPerTransaction} asientos por transacción`);
    }
    
    // Validar que no haya asientos duplicados
    const seatIds = seats.map(s => s._id);
    if (new Set(seatIds).size !== seatIds.length) {
      errors.push('No se pueden seleccionar asientos duplicados');
    }
    
    // Validar asientos consecutivos si está habilitado
    if (RealTimeValidation.rules.allowConsecutiveSeats && seats.length > 1) {
      const sortedSeats = seats.sort((a, b) => {
        const rowA = a.nombre?.match(/^[A-Z]+/)?.[0] || '';
        const rowB = b.nombre?.match(/^[A-Z]+/)?.[0] || '';
        if (rowA !== rowB) return rowA.localeCompare(rowB);
        
        const numA = parseInt(a.nombre?.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.nombre?.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
      
      for (let i = 1; i < sortedSeats.length; i++) {
        const prevSeat = sortedSeats[i - 1];
        const currSeat = sortedSeats[i];
        
        const prevRow = prevSeat.nombre?.match(/^[A-Z]+/)?.[0] || '';
        const currRow = currSeat.nombre?.match(/^[A-Z]+/)?.[0] || '';
        
        if (prevRow === currRow) {
          const prevNum = parseInt(prevSeat.nombre?.match(/\d+/)?.[0] || '0');
          const currNum = parseInt(currSeat.nombre?.match(/\d+/)?.[0] || '0');
          const gap = currNum - prevNum;
          
          if (gap > RealTimeValidation.rules.maxGapBetweenSeats) {
            warnings.push(`Gap grande entre asientos: ${prevSeat.nombre} y ${currSeat.nombre}`);
          }
        }
      }
    }
    
    // Validar precio total
    const totalPrice = (seats && Array.isArray(seats) ? seats.reduce((sum, seat) => sum + (seat.precio || 0), 0) : 0);
    if (totalPrice > RealTimeValidation.rules.maxPricePerTransaction) {
      warnings.push(`Precio total alto: $${totalPrice.toFixed(2)}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalPrice
    };
  },

  validatePayment: (paymentData) => {
    const errors = [];
    const warnings = [];
    
    if (RealTimeValidation.rules.requirePaymentMethod && !paymentData.method) {
      errors.push('Método de pago requerido');
    }
    
    if (RealTimeValidation.rules.requireClientInfo && !paymentData.clientId) {
      errors.push('Información del cliente requerida');
    }
    
    if (paymentData.amount <= 0) {
      errors.push('Monto inválido');
    }
    
    if (paymentData.amount > 1000) {
      warnings.push('Transacción de alto valor, verificar documentación');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// ===== COMPONENTE PRINCIPAL =====
const RealTimeValidationComponent = ({ 
  selectedSeats = [], 
  selectedClient, 
  paymentData,
  onValidationChange,
  showNotifications = true
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

    const seatValidation = RealTimeValidation.validateSeatSelection(
      selectedSeats, 
      selectedClient?.id, 
      'current-event'
    );

    setValidationResults(prev => ({
      ...prev,
      seats: seatValidation
    }));

    // Notificaciones automáticas
    if (showNotifications) {
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

    const paymentValidation = RealTimeValidation.validatePayment(paymentData);
    
    setValidationResults(prev => ({
      ...prev,
      payment: paymentValidation
    }));

    // Notificaciones automáticas
    if (showNotifications) {
      if (paymentValidation.errors.length > 0) {
        VisualNotifications.show('error', paymentValidation.errors[0]);
        setNotificationCount(prev => prev + 1);
      } else if (paymentValidation.warnings.length > 0) {
        VisualNotifications.show('validationWarning', paymentValidation.warnings[0]);
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

  // ===== RENDERIZADO =====
  if (selectedSeats.length === 0 && !paymentData) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
                <strong>Reglas activas:</strong> Máx. {RealTimeValidation.rules.maxSeatsPerUser} asientos por usuario, 
                Máx. {RealTimeValidation.rules.maxSeatsPerTransaction} por transacción
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ===== EXPORTAR FUNCIONES UTILITARIAS =====
export { VisualNotifications, RealTimeValidation };
export default RealTimeValidationComponent;
