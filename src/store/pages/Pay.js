import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal, Form, Input } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentMethods, validatePaymentMethodConfig } from '../services/paymentMethodsService';
import { processPaymentMethod } from '../services/paymentMethodsProcessor';
import { createPaymentSuccessNotification } from '../services/paymentNotifications';
import atomicSeatLockService from '../../services/atomicSeatLock';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useSeatLockStore } from '../../components/seatLockStore';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent } from '../services/facebookPixelService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { resolveTenantId } from '../../utils/tenantUtils';
import { verificarPagosPlazosActivos, calcularCuotas } from '../../services/cuotasPagosService';
import InstallmentPaymentSelector from '../../components/InstallmentPaymentSelector';
import logger from '../../utils/logger';
import auditService from '../../services/auditService';
import { encryptPaymentData } from '../../utils/encryption';
import { sendPaymentEmailByStatus } from '../services/paymentEmailService';
import { supabase } from '../../supabaseClient';


const Pay = () => {
  // Debug log removed for production performance

  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  // useCartStore almacena los asientos seleccionados en la propiedad `items`
  // En algunos contextos `cart` no existe y producía `undefined`, generando
  // errores al intentar usar `reduce`. Se usa `items` y se asegura un arreglo.
  const { items: cartItems, clearCart, functionId } = useCartStore();
  const { handleError, showSuccess } = useErrorHandler();

  const normalizeAmount = (value) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return Number.isFinite(value) ? value : 0;
  };

  const formatCurrency = (value) => normalizeAmount(value).toFixed(2);

  // Usar seatLockStore para sincronización en tiempo real
  const { lockedSeats, subscribeToFunction, unsubscribe } = useSeatLockStore();
  const total = (cartItems || []).reduce(
    (sum, item) => sum + normalizeAmount(item.precio),
    0
  );
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [facebookPixel, setFacebookPixel] = useState(null);
  const [pricesWithFees] = useState({});
  const [pagosPlazosActivos, setPagosPlazosActivos] = useState(null);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(0); // 0 = todas, 1, 2, 3 = número de cuotas
  const [cuotasCalculadas, setCuotasCalculadas] = useState([]);
  const [buyerConfigLoading, setBuyerConfigLoading] = useState(false);
  const [buyerInfoConfig, setBuyerInfoConfig] = useState({ mostrar: false, campos: {} });
  const [buyerInfoData, setBuyerInfoData] = useState({});
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [buyerInfoCompleted, setBuyerInfoCompleted] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('store:open-account-modal', {
          detail: { mode: 'login', source: 'pay', redirectTo: '/store/payment' }
        })
      );
    }
  }, [user]);

  useEffect(() => {
    // Debug log removed for production performance

    const loadGateways = async () => {
      try {
        setLoadingMethods(true);
        logger.log('🛒 [PAY] Cargando métodos de pago...');

        // Obtener el ID del evento del primer item del carrito
        const eventId = cartItems?.[0]?.eventId || null;
        logger.log('🎫 [PAY] Event ID del carrito:', eventId);

        const methods = await getActivePaymentMethods(null, eventId);
        logger.log('📋 [PAY] Métodos obtenidos de la BD:', methods);

        const validMethods = methods.filter(method => {
          const validation = validatePaymentMethodConfig(method);
          logger.log(`🔍 [PAY] Validando ${method.method_id}:`, validation);
          return validation.valid;
        });

        logger.log('✅ [PAY] Métodos válidos después del filtro:', validMethods);
        setAvailableMethods(validMethods);

        // Por ahora, no calculamos comisiones específicas
        // Esto se puede implementar más tarde usando la tabla comisiones_tasas
      } catch (error) {
        logger.error('❌ [PAY] Error loading payment gateways:', error);
        message.error('Error al cargar métodos de pago');
      } finally {
        setLoadingMethods(false);
      }
    };
    const loadFacebookPixel = async () => {
      try {
        if (cartItems && cartItems.length > 0) {
          // Obtener el píxel del primer evento en el carrito
          const firstEventId = cartItems[0]?.eventId;
          if (firstEventId) {
            const pixel = await getFacebookPixelByEvent(firstEventId);
            setFacebookPixel(pixel);
          }
        }
      } catch (error) {
        logger.error('Error loading Facebook pixel:', error);
      }
    };

    // Only load data if user is authenticated
    if (user) {
      loadGateways();
      loadFacebookPixel();
    } else {
    }
  }, [cartItems, total, user]);

  // Verificar pagos a plazos activos
  useEffect(() => {
    const verificarPlazos = async () => {
      if (functionId) {
        try {
          const info = await verificarPagosPlazosActivos(functionId);
          setPagosPlazosActivos(info);
          if (info.activo) {
            const cuotas = calcularCuotas(total, info.cantidadCuotas);
            setCuotasCalculadas(cuotas);
            setCuotasSeleccionadas(0); // Por defecto, todas las cuotas
          }
        } catch (error) {
          console.error('Error verificando pagos a plazos:', error);
          setPagosPlazosActivos({ activo: false });
        }
      } else {
        setPagosPlazosActivos({ activo: false });
      }
    };

    verificarPlazos();
  }, [functionId, total]);

  // Suscribirse a cambios de bloqueo de asientos en tiempo real
  useEffect(() => {
    if (functionId) {
      subscribeToFunction(functionId);
    }

    return () => {
      unsubscribe();
    };
  }, [functionId, subscribeToFunction, unsubscribe]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedGateway(method);
  };

  const buyerLabels = {
    nombre: 'Nombre',
    email: 'Email',
    telefono: 'Teléfono',
    rut: 'RUT',
    numeroIdentificacionFiscal: 'Número de identificación fiscal',
    direccion: 'Dirección / C.P.',
    nombreFonetico: 'Nombre fonético',
    apellidosFoneticos: 'Apellidos fonéticos',
    idioma: 'Idioma',
    fechaNacimiento: 'Fecha de nacimiento',
    sexo: 'Sexo',
    empresa: 'Empresa',
    departamento: 'Departamento',
    cargoEmpresa: 'Cargo en la empresa',
    matricula: 'Matrícula',
    twitter: 'Twitter',
    facebook: 'Facebook',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    instagram: 'Instagram',
    contactoEmergencia: 'Contacto de emergencia',
    nacionalidad: 'Nacionalidad'
  };

  const parseJsonField = (field) => {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (error) {
      return null;
    }
  };

  const getCartEventId = useMemo(() => {
    return cartItems?.[0]?.eventId || cartItems?.[0]?.eventoId || null;
  }, [cartItems]);

  const getBuyerStorageKey = (eventId) => {
    if (!eventId || typeof window === 'undefined') return null;
    return `buyerInfo:${eventId}:${user?.id || 'anon'}`;
  };

  const loadStoredBuyerInfo = (eventId) => {
    const key = getBuyerStorageKey(eventId);
    if (!key) return null;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  };

  const shouldAskBuyerInfo = (mostrar, campos, storedData) => {
    if (!mostrar) return false;

    const requestedEntries = Object.entries(campos || {}).filter(([, cfg]) => cfg?.solicitado);
    if (requestedEntries.length === 0) return false;

    const requiredEntries = requestedEntries.filter(([, cfg]) => cfg?.obligatorio);
    const hasRequiredFields = requiredEntries.length > 0;

    const isRequiredFieldMissing = (data) =>
      requiredEntries.some(([key]) => {
        const value = data?.[key];
        return value == null || String(value).trim() === '';
      });

    if (storedData?.__completed) {
      return hasRequiredFields ? isRequiredFieldMissing(storedData) : false;
    }

    // Si hay campos solicitados pero ninguno obligatorio, mostrar una vez para permitir completarlos
    if (!hasRequiredFields) return !storedData;

    return true;
  };

  useEffect(() => {
    const loadBuyerConfig = async () => {
      if (!getCartEventId) return;

      setBuyerConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('id, mostrarDatosComprador, datosComprador')
          .eq('id', getCartEventId)
          .single();

        if (error || !data) {
          setBuyerInfoCompleted(true);
          return;
        }

        const parsedConfig = parseJsonField(data.datosComprador) || {};
        const hasRequestedBuyerFields = Object.values(parsedConfig || {}).some(cfg => cfg?.solicitado);

        const mostrarConfigurado = typeof data.mostrarDatosComprador === 'string'
          ? data.mostrarDatosComprador === 'true'
          : !!data.mostrarDatosComprador;

        const shouldShowBuyerData = mostrarConfigurado || hasRequestedBuyerFields;
        const stored = loadStoredBuyerInfo(data.id);
        const defaultData = {
          nombre: user?.user_metadata?.nombre || user?.user_metadata?.name || '',
          email: user?.email || user?.user_metadata?.email || '',
          telefono: user?.user_metadata?.telefono || user?.user_metadata?.phone || '',
          direccion: user?.user_metadata?.direccion || '',
          rut: user?.user_metadata?.rut || ''
        };

        setBuyerInfoConfig({ mostrar: shouldShowBuyerData, campos: parsedConfig });
        setBuyerInfoData({ ...defaultData, ...(stored || {}) });

        const needsInfo = shouldAskBuyerInfo(shouldShowBuyerData, parsedConfig, stored);
        setBuyerInfoCompleted(!needsInfo);
        setBuyerModalVisible(needsInfo);
      } catch (configError) {
        setBuyerInfoCompleted(true);
      } finally {
        setBuyerConfigLoading(false);
      }
    };

    loadBuyerConfig();
  }, [getCartEventId, user]);

  const persistBuyerInfo = (eventId, dataToSave) => {
    const key = getBuyerStorageKey(eventId);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({ ...dataToSave, __completed: true, savedAt: new Date().toISOString() }));
    } catch (error) {
    }
  };

  const handleBuyerInfoSubmit = () => {
    const campos = buyerInfoConfig.campos || {};
    const requestedEntries = Object.entries(campos).filter(([, cfg]) => cfg?.solicitado);
    const requiredEntries = requestedEntries.filter(([, cfg]) => cfg?.obligatorio);

    const missing = requiredEntries.filter(([key]) => {
      const value = buyerInfoData?.[key];
      return !value || String(value).trim() === '';
    });

    if (missing.length > 0) {
      const labels = missing.map(([key]) => buyerLabels[key] || key).join(', ');
      message.error(`Completa todos los datos del comprador antes de continuar: ${labels}`);
      return;
    }

    persistBuyerInfo(getCartEventId, buyerInfoData);
    setBuyerInfoData((prev) => ({ ...prev, __completed: true }));
    setBuyerInfoCompleted(true);
    setBuyerModalVisible(false);

    if (pendingPayment) {
      setPendingPayment(false);
      setTimeout(() => handleProcessPayment(), 0);
    }
  };

  const handleBuyerFieldChange = (key, value) => {
    setBuyerInfoData((prev) => ({ ...prev, [key]: value }));
  };

  const handleBuyerModalClose = () => {
    setBuyerModalVisible(false);
    setPendingPayment(false);
  };

  const requestedBuyerFields = useMemo(() => {
    if (!buyerInfoConfig.mostrar) return [];
    return Object.entries(buyerInfoConfig.campos || {}).filter(([, cfg]) => cfg?.solicitado);
  }, [buyerInfoConfig]);

  const handleProcessPayment = async () => {
    if (buyerConfigLoading) {
      message.loading('Cargando información del comprador...');
      return;
    }

    if (!buyerInfoCompleted && shouldAskBuyerInfo(buyerInfoConfig.mostrar, buyerInfoConfig.campos, buyerInfoData)) {
      setBuyerModalVisible(true);
      setPendingPayment(true);
      message.info('Por favor completa los datos del comprador para continuar.');
      return;
    }

    // Validaciones robustas antes de procesar el pago
    if (!selectedGateway) {
      message.error('Por favor selecciona un método de pago');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      message.error('No hay asientos seleccionados para procesar');
      return;
    }

    // Validar que todos los asientos sigan disponibles
    try {
      const unavailableSeats = [];
      const invalidSeats = [];
      for (const item of cartItems) {
        const seatId = item.sillaId || item.id || item._id;
        const funcionId = functionId || item.functionId || item.funcionId;

        // Si no hay IDs consistentes, avisar al cliente que el asiento ya no está disponible
        if (!seatId || !funcionId) {
          invalidSeats.push(item.nombre || seatId || 'Asiento sin ID');
          continue;
        }

        // Detectar asientos que ya fueron marcados como vendidos/reservados por otro flujo
        const lockForSeat = lockedSeats.find(lock =>
          String(lock.seat_id) === String(seatId) &&
          String(lock.funcion_id) === String(funcionId) &&
          ['vendido', 'pagado', 'reservado', 'locked'].includes(lock.status)
        );

        if (lockForSeat) {
          unavailableSeats.push(item.nombre || seatId);
          continue;
        }

        if (seatId && funcionId) {
          // Verificar si el asiento está bloqueado por otro usuario
          const isLockedByOther = lockedSeats.some(lock =>
            lock.seat_id === seatId &&
            lock.funcion_id === funcionId &&
            lock.session_id !== localStorage.getItem('anonSessionId')
          );

          if (isLockedByOther) {
            unavailableSeats.push(item.nombre || seatId);
            continue;
          }

          // Verificar disponibilidad usando el servicio atómico como respaldo
          // Pasar el session_id para que solo verifique locks de otros usuarios
          const currentSessionId = localStorage.getItem('anonSessionId');
          const isAvailable = await atomicSeatLockService.isSeatAvailable(seatId, funcionId, currentSessionId);
          if (!isAvailable) {
            unavailableSeats.push(item.nombre || seatId);
          }
        }
      }

      const seatsWithIssues = [...invalidSeats, ...unavailableSeats];

      if (seatsWithIssues.length > 0) {
        message.error(`Uno o más asientos ya no están disponibles o fueron modificados: ${seatsWithIssues.join(', ')}. Por favor, selecciona otros asientos para continuar.`);
        return;
      }
    } catch (error) {
      console.error('Error validando disponibilidad de asientos:', error);
      message.error('Error validando disponibilidad de asientos. Por favor, inténtalo de nuevo.');
      return;
    }

    // Declarar variables fuera del try para que estén disponibles en el catch
    let paymentData = null;
    let resolvedTenantId = null;

    try {
      setProcessingPayment(true);

      // Generar locator simple de 8 caracteres (números y letras)
      const { generateSimpleLocator } = await import('../../utils/generateLocator');
      const locator = generateSimpleLocator();

      let seatSessionId = null;
      if (typeof window !== 'undefined') {
        try {
          seatSessionId =
            window.localStorage?.getItem('anonSessionId') ||
            window.sessionStorage?.getItem('anonSessionId') ||
            null;
        } catch (sessionError) {
        }
      }

      const tenantCandidates = [
        currentTenant?.id,
        selectedGateway?.tenant_id,
        selectedGateway?.tenantId,
        cartItems?.[0]?.tenant_id,
        cartItems?.[0]?.tenantId,
        cartItems?.[0]?.tenant?.id,
      ].filter(Boolean);

      resolvedTenantId = resolveTenantId(tenantCandidates[0]);

      // Obtener evento_id desde múltiples fuentes
      let eventoId = cartItems?.[0]?.eventId || cartItems?.[0]?.eventoId || null;

      // Si no hay evento_id en el carrito pero sí hay funcion_id, obtenerlo desde la función
      if (!eventoId && functionId) {
        try {
          const { supabase } = await import('../../supabaseClient');
          const { data: funcionData, error: funcionError } = await supabase
            .from('funciones')
            .select('evento_id')
            .eq('id', functionId)
            .single();

          if (!funcionError && funcionData) {
            eventoId = funcionData.evento_id || null;
          } else {
            if (funcionError) {
            }
          }
        } catch (error) {
        }
      }

      // Calcular el monto a pagar según las cuotas seleccionadas
      let montoAPagar = total;
      if (pagosPlazosActivos?.activo && cuotasSeleccionadas > 0 && cuotasCalculadas.length > 0) {
        // Si se seleccionaron cuotas específicas (1, 2, 3), usar el monto de esas cuotas
        montoAPagar = cuotasCalculadas.slice(0, cuotasSeleccionadas).reduce((sum, c) => sum + c.monto, 0);
        });
      } else if (pagosPlazosActivos?.activo && cuotasSeleccionadas === 0) {
        // Si se seleccionó 0 (todas las cuotas), pagar el total completo
        montoAPagar = total;
      }

      // Preparar metadata para pagos a plazos
      const metadata = {};
      if (pagosPlazosActivos?.activo && cuotasCalculadas.length > 0) {
        // Si cuotasSeleccionadas es 0, significa que se pagaron TODAS las cuotas
        const cuotasPagadas = cuotasSeleccionadas === 0 ? pagosPlazosActivos.cantidadCuotas : cuotasSeleccionadas;

        metadata.pagos_plazos = {
          cantidad_cuotas_total: pagosPlazosActivos.cantidadCuotas,
          cuotas_pagadas: cuotasPagadas,
          cuotas_pendientes: pagosPlazosActivos.cantidadCuotas - cuotasPagadas,
          monto_total: total,
          monto_pagado: montoAPagar,
          monto_pendiente: total - montoAPagar,
          dias_entre_pagos: pagosPlazosActivos.diasEntrePagos
        };
      }

      const buyerInfoForPayment = (() => {
        if (!buyerInfoConfig.mostrar) return null;
        if (!requestedBuyerFields.length) return null;
        const payload = {};
        requestedBuyerFields.forEach(([key]) => {
          if (buyerInfoData?.[key]) {
            payload[key] = buyerInfoData[key];
          }
        });
        return Object.keys(payload).length > 0 ? payload : null;
      })();

      paymentData = {
        orderId: locator,
        amount: montoAPagar,
        currency: 'USD',
        items: cartItems,
        locator: locator,
        userId: user?.id || null,
        user: {
          id: user?.id || null,
          email: user?.email || null
        },
        sessionId: seatSessionId,
        tenant: {
          id: resolvedTenantId
        },
        funcion: {
          id: functionId || null
        },
        evento: {
          id: eventoId
        },
        eventoId: eventoId, // También pasar directamente como eventoId
        eventId: eventoId,   // Y como eventId para compatibilidad
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        buyerInfo: buyerInfoForPayment || undefined
      };

      // Encriptar datos sensibles de pago antes de enviarlos
      const encryptedPaymentData = await encryptPaymentData(paymentData).catch(err => {
        return paymentData; // Continuar sin encriptar si falla
      });

      // Registrar inicio de transacción en auditoría
      auditService.logPayment('initiated', {
        ...paymentData,
        gateway: selectedGateway?.method_id || selectedGateway?.id,
        paymentMethod: selectedGateway?.name
      }, {
        tenantId: resolvedTenantId,
        severity: 'info'
      }).catch(err => console.error('Error logging payment initiation:', err));

      const result = await processPaymentMethod(selectedGateway, encryptedPaymentData);
      if (result.success) {
        // Determinar el status real de la transacción
        const transactionStatus = result.status || 'completed';
        const isReservation = transactionStatus === 'reservado' || transactionStatus === 'reserved' || transactionStatus === 'pending';

        // Registrar pago exitoso en auditoría
        auditService.logPayment('completed', {
          ...paymentData,
          transactionId: result.transactionId,
          gateway: selectedGateway?.method_id || selectedGateway?.id,
          paymentMethod: selectedGateway?.name,
          status: transactionStatus
        }, {
          tenantId: resolvedTenantId,
          resourceId: result.transactionId,
          severity: 'info'
        }).catch(err => console.error('Error logging payment success:', err));

        // Enviar notificación de éxito
        await createPaymentSuccessNotification({
          id: result.transactionId,
          amount: montoAPagar,
          gateway_id: selectedGateway.method_id,
          user_id: user?.id || null,
          tenant_id: resolvedTenantId,
          user: user
            ? {
                ...user,
                phone:
                  user.phone ||
                  user.user_metadata?.phone ||
                  user.user_metadata?.telefono ||
                  null
              }
            : null,
          tenant: resolvedTenantId
            ? { ...(currentTenant || {}), id: resolvedTenantId }
            : currentTenant
        });

        // Enviar correo automáticamente según el status
        if (result.locator && user?.id) {
          try {
            const emailResult = await sendPaymentEmailByStatus({
              locator: result.locator,
              user_id: user.id,
              status: transactionStatus,
              transactionId: result.transactionId,
              amount: montoAPagar,
            });

            if (emailResult.success) {
            } else {
            }
          } catch (emailError) {
            console.error('❌ [PAY] Error enviando correo:', emailError);
            // No bloquear el flujo si falla el envío de correo
          }
        }

        // Limpiar carrito (sin intentar desbloquear asientos ya vendidos)
        clearCart(true);

        // Redirigir según el tipo de pago
        if (result.requiresRedirect) {
          window.location.href = result.approvalUrl;
        } else if (result.requiresAction) {
          // Para Stripe, mostrar formulario de tarjeta
          navigate('/store/payment-confirm', { state: { result } });
        } else if (result.requiresManualConfirmation) {
          // Para transferencias, mostrar información
          navigate('/store/payment-manual', { state: { result } });
        } else {
          navigate('/store/payment-success', { state: { result, locator: result.locator } });
        }
      } else {
        // Registrar pago fallido en auditoría
        auditService.logPayment('failed', {
          ...paymentData,
          error: result.error || 'Payment failed',
          gateway: selectedGateway?.method_id || selectedGateway?.id,
          paymentMethod: selectedGateway?.name,
          status: 'failed'
        }, {
          tenantId: resolvedTenantId,
          severity: 'error'
        }).catch(err => console.error('Error logging payment failure:', err));

        message.error(result.error || 'Error al procesar el pago. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);

      // Registrar error de pago en auditoría solo si tenemos los datos necesarios
      if (paymentData || resolvedTenantId) {
        auditService.logPayment('error', {
          ...(paymentData || {}),
          error: error.message || 'Unknown error',
          gateway: selectedGateway?.method_id || selectedGateway?.id,
          paymentMethod: selectedGateway?.name,
          status: 'error'
        }, {
          tenantId: resolvedTenantId || null,
          severity: 'error'
        }).catch(err => console.error('Error logging payment error:', err));
      }

      // Usar el hook de manejo de errores
      const errorResult = handleError(error, 'payment', { clearCart });

      // Limpiar carrito si es necesario
      if (errorResult.shouldClearCart) {
        clearCart();
      }
    } finally {
      setProcessingPayment(false);
    }
  };


  const getMethodIcon = (methodId) => {
    const icons = {
      stripe: <CreditCardOutlined style={{ color: '#6772e5' }} />,
      paypal: <DollarOutlined style={{ color: '#0070ba' }} />,
      cashea: <CreditCardOutlined style={{ color: '#111827' }} />,
      apple_pay: <CreditCardOutlined style={{ color: '#000000' }} />,
      google_pay: <CreditCardOutlined style={{ color: '#4285f4' }} />,
      transferencia: <BankOutlined style={{ color: '#52c41a' }} />,
      pago_movil: <MobileOutlined style={{ color: '#1890ff' }} />,
      efectivo_tienda: <DollarOutlined style={{ color: '#fa8c16' }} />,
      efectivo: <DollarOutlined style={{ color: '#fa8c16' }} />
    };
    return icons[methodId] || <DollarOutlined />;
  };

  const getMethodName = (methodId) => {
    const names = {
      stripe: 'Stripe',
      paypal: 'PayPal',
      cashea: 'Cashea',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
      transferencia: 'Transferencia Bancaria',
      pago_movil: 'Pago Móvil',
      efectivo_tienda: 'Pago en Efectivo en Tienda',
      efectivo: 'Efectivo'
    };
    return names[methodId] || methodId;
  };

  const getMethodDescription = (methodId) => {
    const descriptions = {
      stripe: 'Tarjetas de crédito y débito',
      paypal: 'Pagos a través de PayPal',
      cashea: 'Compra ahora y paga después con Cashea',
      apple_pay: 'Pagos para usuarios iOS',
      google_pay: 'Pagos para usuarios Android',
      transferencia: 'Transferencias bancarias directas',
      pago_movil: 'Pagos móviles (MercadoPago, etc.)',
      efectivo_tienda: 'Pagos en efectivo en tienda física',
      efectivo: 'Pagos en efectivo'
    };
    return descriptions[methodId] || 'Método de pago';
  };



  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="store-text-center">
          <h2 className="store-text-2xl store-font-bold store-text-gray-900 mb-4">Carrito Vacío</h2>
          <p className="store-text-gray-600 mb-6">No hay productos en tu carrito</p>
          <button onClick={() => navigate('/store')} className="store-button store-button-primary">
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 md:py-8 store-payment-page" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Modal
        open={buyerModalVisible}
        title="Datos del Comprador"
        onOk={handleBuyerInfoSubmit}
        onCancel={handleBuyerModalClose}
        okText="Guardar y continuar"
        cancelText="Cancelar"
        maskClosable={false}
        destroyOnClose
      >
        <p className="store-text-sm text-gray-700 mb-3">
          Completa la información solicitada por el organizador. Solo se pedirá una vez por evento.
        </p>
        <Form layout="vertical">
          {requestedBuyerFields.map(([key, cfg]) => (
            <Form.Item
              key={key}
              label={buyerLabels[key] || key}
              required={!!cfg?.obligatorio}
            >
              <Input
                value={buyerInfoData?.[key] || ''}
                onChange={(e) => handleBuyerFieldChange(key, e.target.value)}
                placeholder={`Ingresa ${buyerLabels[key] || key}`}
              />
            </Form.Item>
          ))}
          {requestedBuyerFields.length === 0 && (
            <div className="text-sm text-gray-600">No hay campos configurados para solicitar.</div>
          )}
        </Form>
      </Modal>
      {facebookPixel && (
        <FacebookPixel
          pixelId={facebookPixel}
          eventData={{
            content_name: cartItems.map(item => item.nombreEvento).join(', '),
            content_category: 'Eventos',
            content_ids: cartItems.map(item => item.eventId),
            value: total,
            currency: 'USD',
            num_items: cartItems ? cartItems.length : 0
          }}
        />
      )}
      <div className="store-container">
        <div className="store-container-sm mx-auto">
          <div className="store-card">
            {/* Header */}
            <div className="store-card-header" style={{ background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)', color: 'white' }}>
              <h1 className="store-text-xl md:store-text-2xl store-font-bold">Finalizar Compra</h1>
              <p className="store-text-xs md:store-text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Selecciona tu método de pago</p>
            </div>

            <div className="store-card-body">
              <div className="store-grid store-grid-auto">
                {/* Métodos de Pago */}
                <div className="store-space-y-4 md:store-space-y-6">
                  <h2 className="store-text-lg md:store-text-xl store-font-semibold">Métodos de Pago</h2>

                  {loadingMethods ? (
                    <div className="store-text-center py-8">
                      <div className="store-loading"></div>
                      <p className="mt-4 store-text-gray-600">Cargando métodos de pago...</p>
                    </div>
                  ) : availableMethods.length === 0 ? (
                    <div className="store-alert store-alert-warning">
                      <div>
                        <h4 className="store-font-semibold">No hay métodos de pago disponibles</h4>
                        <p className="store-text-sm">Por favor, contacta al administrador para configurar los métodos de pago.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="store-space-y-4">
                      {availableMethods.map((method) => {
                        const isSelected = selectedGateway?.method_id === method.method_id;

                        return (
                          <div
                            key={method.method_id}
                            className={`store-payment-method ${isSelected ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect(method)}
                          >
                            <div className="store-payment-method-icon">
                              {getMethodIcon(method.method_id)}
                            </div>
                            <div className="store-payment-method-info">
                              <div className="store-payment-method-name">{getMethodName(method.method_id)}</div>
                              <div className="store-payment-method-description">
                                {getMethodDescription(method.method_id)}
                              </div>
                            </div>
                            <div className="store-text-lg store-font-semibold store-text-primary">
                              ${formatCurrency(total)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resumen de Compra */}
                <div className="store-card">
                  <div className="store-card-header">
                    <h3 className="store-text-base md:store-text-lg store-font-semibold">Resumen de Compra</h3>
                  </div>
                  <div className="store-card-body">
                    <div className="store-space-y-3">
                      {/* Información de zona y asientos */}
                      <div className="bg-blue-50 p-2 md:p-3 rounded-lg mb-3 md:mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 store-text-sm md:store-text-base">Asientos Seleccionados</h4>
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between store-text-xs md:store-text-sm mb-1 gap-1">
                            <span className="text-blue-800 break-words">
                              {item.zonaNombre || 'Zona'} - {item.nombreAsiento || `Asiento ${index + 1}`}
                            </span>
                            <span className="font-medium">${formatCurrency(item.precio)}</span>
                          </div>
                        ))}
                      </div>

                      {cartItems.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between store-text-xs md:store-text-sm gap-1">
                          <span className="break-words">{item.nombreEvento}</span>
                          <span>${formatCurrency(item.precio)}</span>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 pt-3"></div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center store-text-base md:store-text-lg store-font-bold gap-2">
                        <span>Total</span>
                        <span>${formatCurrency(total)}</span>
                      </div>

                      {/* Opciones de Pagos a Plazos - Componente Mejorado */}
                      {pagosPlazosActivos?.activo && cuotasCalculadas.length > 0 && (
                        <InstallmentPaymentSelector
                          total={total}
                          cantidadCuotas={pagosPlazosActivos.cantidadCuotas}
                          diasEntrePagos={pagosPlazosActivos.diasEntrePagos}
                          cuotasCalculadas={cuotasCalculadas}
                          cuotasSeleccionadas={cuotasSeleccionadas}
                          onCuotasChange={setCuotasSeleccionadas}
                          fechaInicio={pagosPlazosActivos.fechaInicio}
                          fechaFin={pagosPlazosActivos.fechaFin}
                          disabled={processingPayment}
                        />
                      )}
                      {/* Código anterior comentado para referencia
                      {pagosPlazosActivos?.activo && cuotasCalculadas.length > 0 && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="store-text-sm md:store-text-base store-font-semibold mb-3">Pago a Plazos Disponible</h4>
                          <div className="space-y-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="store-text-xs md:store-text-sm text-blue-800 mb-2">
                                Puedes pagar en {pagosPlazosActivos.cantidadCuotas} cuotas de ${formatCurrency(total / pagosPlazosActivos.cantidadCuotas)} cada una
                              </p>
                              <div className="space-y-2">
                                <label className="block store-text-xs md:store-text-sm font-medium text-gray-700">
                                  ¿Cuántas cuotas deseas pagar ahora?
                                </label>
                                <select
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 store-text-sm"
                                  value={cuotasSeleccionadas}
                                  onChange={(e) => setCuotasSeleccionadas(parseInt(e.target.value))}
                                >
                                  <option value={0}>Todas las cuotas ({pagosPlazosActivos.cantidadCuotas})</option>
                                  {cuotasCalculadas.slice(0, 3).map((cuota, index) => (
                                    <option key={index + 1} value={index + 1}>
                                      {index + 1} cuota{index + 1 > 1 ? 's' : ''} - ${formatCurrency(cuotasCalculadas.slice(0, index + 1).reduce((sum, c) => sum + c.monto, 0))}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {cuotasSeleccionadas > 0 && (
                                <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                                  <p className="store-text-xs md:store-text-sm text-gray-700">
                                    <strong>Monto a pagar ahora:</strong> ${formatCurrency(cuotasCalculadas.slice(0, cuotasSeleccionadas).reduce((sum, c) => sum + c.monto, 0))}
                                  </p>
                                  <p className="store-text-xs text-gray-500 mt-1">
                                    Quedarán {pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas} cuota{pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas !== 1 ? 's' : ''} pendiente{pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedGateway && pricesWithFees[selectedGateway.id]?.hasFees && (
                        <>
                          <div className="flex justify-between store-text-sm store-text-gray-600">
                            <span>Comisión ({selectedGateway.name})</span>
                            <span>+${formatCurrency(pricesWithFees[selectedGateway.id].comision)}</span>
                          </div>
                          <div className="flex justify-between items-center store-text-lg store-font-bold store-text-primary">
                            <span>Total Final</span>
                            <span>${formatCurrency(pricesWithFees[selectedGateway.id].precioTotal)}</span>
                          </div>
                        </>
                      )}

                      {/* Botones de Acción */}
                      <div className="space-y-3">
                        {/* Botón Principal - Procesar Pago */}
                        <button
                          className="store-button store-button-primary store-button-lg store-button-block"
                          disabled={!selectedGateway || processingPayment}
                          onClick={handleProcessPayment}
                        >
                          {processingPayment ? (
                            <>
                              <div className="store-loading"></div>
                              Procesando...
                            </>
                          ) : (
                            'Procesar Pago'
                          )}
                        </button>

                        {/* Botón Secundario - Guardar en Carrito */}
                        <button
                          className="store-button store-button-default store-button-lg store-button-block"
                          disabled={processingPayment}
                          onClick={() => navigate('/store/cart')}
                        >
                          Guardar en Carrito para Pagar Después
                        </button>
                      </div>

                      {selectedGateway && (
                        <div className="store-text-xs store-text-gray-500 store-text-center mt-2">
                          Pagando con {getMethodName(selectedGateway.method_id)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Pay;
