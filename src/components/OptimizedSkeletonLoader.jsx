/**
 * Skeleton loader optimizado con CSS animations
 * Reemplaza spinners genéricos con skeleton loaders específicos
 */

import React from 'react';
import { SkeletonLoader, EventCardSkeleton, SeatListSkeleton } from './loadingStates';
import '../styles/animations.css';

/**
 * Skeleton loader para tarjetas de evento
 */
export const EventCardSkeletonOptimized = () => (
  <div className="store-event-card animate-skeleton">
    <EventCardSkeleton />
  </div>
);

/**
 * Skeleton loader para lista de eventos
 */
export const EventListSkeleton = ({ count = 6 }) => (
  <div className="store-grid store-grid-3">
    {Array.from({ length: count }).map((_, index) => (
      <EventCardSkeletonOptimized key={index} />
    ))}
  </div>
);

/**
 * Skeleton loader para mapa de asientos
 */
export const SeatMapSkeleton = () => (
  <div className="store-card" style={{ minHeight: '500px', position: 'relative' }}>
    <div className="skeleton-loader" style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      borderRadius: '8px'
    }} />
  </div>
);

/**
 * Skeleton loader para carrito
 */
export const CartSkeleton = () => (
  <div className="store-card">
    <div className="store-card-header">
      <SkeletonLoader width="40%" height="24px" />
    </div>
    <div className="store-card-body">
      <SeatListSkeleton count={3} />
      <div style={{ marginTop: '24px' }}>
        <SkeletonLoader width="100%" height="48px" />
      </div>
    </div>
  </div>
);

export default {
  EventCardSkeletonOptimized,
  EventListSkeleton,
  SeatMapSkeleton,
  CartSkeleton,
};

