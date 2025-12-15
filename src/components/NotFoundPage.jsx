import React from 'react';
import { Button, Result } from '../utils/antdComponents';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Lo sentimos, la página que buscas no existe."
      extra={[
        <Button type="primary" key="home" onClick={() => navigate('/')}>
          Ir al Inicio
        </Button>,
        <Button key="back" onClick={() => navigate(-1)}>
          Volver Atrás
        </Button>,
      ]}
    />
  );
};

export default NotFoundPage;
