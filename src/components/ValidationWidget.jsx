import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../utils/antdComponents';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ShoppingOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import VisualNotifications from '../utils/VisualNotifications';

const { Text, Title } = Typography;

// ===== CONSTANTES =====
const MAX_SEATS_PER_USER = 10;
const WARNING_SEATS_THRESHOLD = 5;
const HIGH_VALUE_THRESHOLD = 1000;
const HIGH_TRANSACTION_THRESHOLD = 1000;

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
    payment: { isValid: true, errors: [], warnings: [] },
    client: { isValid: true, errors: [], warnings: [] }
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // ===== VALIDACIÓN DE ASIENTOS =====
  const validateSeats = useCallback((seats) => {
    const errors = [];
    const warnings = [];
    let totalPrice = 0;

    // Validar que hay asientos seleccionados
    if (seats.length === 0) {
      return { isValid: true, errors: [], warnings: [], totalPrice: 0 };
    }

    // Validar límite de asientos
    if (seats.length > MAX_SEATS_PER_USER) {
      errors.push(`Máximo ${MAX_SEATS_PER_USER} asientos por usuario`);
    } else if (seats.length > WARNING_SEATS_THRESHOLD) {
      warnings.push(`Has seleccionado ${seats.length} asientos`);
    }

    // Calcular precio total y validar cada asiento
    seats.forEach(seat => {
      if (seat.precio) {
        const price = parseFloat(seat.precio);
        if (!isNaN(price)) {
          totalPrice += price;
        } else {
          warnings.push(`Asiento ${seat.numero || 'desconocido'} tiene precio inválido`);
        }
      } else {
        warnings.push(`Asiento ${seat.numero || 'desconocido'} no tiene precio asignado`);
      }

      // Validar estado del asiento
      if (seat.estado === 'ocupado') {
        errors.push(`Asiento ${seat.numero || 'desconocido'} ya está ocupado`);
      } else if (seat.estado === 'reservado') {
        warnings.push(`Asiento ${seat.numero || 'desconocido'} está reservado`);
      }
    });

    // Validar precio total
    if (totalPrice > HIGH_VALUE_THRESHOLD) {
      warnings.push(`Transacción de alto valor ($${totalPrice.toFixed(2)})`);
    }

    // Validar asientos duplicados
    const seatIds = seats.map(seat => seat.id || seat._id).filter(Boolean);
    const uniqueSeatIds = [...new Set(seatIds)];
    if (uniqueSeatIds.length !== seats.length) {
      warnings.push('Posibles asientos duplicados en la selección');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalPrice: parseFloat(totalPrice.toFixed(2))
    };
  }, []);

  // ===== VALIDACIÓN DE PAGO =====
  const validatePayment = useCallback((payment) => {
    if (!payment) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    // Validar método de pago
    if (!payment.method) {
      errors.push('Método de pago requerido');
    } else if (!['tarjeta', 'efectivo', 'transferencia'].includes(payment.method)) {
      warnings.push(`Método de pago "${payment.method}" no es estándar`);
    }

    // Validar información del cliente
    if (!payment.clientId && !payment.clientName) {
      errors.push('Información del cliente requerida');
    }

    // Validar monto
    if (!payment.amount || payment.amount <= 0) {
      errors.push('Monto inválido');
    } else if (payment.amount > HIGH_TRANSACTION_THRESHOLD) {
      warnings.push(`Transacción de alto valor ($${payment.amount}), verificar documentación`);
    }

    // Validar datos de tarjeta si aplica
    if (payment.method === 'tarjeta') {
      if (!payment.cardNumber || payment.cardNumber.length < 16) {
        errors.push('Número de tarjeta inválido');
      }
      if (!payment.expiryDate) {
        errors.push('Fecha de expiración requerida');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // ===== VALIDACIÓN DE CLIENTE =====
  const validateClient = useCallback((client) => {
    if (!client) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    // Validar información básica del cliente
    if (!client.nombre && !client.email) {
      warnings.push('Cliente con información mínima');
    }

    if (client.email && !/\S+@\S+\.\S+/.test(client.email)) {
      warnings.push('Formato de email inválido');
    }

    // Validar si es cliente frecuente
    if (client.ventasPrevias && client.ventasPrevias > 5) {
      // Cliente frecuente, sin validaciones adicionales
    } else if (client.ventasPrevias === 0) {
      warnings.push('Cliente nuevo, verificar información');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // ===== EFECTO PRINCIPAL DE VALIDACIÓN =====
  useEffect(() => {
    // Validar asientos
    const seatValidation = validateSeats(selectedSeats);
    
    // Validar cliente
    const clientValidation = validateClient(selectedClient);
    
    // Validar pago
    const paymentValidation = validatePayment(paymentData);

    const newValidationResults = {
      seats: seatValidation,
      client: clientValidation,
      payment: paymentValidation
    };

    setValidationResults(newValidationResults);

    // Calcular notificaciones
    const totalErrors = seatValidation.errors.length + 
                       clientValidation.errors.length + 
                       paymentValidation.errors.length;
    const totalWarnings = seatValidation.warnings.length + 
                         clientValidation.warnings.length + 
                         paymentValidation.warnings.length;
    
    setNotificationCount(totalErrors + totalWarnings);

    // Callback para el componente padre
    if (onValidationChange) {
      const overallValidation = {
        isValid: seatValidation.isValid && clientValidation.isValid && paymentValidation.isValid,
        hasErrors: totalErrors > 0,
        hasWarnings: totalWarnings > 0,
        seatValidation,
        clientValidation,
        paymentValidation,
        totalPrice: seatValidation.totalPrice
      };
      onValidationChange(overallValidation);
    }

    // Notificaciones automáticas (solo para errores críticos)
    if (showNotifications && totalErrors > 0) {
      const firstError = [
        ...seatValidation.errors,
        ...clientValidation.errors,
        ...paymentValidation.errors
      ][0];
      
      if (firstError) {
        VisualNotifications.show('error', firstError);
      }
    }
  }, [selectedSeats, selectedClient, paymentData, validateSeats, validateClient, validatePayment, showNotifications, onValidationChange]);

  // ===== FUNCIONES DE UTILIDAD =====
  const getValidationStatus = useMemo(() => {
    const hasErrors = validationResults.seats.errors.length > 0 || 
                     validationResults.client.errors.length > 0 || 
                     validationResults.payment.errors.length > 0;
    const hasWarnings = validationResults.seats.warnings.length > 0 || 
                       validationResults.client.warnings.length > 0 || 
                       validationResults.payment.warnings.length > 0;
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  }, [validationResults]);

  const getStatusIcon = useCallback(() => {
    const status = getValidationStatus;
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  }, [getValidationStatus]);

  const getStatusColor = useCallback(() => {
    const status = getValidationStatus;
    switch (status) {
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  }, [getValidationStatus]);

  const getPositionStyle = useCallback(() => {
    const baseStyle = {
      position: 'fixed',
      zIndex: 9999,
      transition: 'all 0.3s ease'
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyle, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyle, top: '20px', left: '20px' };
      default: // bottom-right
        return { ...baseStyle, bottom: '20px', right: '20px' };
    }
  }, [position]);

  const renderValidationSection = (title, icon, validation, showPrice = false) => {
    if (!validation) return null;

    return (
      <div className="validation-section">
        <div className="flex items-center mb-2">
          {icon}
          <Title level={5} className="ml-2 mb-0">
            {title}
          </Title>
        </div>
        
        {validation.errors.length > 0 && (
          <div className="mb-3">
            <Text type="danger" strong className="text-xs">Errores:</Text>
            <div className="space-y-1 mt-1">
              {validation.errors.map((error, index) => (
                <Alert
                  key={`error-${index}`}
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

        {validation.warnings.length > 0 && (
          <div className="mb-3">
            <Text type="warning" strong className="text-xs">Advertencias:</Text>
            <div className="space-y-1 mt-1">
              {validation.warnings.map((warning, index) => (
                <Alert
                  key={`warning-${index}`}
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

        {validation.isValid && validation.warnings.length === 0 && validation.errors.length === 0 && (
          <Alert
            message="✅ Todo correcto"
            type="success"
            showIcon
            size="small"
            className="mb-3"
          />
        )}

        {showPrice && validation.totalPrice > 0 && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <div className="flex justify-between items-center">
              <Text strong className="text-green-800">Precio Total:</Text>
              <Text className="text-green-600 font-bold text-lg">
                ${validation.totalPrice.toFixed(2)}
              </Text>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDERIZADO =====
  const hasAnyData = selectedSeats.length > 0 || paymentData || selectedClient;
  
  if (!hasAnyData) {
    return null;
  }

  return (
    <div style={getPositionStyle()} className="validation-widget">
      {/* Botón principal */}
      <Tooltip 
        title={`Validación: ${getValidationStatus === 'success' ? 'Todo correcto' : 
                getValidationStatus === 'warning' ? 'Advertencias' : 'Errores encontrados'}`}
      >
        <Badge 
          count={notificationCount} 
          size="small" 
          overflowCount={9}
          style={{ backgroundColor: getStatusColor() }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={getStatusIcon()}
            onClick={() => setShowDetails(!showDetails)}
            className="shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              backgroundColor: getStatusColor(),
              borderColor: getStatusColor(),
              width: '48px',
              height: '48px'
            }}
          />
        </Badge>
      </Tooltip>

      {/* Panel de detalles */}
      {showDetails && (
        <Card
          className="mt-3 w-96 shadow-xl border border-gray-200"
          style={{ maxHeight: '80vh', overflowY: 'auto' }}
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="ml-2 font-semibold">Validación en Tiempo Real</span>
              </div>
              <Space>
                <Badge 
                  count={notificationCount} 
                  size="small" 
                  style={{ backgroundColor: getStatusColor() }}
                />
                <Button
                  size="small"
                  icon={showDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowDetails(false)}
                />
              </Space>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Resumen del estado */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold mb-2" style={{ color: getStatusColor() }}>
                {getValidationStatus === 'success' ? '✅ LISTO PARA PROCEDER' :
                 getValidationStatus === 'warning' ? '⚠️ REVISAR ADVERTENCIAS' :
                 '❌ CORREGIR ERRORES'}
              </div>
              <Progress
                percent={
                  getValidationStatus === 'success' ? 100 :
                  getValidationStatus === 'warning' ? 75 :
                  getValidationStatus === 'error' ? 25 : 0
                }
                status={getValidationStatus}
                strokeColor={getStatusColor()}
                size="small"
                showInfo={false}
              />
              <Text type="secondary" className="text-xs mt-2 block">
                {notificationCount} {notificationCount === 1 ? 'notificación' : 'notificaciones'}
              </Text>
            </div>

            <Divider className="my-2" />

            {/* Sección de asientos */}
            {selectedSeats.length > 0 && renderValidationSection(
              `Asientos (${selectedSeats.length})`,
              <ShoppingOutlined style={{ color: '#1890ff' }} />,
              validationResults.seats,
              true
            )}

            {/* Sección de cliente */}
            {selectedClient && renderValidationSection(
              'Cliente',
              <InfoCircleOutlined style={{ color: '#722ed1' }} />,
              validationResults.client
            )}

            {/* Sección de pago */}
            {paymentData && renderValidationSection(
              'Pago',
              <CreditCardOutlined style={{ color: '#52c41a' }} />,
              validationResults.payment
            )}

            {/* Reglas y límites */}
            <Divider className="my-2" />
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <Text strong className="text-blue-800 text-xs">Reglas activas:</Text>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Máximo {MAX_SEATS_PER_USER} asientos por usuario</li>
                <li>• Advertencia al seleccionar más de {WARNING_SEATS_THRESHOLD} asientos</li>
                <li>• Verificación para transacciones mayores a ${HIGH_VALUE_THRESHOLD}</li>
                <li>• Clientes nuevos requieren verificación adicional</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ValidationWidget;