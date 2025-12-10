import React, { useState, useEffect } from 'react';
import { Alert, Button, Modal } from '../utils/antdComponents';
import { ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useSeatLockStore } from './seatLockStore';

const SeatStatusNotification = () => {
  const [showExpiringWarning, setShowExpiringWarning] = useState(false);
  const [showRestoredMessage, setShowRestoredMessage] = useState(false);
  const [expiringSeats, setExpiringSeats] = useState([]);
  const { lockedSeats } = useSeatLockStore();

  useEffect(() => {
    // Verificar si hay asientos expirando
    const checkExpiringSeats = () => {
      const expiring = lockedSeats.filter(seat => seat.status === 'expirando');
      if (expiring.length > 0) {
        setExpiringSeats(expiring);
        setShowExpiringWarning(true);
      }
    };

    // Obtener configuración de notificaciones
    const enableNotifications = localStorage.getItem('seat_notifications') !== 'false';
    if (!enableNotifications) {
      return;
    }

    // Verificar cada 30 segundos
    const interval = setInterval(checkExpiringSeats, 30000);
    checkExpiringSeats(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [lockedSeats]);

  // Mostrar mensaje de restauración cuando el usuario regresa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lockedSeats.length > 0) {
        const restoredSeats = lockedSeats.filter(seat => seat.status === 'seleccionado');
        if (restoredSeats.length > 0) {
          setShowRestoredMessage(true);
          setTimeout(() => setShowRestoredMessage(false), 5000); // Ocultar después de 5 segundos
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lockedSeats]);

  const handleExtendTime = () => {
    // Aquí podrías implementar la lógica para extender el tiempo
    setShowExpiringWarning(false);
  };

  const handleProceedToPayment = () => {
    // Navegar al carrito o proceso de pago
    setShowExpiringWarning(false);
  };

  return (
    <>
      {/* Alerta de asientos expirando */}
      {showExpiringWarning && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <div>
                <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                <span className="font-semibold">¡Atención! Tus asientos están por expirar</span>
              </div>
              <Button
                type="link"
                size="small"
                onClick={() => setShowExpiringWarning(false)}
              >
                ✕
              </Button>
            </div>
          }
          description={
            <div className="mt-2">
              <p>
                Tienes {expiringSeats.length} asiento(s) que expirarán en breve.
                Para mantenerlos, completa tu compra o extiende el tiempo.
              </p>
              <div className="mt-3 space-x-2">
                <Button
                  type="primary"
                  size="small"
                  onClick={handleProceedToPayment}
                >
                  💳 Completar Compra
                </Button>
                <Button
                  size="small"
                  onClick={handleExtendTime}
                >
                  ⏰ Extender Tiempo
                </Button>
              </div>
            </div>
          }
          type="warning"
          showIcon={false}
          className="mb-4"
          closable={false}
        />
      )}

      {/* Mensaje de asientos restaurados */}
      {showRestoredMessage && (
        <Alert
          message={
            <div className="flex items-center">
              <CheckCircleOutlined className="text-green-500 mr-2" />
              <span className="font-semibold">¡Bienvenido de vuelta!</span>
            </div>
          }
          description="Tus asientos seleccionados han sido restaurados automáticamente."
          type="success"
          showIcon={false}
          className="mb-4"
          closable
          onClose={() => setShowRestoredMessage(false)}
        />
      )}

      {/* Información general de asientos */}
      {lockedSeats.length > 0 && !showExpiringWarning && (
        <Alert
          message={
            <div className="flex items-center">
              <ClockCircleOutlined className="text-blue-500 mr-2" />
              <span className="font-semibold">Asientos Seleccionados</span>
            </div>
          }
          description={`Tienes ${lockedSeats.length} asiento(s) seleccionado(s). Los asientos se liberan automáticamente si no completas la compra.`}
          type="info"
          showIcon={false}
          className="mb-4"
          closable
        />
      )}
    </>
  );
};

export default SeatStatusNotification;

