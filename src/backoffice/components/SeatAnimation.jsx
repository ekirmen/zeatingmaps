import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SeatAnimation = ({ seat, onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Mostrar el asiento por 2 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      // Llamar al callback cuando la animación termine
      setTimeout(() => {
        onAnimationComplete && onAnimationComplete(seat._id);
      }, 300); // Tiempo para que termine la animación de salida
    }
  }, [isVisible, onAnimationComplete, seat._id]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.8, 
            y: 20,
            x: Math.random() * 100 - 50 // Posición aleatoria horizontal
          }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: 0
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8, 
            y: -20,
            x: Math.random() * 100 - 50
          }}
          transition={{ 
            duration: 0.5,
            ease: "easeOut"
          }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${Math.random() * (window.innerWidth - 200)}px`,
            top: `${Math.random() * (window.innerHeight - 100)}px`
          }}
        >
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-green-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-medium text-sm">
                {seat.nombreMesa ? `${seat.nombreMesa} - ` : ''}{seat.nombre}
              </span>
            </div>
            <div className="text-xs mt-1 opacity-90">
              {seat.zona} - ${seat.precio?.toFixed(2) || '0.00'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeatAnimation; 