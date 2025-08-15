import React from 'react';
import { Button } from 'antd';

const ZoomControls = ({
  handleZoomIn,
  handleZoomOut,
  resetZoom
}) => {
  return (
    <div className="zoom-controls-right">
      <Button 
        onClick={handleZoomIn} 
        className="zoom-button primary"
        title="Zoom In"
      >
        🔍+
      </Button>
      <Button 
        onClick={handleZoomOut} 
        className="zoom-button primary"
        title="Zoom Out"
      >
        🔍-
      </Button>
      <Button 
        onClick={resetZoom} 
        className="zoom-button secondary"
        title="Reset Zoom"
      >
        🎯
      </Button>
    </div>
  );
};

export default ZoomControls;
