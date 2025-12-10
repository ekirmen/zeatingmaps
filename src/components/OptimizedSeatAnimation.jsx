/**
 * Componente de animación optimizado para asientos
 * Usa CSS animations en lugar de framer-motion para mejor performance
 */

import React, { useEffect, useRef } from 'react';
import { optimizeAnimationElement, isLowPerformanceDevice } from '../utils/animationUtils';
import '../styles/animations.css';

const OptimizedSeatAnimation = ({ seat, onAnimationComplete }) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = React.useState(true);

  useEffect(() => {
    // Optimizar elemento de animación
    if (elementRef.current) {
      optimizeAnimationElement(elementRef.current);
    }

    // Mostrar el asiento por 2 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible && onAnimationComplete) {
      // Llamar al callback cuando la animación termine
      setTimeout(() => {
        onAnimationComplete(seat._id);
      }, 300); // Tiempo para que termine la animación de salida
    }
  }, [isVisible, onAnimationComplete, seat._id]);

  // En dispositivos de bajo rendimiento, no mostrar animación
  if (isLowPerformanceDevice()) {
    return null;
  }

  // Calcular posición aleatoria (solo una vez)
  const positionRef = useRef({
    left: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 200 : 800),
    top: Math.random() * (typeof window !== 'undefined' ? window.innerHeight - 100 : 600),
    x: Math.random() * 100 - 50,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={elementRef}
      className={`animate-scale-in ${!isVisible ? 'animate-fade-out' : ''}`}
      style={{
        position: 'fixed',
        zIndex: 50,
        pointerEvents: 'none',
        left: `${positionRef.current.left}px`,
        top: `${positionRef.current.top}px`,
        willChange: 'transform, opacity',
      }}
    >
      <div
        className="store-badge store-badge-success"
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '2px solid var(--store-success)',
        }}
      >
        ✅ Asiento {seat.nombre || seat.numero || seat._id} seleccionado
      </div>
    </div>
  );
};

export default OptimizedSeatAnimation;

