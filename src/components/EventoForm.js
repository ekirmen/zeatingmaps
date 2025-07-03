import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EventoForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        message.error("No hay sesión activa");
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('eventos')
        .insert([{ ...values, user_id: session.user.id }]);

      if (error) throw error;

      message.success('Evento creado exitosamente');
      form.resetFields();
    } catch (error) {
      message.error("Error al crear el evento: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="nombre"
        label="Nombre del Evento"
        rules={[{ required: true, message: 'Por favor ingrese el nombre del evento' }]}
      >
        <Input />
      </Form.Item>
      {/* Puedes agregar más campos como descripción, fecha, etc. */}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading} block>
          Crear Evento
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EventoForm;
