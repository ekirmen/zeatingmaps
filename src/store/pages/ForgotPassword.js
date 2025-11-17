import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { getStoreResetPasswordUrl } from '../../utils/siteUrl';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const [cooldown, setCooldown] = useState(0);
  const steps = useMemo(
    () => [
      {
        title: 'Solicita el enlace seguro',
        icon: <MailOutlined />
      },
      {
        title: 'Revisa tu correo',
        icon: <CheckCircleOutlined />
      }
    ],
    []
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const REQUEST_COOLDOWN_SECONDS = 60;

  const handleSendResetEmail = async (values) => {
    try {
      if (cooldown > 0) {
        message.warning(
          `Por seguridad, espera ${cooldown} segundo${cooldown === 1 ? '' : 's'} antes de solicitar otro correo.`
        );
        return;
      }

      setLoading(true);
      setEmail(values.email);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: getStoreResetPasswordUrl()
      });

      if (error) throw error;

      message.success('Te enviamos un enlace seguro para restablecer tu contraseña');
      setCooldown(REQUEST_COOLDOWN_SECONDS);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error sending reset email:', error);
      if (error?.status === 429) {
        setCooldown((prev) => (prev > 0 ? prev : REQUEST_COOLDOWN_SECONDS));
        message.warning(
          'Ya hemos enviado un correo recientemente. Por seguridad debes esperar un momento antes de solicitar otro.'
        );
      } else {
        message.error(error?.message || 'Error al enviar el email de recuperación');
      }
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
              Te enviaremos un enlace temporal y de un solo uso a tu correo para que puedas crear una nueva contraseña.
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
                  disabled={cooldown > 0}
                  size="large"
                  block
                >
                  {cooldown > 0
                    ? `Reintentar en ${cooldown}s`
                    : 'Enviar enlace seguro'}
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/store/login')}
            >
              Volver al Login
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="text-center">
            <Title level={3}>Revisa tu correo</Title>
            <Space direction="vertical" size="middle" className="w-full">
              <Text type="secondary">
                Enviamos un enlace de restablecimiento a <strong>{email}</strong>.
                El enlace expira en pocos minutos y se invalida después del primer uso.
              </Text>

              <Alert
                message="Cómo continuar"
                description={(
                  <Space direction="vertical">
                    <Paragraph className="mb-0">
                      1. Abre el correo de recuperación y haz clic en "Restablecer contraseña".
                    </Paragraph>
                    <Paragraph className="mb-0">
                      2. Se abrirá una pestaña segura donde podrás crear tu nueva contraseña.
                    </Paragraph>
                    <Paragraph className="mb-0">
                      3. Si no ves el correo, revisa el spam o solicita uno nuevo.
                    </Paragraph>
                  </Space>
                )}
                type="info"
                showIcon
              />

              <Space className="w-full" direction="vertical">
                <Button
                  type="primary"
                  size="large"
                  icon={<LockOutlined />}
                  onClick={() => navigate('/store/login')}
                  block
                >
                  Volver al inicio de sesión
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => handleSendResetEmail({ email })}
                  disabled={cooldown > 0}
                  loading={loading}
                  block
                >
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar enlace'}
                </Button>
                <Button type="link" onClick={() => setCurrentStep(0)} block>
                  Usar otro correo
                </Button>
              </Space>
            </Space>
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
