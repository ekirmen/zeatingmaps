/**
 * Skeleton loader optimizado con CSS animations
 * Reemplaza spinners genéricos con skeleton loaders específicos
 */

import React from 'react';
import { Skeleton, Card } from 'antd';
import '../styles/animations.css';

/**
 * Skeleton loader para tarjetas de evento
 */
export const EventCardSkeletonOptimized = () => (
  <Card className="store-event-card" style={{ marginBottom: '16px' }}>
    <Skeleton active avatar paragraph={{ rows: 3 }} />
  </Card>
);

/**
 * Skeleton loader para lista de eventos (usando EventCardSkeletonOptimized)
 */
export const EventListSkeletonOptimized = ({ count = 6 }) => (
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
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

/**
 * Skeleton loader para carrito
 */
export const CartSkeleton = () => (
  <div className="store-card">
    <div className="store-card-header">
      <Skeleton.Input active size="large" style={{ width: '40%' }} />
    </div>
    <div className="store-card-body">
      <Skeleton active paragraph={{ rows: 3 }} />
      <div style={{ marginTop: '24px' }}>
        <Skeleton.Button active size="large" block />
      </div>
    </div>
  </div>
);

export default {
  EventCardSkeletonOptimized,
  EventListSkeletonOptimized,
  SeatMapSkeleton,
  CartSkeleton,
};

