import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Alert,
  Steps,
  Typography,
  Space,
  Divider
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Step } = Steps;

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const steps = [
    {
      title: 'Ingresa tu email',
      icon: <MailOutlined />
    },
    {
      title: 'Verifica el código',
      icon: <SafetyOutlined />
    },
    {
      title: 'Nueva contraseña',
      icon: <LockOutlined />
    },
    {
      title: 'Completado',
      icon: <CheckCircleOutlined />
    }
  ];

  const handleSendResetEmail = async (values) => {
    try {
      setLoading(true);
      setEmail(values.email);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      message.success('Email de recuperación enviado correctamente');
      setCurrentStep(1);
    } catch (error) {
      console.error('Error sending reset email:', error);
      message.error('Error al enviar el email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values) => {
    try {
      setLoading(true);
      setResetToken(values.code);

      // En un sistema real, aquí verificarías el código
      // Por ahora, simulamos la verificación
      if (values.code === '123456') {
        message.success('Código verificado correctamente');
        setCurrentStep(2);
      } else {
        message.error('Código inválido');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      message.error('Error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      });

      if (error) throw error;

      message.success('Contraseña actualizada correctamente');
      setCurrentStep(3);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <Title level={3}>¿Olvidaste tu contraseña?</Title>
            <Text type="secondary" className="block mb-6">
              No te preocupes, te ayudaremos a recuperarla. Ingresa tu email y te enviaremos un código de verificación.
            </Text>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSendResetEmail}
              className="max-w-md mx-auto"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Por favor ingresa tu email' },
                  { type: 'email', message: 'Email inválido' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="tu@email.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  Enviar Código de Recuperación
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
            >
              Volver al Login
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="text-center">
            <Title level={3}>Verifica tu Email</Title>
            <Text type="secondary" className="block mb-6">
              Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
            </Text>

            <Alert
              message="Código de Prueba"
              description="Para demostración, usa el código: 123456"
              type="info"
              showIcon
              className="mb-6"
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleVerifyCode}
              className="max-w-md mx-auto"
            >
              <Form.Item
                name="code"
                label="Código de Verificación"
                rules={[
                  { required: true, message: 'Por favor ingresa el código' },
                  { len: 6, message: 'El código debe tener 6 dígitos' }
                ]}
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="123456"
                  size="large"
                  maxLength={6}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  Verificar Código
                </Button>
              </Form.Item>
            </Form>

            <div className="mt-4">
              <Button type="link" onClick={() => setCurrentStep(0)}>
                Cambiar Email
              </Button>
              <Button type="link" onClick={() => handleSendResetEmail({ email })}>
                Reenviar Código
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <Title level={3}>Nueva Contraseña</Title>
            <Text type="secondary" className="block mb-6">
              Crea una nueva contraseña segura para tu cuenta
            </Text>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleResetPassword}
              className="max-w-md mx-auto"
            >
              <Form.Item
                name="newPassword"
                label="Nueva Contraseña"
                rules={[
                  { required: true, message: 'Por favor ingresa la nueva contraseña' },
                  { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'La contraseña debe contener mayúsculas, minúsculas y números'
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nueva contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirmar Contraseña"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Por favor confirma la contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirmar contraseña"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  Cambiar Contraseña
                </Button>
              </Form.Item>
            </Form>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
            <Title level={3}>¡Contraseña Actualizada!</Title>
            <Text type="secondary" className="block mb-6">
              Tu contraseña ha sido actualizada correctamente. Serás redirigido al login en unos segundos.
            </Text>

            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              Ir al Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          {/* Steps */}
          <Steps current={currentStep} className="mb-8">
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                icon={step.icon}
              />
            ))}
          </Steps>

          {/* Step Content */}
          {renderStepContent()}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Text type="secondary">
            ¿Necesitas ayuda? <Button type="link" size="small">Contacta Soporte</Button>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
