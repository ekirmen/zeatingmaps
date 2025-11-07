import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
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

  // Calcular altura de items si es variable
  const getItemSize = useMemo(() => {
    if (!variableHeight) {
      return () => itemHeight;
    }
    
    return (index) => {
      return itemSizes.get(index) || itemHeight;
    };
  }, [variableHeight, itemHeight, itemSizes]);

  // Actualizar tamaño de un item
  const updateItemSize = (index, size) => {
    if (itemSizes.get(index) !== size) {
      setItemSizes(prev => {
        const newMap = new Map(prev);
        newMap.set(index, size);
        return newMap;
      });
      
      // Recalcular cache de react-window
      if (listRef.current && variableHeight) {
        listRef.current.resetAfterIndex(index);
      }
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

  const ListComponent = variableHeight ? VariableSizeList : FixedSizeList;

  return (
    <ListComponent
      ref={listRef}
      height={height}
      itemCount={items.length}
      itemSize={getItemSize}
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
    </ListComponent>
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
        if (listRef.current) {
          listRef.current.resetAfterIndex(index);
        }
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

