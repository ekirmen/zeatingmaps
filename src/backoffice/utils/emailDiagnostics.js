import React from 'react';
import { Modal, Alert, List, Tag, Typography, Space } from 'antd';

const diagnosticsStepLabels = {
  request: 'Solicitud inicial',
  'validate-config': 'Validación de datos',
  'prepare-connection': 'Preparando conexión',
  connect: 'Conexión al servidor SMTP',
  banner: 'Bienvenida del servidor',
  ehlo: 'Comando EHLO',
  'auth-login': 'Inicio de autenticación',
  'auth-user': 'Usuario SMTP',
  'auth-pass': 'Contraseña SMTP',
  'mail-from': 'Remitente (MAIL FROM)',
  'rcpt-to': 'Destinatario (RCPT TO)',
  'data-start': 'Inicio de DATA',
  'data-end': 'Contenido del mensaje',
  quit: 'Cierre de sesión',
  cleanup: 'Cierre de conexión'
};

const formatStepName = (step) => diagnosticsStepLabels[step] || step;

const { Text } = Typography;

export const showEmailDiagnosticsModal = (
  diagnostics,
  { success = false, title, message: modalMessage } = {}
) => {
  if (!diagnostics) return;

  const steps = diagnostics.steps || [];
  const summary = diagnostics.summary;
  const modalType = success ? 'success' : 'error';
  const stepItems = steps.length > 0 ? steps : [];

  Modal[modalType]({
    title: title || (success ? 'Diagnóstico de la prueba SMTP' : 'Detalles del error SMTP'),
    width: 720,
    okText: 'Entendido',
    content: (
      <div className="space-y-4">
        {modalMessage && (
          <Alert
            type={success ? 'success' : 'error'}
            showIcon
            message={modalMessage}
          />
        )}

        {summary && (
          <Alert
            type={success ? 'success' : summary.category === 'desconocido' ? 'warning' : 'error'}
            showIcon
            message={summary.title}
            description={(
              <div className="space-y-1">
                <Text>{summary.hint}</Text>
                <div className="text-xs text-gray-500">
                  {summary.step && (
                    <span>
                      Paso: <strong>{formatStepName(summary.step)}</strong>
                    </span>
                  )}
                  {summary.code && (
                    <span className="ml-2">
                      Código: <strong>{summary.code}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          />
        )}

        <List
          bordered
          dataSource={stepItems}
          locale={{ emptyText: 'No hay información de diagnóstico disponible.' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={(
                  <Space>
                    <Tag color={item.status === 'success' ? 'green' : item.status === 'warning' ? 'orange' : 'red'}>
                      {item.status ? item.status.toUpperCase() : 'INFO'}
                    </Tag>
                    <Text strong>{formatStepName(item.step)}</Text>
                  </Space>
                )}
                description={(
                  <div className="space-y-1">
                    {item.message && (
                      <Text>{item.message}</Text>
                    )}
                    {item.error && (
                      <Text type="danger">{item.error}</Text>
                    )}
                    <div className="text-xs text-gray-500 space-x-2">
                      {item.code && <span>Código: {item.code}</span>}
                      {item.host && <span>Host: {item.host}</span>}
                      {item.port && <span>Puerto: {item.port}</span>}
                      {typeof item.secure === 'boolean' && (
                        <span>SSL: {item.secure ? 'Sí' : 'No'}</span>
                      )}
                    </div>
                    {item.note && (
                      <Text type="secondary">{item.note}</Text>
                    )}
                  </div>
                )}
              />
            </List.Item>
          )}
        />
      </div>
    )
  });
};

export { diagnosticsStepLabels, formatStepName };

