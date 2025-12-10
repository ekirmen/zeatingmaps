import { useEffect, useRef, useState } from 'react';

export const useMapaZoomStage = (zoom, setZoom) => {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth - 320, // espacio restante al menú (80px más ancho)
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleWheelZoom = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Limitar el zoom entre 0.1 y 5
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setZoom(clampedScale);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(newPos);
    stage.batchDraw();
  };

  const zoomIn = () => {
    const newZoom = Math.min(5, zoom * 1.2);
    setZoom(newZoom);
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: newZoom, y: newZoom });
      stage.batchDraw();
    }
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.1, zoom / 1.2);
    setZoom(newZoom);
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: newZoom, y: newZoom });
      stage.batchDraw();
    }
  };

  const resetZoom = () => {
    const newZoom = 1;
    setZoom(newZoom);
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: newZoom, y: newZoom });
      stage.position({ x: 0, y: 0 });
      stage.batchDraw();
    }
  };

  const centerView = () => {
    const stage = stageRef.current;
    if (stage) {
      const centerX = stageSize.width / 2;
      const centerY = stageSize.height / 2;
      stage.position({ x: centerX, y: centerY });
      stage.batchDraw();
    }
  };

  return {
    stageRef,
    stageSize,
    handleWheelZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    centerView,
  };
};
