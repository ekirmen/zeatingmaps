import React from 'react';
import { Typography } from '../../utils/antdComponents';
import PaymentMethodsConfig from '../components/PaymentMethodsConfig';

const { Title, Text } = Typography;

const PaymentGateways = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Pasarelas de Pago</Title>
        <Text type="secondary">
          Configura y gestiona las diferentes opciones de pago disponibles en tu tienda
        </Text>
      </div>

      <PaymentMethodsConfig />
    </div>
  );
};

export default PaymentGateways;

