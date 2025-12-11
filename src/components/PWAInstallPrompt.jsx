/**
 * Componente para mostrar el prompt de instalación de PWA
 */
import React, { useState, useEffect } from 'react';
import { Button, Modal, Space } from '../utils/antdComponents';
import { DownloadOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { promptPWAInstall, installPWA, isPWAInstalled } from '../utils/pwaService';

const PWAInstallPrompt = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (isPWAInstalled()) {

      return;
    }

    // Verificar si el usuario ya rechazó el prompt anteriormente
    const dismissedTimestamp = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTimestamp) {
      const dismissedDate = new Date(dismissedTimestamp);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Mostrar nuevamente después de 7 días
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    // Obtener el prompt de instalación
    promptPWAInstall().then((prompt) => {
      if (prompt) {
        setDeferredPrompt(prompt);
        // Mostrar el prompt después de un pequeño delay
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // 3 segundos después de cargar la página
      }
    });

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      const installed = await installPWA(deferredPrompt);
      if (installed) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // No mostrar si ya está instalada o fue rechazada recientemente
  if (isInstalled || dismissed || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      closable={true}
      centered
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <DownloadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '12px' }}>{t('pwa.install.title', 'Instalar App')}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {t('pwa.install.description', 'Instala nuestra app para una mejor experiencia. Recibe notificaciones de nuevos eventos y accede rápidamente desde tu pantalla de inicio.')}
        </p>
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleInstall}
            size="large"
          >
            {t('pwa.install.button', 'Instalar')}
          </Button>
          <Button 
            onClick={handleDismiss}
            icon={<CloseOutlined />}
            size="large"
          >
            {t('pwa.install.later', 'Ahora no')}
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default PWAInstallPrompt;


