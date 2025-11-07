import React from 'react';
import { Skeleton, Card } from 'antd';

/**
 * Skeleton Loader para el mapa de asientos
 */
export const SeatMapSkeleton = () => {
  return (
    <div className="w-full h-full p-4">
      <Skeleton active paragraph={{ rows: 0 }} />
      <div className="mt-4">
        <Skeleton.Image 
          active 
          style={{ width: '100%', height: '400px' }} 
        />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton.Button key={i} active size="small" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Loader para lista de eventos
 */
export const EventListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="w-full">
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  );
};

/**
 * Skeleton Loader para lista de asientos
 */
export const SeatListSkeleton = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="p-3 border rounded">
          <Skeleton active paragraph={{ rows: 0 }} />
          <div className="flex justify-between items-center mt-2">
            <Skeleton.Button active size="small" />
            <Skeleton.Input active size="small" style={{ width: 60 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Loader para el carrito
 */
export const CartSkeleton = () => {
  return (
    <div className="space-y-3">
      <Skeleton active paragraph={{ rows: 0 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 border rounded">
          <Skeleton active paragraph={{ rows: 1 }} />
        </div>
      ))}
      <Skeleton.Button active block className="mt-4" />
    </div>
  );
};

/**
 * Skeleton Loader para el dashboard
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton active paragraph={{ rows: 1 }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  );
};

/**
 * Skeleton Loader genérico para páginas
 */
export const PageSkeleton = ({ rows = 4 }) => {
  return (
    <div className="p-6">
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
};

/**
 * Skeleton Loader para tabla
 */
export const TableSkeleton = ({ columns = 5, rows = 5 }) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton.Input key={i} active size="small" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input key={colIndex} active size="small" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default {
  SeatMapSkeleton,
  EventListSkeleton,
  SeatListSkeleton,
  CartSkeleton,
  DashboardSkeleton,
  PageSkeleton,
  TableSkeleton
};

