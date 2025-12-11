import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Empty, Spin } from '../utils/antdComponents';

/**
 * Componente de lista optimizada para grandes cantidades de elementos
 * Renderiza una lista normal con scroll optimizado y lazy loading
 * Nota: Se eliminó la dependencia de react-window para evitar problemas de build
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
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(20, items.length) });
  const [itemSizes, setItemSizes] = useState(new Map());

  // Actualizar tamaño de un item (solo para tracking)
  const updateItemSize = (index, size) => {
    if (variableHeight && itemSizes.get(index) !== size) {
      setItemSizes(prev => {
        const newMap = new Map(prev);

        return newMap;
      });
    }
  };

  // Calcular altura total para scroll (mover antes de early returns)
  const totalHeight = useMemo(() => {
    if (loading || items.length === 0) return 0;
    if (variableHeight && itemSizes.size > 0) {
      // Si tenemos tamaños, calcular altura total
      let total = 0;
      for (let i = 0; i < items.length; i++) {
        total += itemSizes.get(i) || itemHeight;
      }
      return total;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, variableHeight, itemSizes, loading]);

  // Calcular offset superior para items no visibles
  const offsetTop = useMemo(() => {
    if (loading || items.length === 0) return 0;
    if (variableHeight && itemSizes.size > 0) {
      let offset = 0;
      for (let i = 0; i < visibleRange.start; i++) {
        offset += itemSizes.get(i) || itemHeight;
      }
      return offset;
    }
    return visibleRange.start * itemHeight;
  }, [visibleRange.start, itemHeight, variableHeight, itemSizes, loading, items.length]);

  // Calcular altura de items visibles
  const visibleItemsHeight = useMemo(() => {
    if (loading || items.length === 0) return 0;
    if (variableHeight && itemSizes.size > 0) {
      let height = 0;
      for (let i = visibleRange.start; i < visibleRange.end; i++) {
        height += itemSizes.get(i) || itemHeight;
      }
      return height;
    }
    return (visibleRange.end - visibleRange.start) * itemHeight;
  }, [visibleRange, itemHeight, variableHeight, itemSizes, loading, items.length]);

  // Items visibles
  const visibleItems = useMemo(() => {
    if (loading || items.length === 0) return [];
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange, loading]);

  // Calcular altura del spacer inferior
  const bottomSpacerHeight = useMemo(() => {
    return Math.max(0, totalHeight - offsetTop - visibleItemsHeight);
  }, [totalHeight, offsetTop, visibleItemsHeight]);

  // Calcular rango visible basado en scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemCount = items.length;
      
      // Calcular qué items son visibles
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
      const end = Math.min(
        itemCount,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
      );
      
      setVisibleRange({ start, end });
      
      if (onScroll) {
        onScroll({ target: container });
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Inicial
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [items.length, itemHeight, overscanCount, onScroll, loading]);

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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* Spacer superior para items no visibles */}
      <div style={{ height: offsetTop, flexShrink: 0 }} />
      
      {/* Items visibles */}
      {visibleItems.map((item, idx) => {
        const actualIndex = visibleRange.start + idx;
        // Usar id del item si está disponible, de lo contrario usar índice
        const itemKey = item?.id || item?._id || actualIndex;
        return (
          <div key={itemKey}>
            {renderItem(item, actualIndex, updateItemSize)}
          </div>
        );
      })}
      
      {/* Spacer inferior para items no visibles */}
      <div style={{ height: bottomSpacerHeight, flexShrink: 0 }} />
    </div>
  );
};

/**
 * Hook para usar lista virtualizada con auto-sizing
 */
export 

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


