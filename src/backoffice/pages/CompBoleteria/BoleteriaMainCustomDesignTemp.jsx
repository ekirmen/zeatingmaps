import React from 'react';
import { Alert, Button } from 'antd';

const BoleteriaMainCustomDesignTemp = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Alert
        message="Boletería Temporalmente Deshabilitada"
        description="La boletería está temporalmente deshabilitada para resolver problemas de compilación."
        type="info"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            Recargar
          </Button>
        }
      />
    </div>
  );
};

export default BoleteriaMainCustomDesignTemp;
