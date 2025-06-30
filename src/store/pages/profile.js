import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Modal, message, Table } from 'antd';
import { AiOutlineDownload } from 'react-icons/ai'; // Ant Design icon set (AI)
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../backoffice/services/supabaseClient';
import downloadTicket from '../../utils/downloadTicket';

const Profile = ({ userData, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    telefono: '',
    empresa: '',
    perfil: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (userData) {
      setFormData({
        login: userData.login || '',
        email: userData.email || '',
        telefono: userData.telefono || '',
        empresa: userData.empresa || '',
        perfil: userData.perfil || '',
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      message.error("Usuario no autenticado");
      return;
    }
  
    const { error } = await supabase
      .from('profiles')
      .update({
        login: formData.login,
        email: formData.email,
        telefono: formData.telefono,
        empresa: formData.empresa,
        perfil: formData.perfil
      })
      .eq('id', user.id);
  
    if (error) {
      console.error(error);
      message.error("Error al actualizar el perfil");
    } else {
      message.success("Perfil actualizado correctamente");
    }
  };
  

  const handleChangePassword = async () => {
    if (!passwordData.newPassword?.trim()) {
      message.warning('Por favor ingresa la nueva contraseña');
      return;
    }
  
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword.trim()
      });
  
      if (error) throw error;
  
      setIsPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      message.success('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error(error);
      message.error(error.message || 'Error al actualizar la contraseña');
    }
  };
  
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);


  const fetchPurchaseHistory = useCallback(async () => {
    if (!user?.id) return;
  
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, event:eventos(*)')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      setPurchaseHistory(data || []);
    } catch (error) {
      message.error('Error al cargar el historial de compras');
      setPurchaseHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);
  

  useEffect(() => {
    if (user?.id) {
      fetchPurchaseHistory();
    }
  }, [user, fetchPurchaseHistory]);

  const columns = [
    {
      title: t('profile.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: t('profile.locator'),
      dataIndex: 'locator',
      key: 'locator'
    },
    {
      title: t('profile.event'),
      dataIndex: ['event', 'nombre'],
      key: 'event',
      render: (text, record) => record.event?.nombre || '-'
    },
    {
      title: t('profile.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => status || '-'
    },
    {
      title: t('profile.total'),
      key: 'total',
      render: (_, record) => {
        const totalAmount = record.seats
          ? record.seats.reduce((sum, seat) => sum + (seat.price || 0), 0)
          : 0;
        return `$${totalAmount.toFixed(2)}`;
      }
    },
    {
      title: t('profile.actions'),
      key: 'actions',
      render: (_, record) => (
        record.status === 'pagado' && (
          <Button
            type="default"
            variant="outlined"
            block
            icon={<AiOutlineDownload />}
            onClick={() => handleDownloadTicket(record.locator)}
          >
            {t('button.download_ticket')}
          </Button>
        )
      )
    }
  ];

  const reservedPayments = purchaseHistory.filter(p => p.status === 'reservado');
  const paidPayments = purchaseHistory.filter(p => p.status === 'pagado');

  const handleDownloadTicket = async (locator) => {
    try {
      await downloadTicket(locator);
      message.success('Ticket descargado exitosamente');
    } catch {
      message.error('Error al descargar el ticket');
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{t('profile.title')}</h1>
        <Button
          onClick={() => window.history.back()}
          className="hover:bg-gray-100 transition-colors"
        >
          {t('profile.back')}
        </Button>
      </div>
      {user && (
        <div className="text-sm text-gray-600 mb-4">
          {t('profile.account_locator', 'Localizador de Cuenta')}: <span className="font-mono">{user.id}</span>
        </div>
      )}

      <div className="grid gap-6">
          <Input
            placeholder={t('header.login')}
            value={formData.login}
            name="login"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder="Email"
            value={formData.email}
            name="email"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder={t('profile.phone', 'Teléfono')}
            value={formData.telefono}
            name="telefono"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder={t('profile.company', 'Empresa')}
            value={formData.empresa}
            name="empresa"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder={t('profile.role', 'Perfil')}
            value={formData.perfil}
            name="perfil"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-4">
            <Button
              onClick={() => setIsPasswordModalVisible(true)}
              disabled={!userData}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg"
            >
              {t('profile.change_password')}
            </Button>
            <Button
              type="default"
              variant="outlined"
              block
              onClick={handleSaveChanges}
              disabled={!userData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors rounded-lg"
            >
              {t('profile.save_changes')}
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('profile.reservations')}</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 mb-10">
            <Table
              columns={columns}
              dataSource={reservedPayments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                className: "p-4"
              }}
              locale={{ emptyText: t('profile.no_reservations') }}
              className="w-full"
            />
          </div>

          <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('profile.payments')}</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table
              columns={columns}
              dataSource={paidPayments}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 5,
                className: "p-4"
              }}
              locale={{ emptyText: t('profile.no_payments') }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Modal
        title={t('profile.change_password')}
        open={isPasswordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => setIsPasswordModalVisible(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText={t('button.save')}
        className="rounded-lg"
      >
        <div className="space-y-4">
          <Input.Password
            placeholder={t('profile.current_password', 'Contraseña Actual')}
            value={passwordData.currentPassword}
            name="currentPassword"
            onChange={handlePasswordChange}
            className="rounded-lg"
          />
          <Input.Password
            placeholder={t('profile.new_password', 'Nueva Contraseña')}
            value={passwordData.newPassword}
            name="newPassword"
            onChange={handlePasswordChange}
            className="rounded-lg"
          />
        </div>
      </Modal>
    </>
  );
};

export default Profile;
