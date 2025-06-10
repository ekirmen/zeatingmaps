import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EventoForm = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (values) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                message.error("No hay sesión activa");
                navigate('/login');
                return;
            }

            const response = await axios.post('http://localhost:5000/api/events', values, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                message.success('Evento creado exitosamente');
                form.resetFields();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = (error) => {
        if (error.response && error.response.status === 401) {
            message.error("Sesión expirada. Por favor, inicie sesión nuevamente.");
            localStorage.removeItem('token');
            navigate('/login');
        } else {
            message.error("Error al procesar la solicitud: " + (error.response?.data?.message || error.message));
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
            {/* Add other form fields as needed */}
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    Crear Evento
                </Button>
            </Form.Item>
        </Form>
    );
};

export default EventoForm;