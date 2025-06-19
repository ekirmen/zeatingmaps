  import { useEffect, useRef, useState } from 'react';

  export const useMapaZoomStage = (zoom, setZoom) => {
    const stageRef = useRef(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
      const updateSize = () => {
        setStageSize({
          width: window.innerWidth - 256, // espacio restante al menú
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
      setZoom(newScale);

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    };

    const zoomIn = () => {
      const newZoom = zoom * 1.1;
      setZoom(newZoom);
      const stage = stageRef.current;
      if (stage) {
        stage.scale({ x: newZoom, y: newZoom });
        stage.batchDraw();
      }
    };

    const zoomOut = () => {
      const newZoom = zoom / 1.1;
      setZoom(newZoom);
      const stage = stageRef.current;
      if (stage) {
        stage.scale({ x: newZoom, y: newZoom });
        stage.batchDraw();
      }
    };

    return {
      stageRef,
      stageSize,
      handleWheelZoom,
      zoomIn,
      zoomOut,
    };
  };
