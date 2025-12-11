// src/components/MetodoPago.jsx
import React, { useState, useEffect } from 'react';
import {
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  DollarOutlined,
  AppleOutlined,
  AndroidOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Badge, Tooltip, Tag } from '../../utils/antdComponents';

const MetodoPago = ({ metodosDisponibles, onSelect, selected }) => {
  const [favoriteMethods, setFavoriteMethods] = useState([]);
  const [userPreferences, setUserPreferences] = useState({});

  // M©todos de pago con iconos y estilos mejorados
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CreditCardOutlined />,
      color: '#6772e5',
      description: 'Tarjetas de cr©dito y d©bito',
      processingTime: 'Instant¡neo',
      fee: '2.9% + $0.30',
      recommended: true,
      available: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <DollarOutlined />,
      color: '#0070ba',
      description: 'Pagos a trav©s de PayPal',
      processingTime: 'Instant¡neo',
      fee: '2.9% + $0.30',
      recommended: true,
      available: true
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: <AppleOutlined />,
      color: '#000000',
      description: 'Pagos para usuarios iOS',
      processingTime: 'Instant¡neo',
      fee: '2.9% + $0.30',
      recommended: true,
      available: true
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: <AndroidOutlined />,
      color: '#4285f4',
      description: 'Pagos para usuarios Android',
      processingTime: 'Instant¡neo',
      fee: '2.9% + $0.30',
      recommended: true,
      available: true
    },
    {
      id: 'transferencia',
      name: 'Transferencia Bancaria',
      icon: <BankOutlined />,
      color: '#52c41a',
      description: 'Transferencias bancarias directas',
      processingTime: '1-3 d­as h¡biles',
      fee: 'Sin comisi³n',
      recommended: false,
      available: true
    },
    {
      id: 'pago_movil',
      name: 'Pago M³vil',
      icon: <MobileOutlined />,
      color: '#1890ff',
      description: 'Pagos m³viles (MercadoPago, etc.)',
      processingTime: 'Instant¡neo',
      fee: 'Variable',
      recommended: false,
      available: true
    },
    {
      id: 'efectivo_tienda',
      name: 'Pago en Efectivo en Tienda',
      icon: <ShopOutlined />,
      color: '#fa8c16',
      description: 'Pagos en efectivo en tienda f­sica',
      processingTime: 'Inmediato',
      fee: 'Sin comisi³n',
      recommended: false,
      available: true
    },
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: <DollarOutlined />,
      color: '#fa8c16',
      description: 'Pagos en efectivo',
      processingTime: 'Inmediato',
      fee: 'Sin comisi³n',
      recommended: false,
      available: true
    }
  ];

  useEffect(() => {
    // Cargar preferencias del usuario desde localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoritePaymentMethods') || '[]');
    const savedPreferences = JSON.parse(localStorage.getItem('userPaymentPreferences') || '{}');
    setFavoriteMethods(savedFavorites);
    setUserPreferences(savedPreferences);
  }, []);

  const toggleFavorite = (methodId) => {
    const isFavorite = favoriteMethods.includes(methodId);
    const newFavorites = isFavorite
      ? favoriteMethods.filter(id => id !== methodId)
      : [...favoriteMethods, methodId];

    setFavoriteMethods(newFavorites);
    localStorage.setItem('favoritePaymentMethods', JSON.stringify(newFavorites));
  };

  const getAvailabilityStatus = (method) => {
    // Simular verificaci³n de disponibilidad

      return { status: 'error', message: 'No disponible' };
    }

    // Verificar si es m©todo m³vil y el usuario est¡ en m³vil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (method.id === 'apple_pay' && !isMobile) {
      return { status: 'warning', message: 'Requiere dispositivo iOS' };
    }

    if (method.id === 'google_pay' && !isMobile) {
      return { status: 'warning', message: 'Requiere dispositivo Android' };
    }

    return { status: 'success', message: 'Disponible' };
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">M©todos de Pago Disponibles</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Ordenar por:</span>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            onChange={(e) => {
              // Implementar ordenamiento
            }}
          >
            <option value="recommended">Recomendados</option>
            <option value="favorites">Favoritos</option>
            <option value="processing_time">Tiempo de procesamiento</option>
            <option value="fee">Comisi³n</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentMethods
          .filter(method => metodosDisponibles.includes(method.id))
          .sort((a, b) => {
            // Ordenar por favoritos primero, luego por recomendados
            const aFavorite = favoriteMethods.includes(a.id);
            const bFavorite = favoriteMethods.includes(b.id);
            if (aFavorite && !bFavorite) return -1;
            if (!aFavorite && bFavorite) return 1;
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return 0;
          })
          .map((method) => {
            const isSelected = selected === method.id;
            const isFavorite = favoriteMethods.includes(method.id);
            const availability = getAvailabilityStatus(method);

            return (
              <div
                key={method.id}
                className={`
                  relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                  ${availability.status === 'error' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => availability.status !== 'error' && onSelect(method.id)}
                aria-pressed={isSelected}
              >
                {/* Badge de favorito */}
                <button
                  className="absolute top-2 right-2 z-10 p-1 hover:bg-gray-100 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(method.id);
                  }}
                >
                  {isFavorite ? (
                    <StarFilled style={{ color: '#faad14', fontSize: '16px' }} />
                  ) : (
                    <StarOutlined style={{ color: '#d9d9d9', fontSize: '16px' }} />
                  )}
                </button>

                {/* Icono del m©todo */}
                <div
                  className="text-2xl"
                  style={{ color: method.color }}
                >
                  {method.icon}
                </div>

                {/* Informaci³n del m©todo */}
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-gray-900">
                      {method.name}
                    </div>
                    {method.recommended && (
                      <Tag color="blue" size="small">Recomendado</Tag>
                    )}
                    {availability.status === 'success' && (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
                    )}
                    {availability.status === 'warning' && (
                      <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '14px' }} />
                    )}
                    {availability.status === 'error' && (
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
                    )}
                  </div>

                  <div className="text-sm text-gray-500 mb-2">
                    {method.description}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <ClockCircleOutlined />
                      <span>{method.processingTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarOutlined />
                      <span>{method.fee}</span>
                    </div>
                  </div>

                  {availability.status !== 'success' && (
                    <div className="mt-1">
                      <Badge
                        status={availability.status}
                        text={availability.message}
                        style={{ fontSize: '11px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Indicador de selecci³n */}
                {isSelected && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {metodosDisponibles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <DollarOutlined className="text-4xl mb-2" />
          <p>No hay m©todos de pago disponibles</p>
        </div>
      )}
    </div>
  );
};

export default MetodoPago;


