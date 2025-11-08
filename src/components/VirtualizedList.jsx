import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import { Empty, Spin } from 'antd';

/**
 * Componente de lista virtualizada para grandes cantidades de elementos
 * Usa react-window para renderizar solo los elementos visibles
 */
const VirtualizedList = ({
  items = [],
  renderItem,
  height = 400,
  itemHeight = 50,
  variableHeight = false,
  loading = false,
  emptyMessage = 'No hay elementos',
  className = '',
  onScroll,
  overscanCount = 5
}) => {
  const listRef = useRef(null);
  const [itemSizes, setItemSizes] = useState(new Map());

  // Calcular altura de items
  // Nota: Usamos FixedSizeList siempre para evitar problemas de build con VariableSizeList
  // Para variableHeight, usamos una altura estimada basada en el promedio de tamaños
  const calculatedItemHeight = useMemo(() => {
    if (!variableHeight) {
      return itemHeight;
    }
    
    // Si hay tamaños guardados, calcular el promedio
    if (itemSizes.size > 0) {
      const sizes = Array.from(itemSizes.values());
      const average = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      return Math.max(itemHeight, average);
    }
    
    return itemHeight;
  }, [variableHeight, itemHeight, itemSizes]);

  // Actualizar tamaño de un item (solo para tracking, no afecta el render)
  const updateItemSize = (index, size) => {
    if (variableHeight && itemSizes.get(index) !== size) {
      setItemSizes(prev => {
        const newMap = new Map(prev);
        newMap.set(index, size);
        return newMap;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Spin size="large" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Empty description={emptyMessage} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  // Siempre usar FixedSizeList para evitar problemas de build
  // Si variableHeight es true, usamos una altura estimada calculada
  return (
    <FixedSizeList
      ref={listRef}
      height={height}
      itemCount={items.length}
      itemSize={calculatedItemHeight}
      width="100%"
      className={className}
      overscanCount={overscanCount}
      onScroll={onScroll}
    >
      {({ index, style }) => {
        const item = items[index];
        const ItemComponent = (
          <div style={style}>
            {renderItem(item, index, updateItemSize)}
          </div>
        );
        
        return ItemComponent;
      }}
    </FixedSizeList>
  );
};

/**
 * Hook para usar lista virtualizada con auto-sizing
 */
export const useVirtualizedList = (items, options = {}) => {
  const {
    defaultItemHeight = 50,
    minItemHeight = 40,
    maxItemHeight = 200
  } = options;

  const [itemHeights, setItemHeights] = useState(new Map());
  const listRef = useRef(null);

  const getItemSize = (index) => {
    return itemHeights.get(index) || defaultItemHeight;
  };

  const setItemSize = (index, height) => {
    const clampedHeight = Math.max(minItemHeight, Math.min(maxItemHeight, height));
    
    setItemHeights(prev => {
      const newMap = new Map(prev);
      if (newMap.get(index) !== clampedHeight) {
        newMap.set(index, clampedHeight);
        // Nota: resetAfterIndex solo está disponible en VariableSizeList
        // Con FixedSizeList, no podemos resetear dinámicamente
        // El componente recalcula la altura promedio automáticamente
        return newMap;
      }
      return prev;
    });
  };

  return {
    listRef,
    getItemSize,
    setItemSize,
    itemHeights
  };
};

export default VirtualizedList;

