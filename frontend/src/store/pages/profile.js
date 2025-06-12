import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Modal, message, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

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
    if (onUpdateProfile) {
      try {
        await onUpdateProfile({
          login: formData.login,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          perfil: formData.perfil
        });
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
        console.error("onUpdateProfile prop is not provided.");
        message.error("Update function not available.");
    }
  };

 const handleChangePassword = async () => {
    const userId = user?._id;
    const authToken = localStorage.getItem('token'); // Or use 'token' from useAuth if available

    if (!authToken || !userId) {
      message.error('No se encontró información de autenticación');
      return;
    }

    if (!passwordData.currentPassword?.trim() || !passwordData.newPassword?.trim()) {
      message.warning('Por favor complete ambos campos de contraseña');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      message.warning('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      // Use the correct backend endpoint for changing password
      const response = await fetch(`http://localhost:5000/api/user/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Ensure token has 'Bearer' prefix for the backend middleware
          'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword.trim(),
          newPassword: passwordData.newPassword.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la contraseña');
      }

      setIsPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      message.success('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      message.error(error.message || 'Error al actualizar la contraseña');
    }
  };
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);


  const fetchPurchaseHistory = useCallback(async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      // Ensure data is an array
      setPurchaseHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Error al cargar el historial de compras');
      setPurchaseHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      fetchPurchaseHistory();
    }
  }, [user, fetchPurchaseHistory]);

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Localizador',
      dataIndex: 'locator',
      key: 'locator'
    },
    {
      title: 'Evento',
      dataIndex: ['event', 'nombre'],
      key: 'event',
      render: (text, record) => record.event?.nombre || '-'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status || '-'
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => `$${record.seats?.reduce((sum, seat) => sum + (seat.price || 0), 0).toFixed(2) || '0.00'}`
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        record.status === 'pagado' && (
          <Button
            type="default"
            variant="outlined"
            block
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadTicket(record.locator)}
          >
            Descargar Ticket
          </Button>
        )
      )
    }
  ];

  const reservedPayments = purchaseHistory.filter(p => p.status === 'reservado');
  const paidPayments = purchaseHistory.filter(p => p.status === 'pagado');

  const handleDownloadTicket = async (locator) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/${locator}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar el ticket');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${locator}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('Ticket descargado exitosamente');
    } catch (error) {
      message.error('Error al descargar el ticket');
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
        <Button
          onClick={() => window.history.back()}
          className="hover:bg-gray-100 transition-colors"
        >
          Atrás
        </Button>
      </div>
      {user && (
        <div className="text-sm text-gray-600 mb-4">
          Localizador de Cuenta: <span className="font-mono">{user._id}</span>
        </div>
      )}

      <div className="grid gap-6">
          <Input
            placeholder="Usuario"
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
            placeholder="Teléfono"
            value={formData.telefono}
            name="telefono"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder="Empresa"
            value={formData.empresa}
            name="empresa"
            onChange={handleInputChange}
            disabled={!userData}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Input
            placeholder="Perfil"
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
              Cambiar Contraseña
            </Button>
            <Button
              type="default"
              variant="outlined"
              block
              onClick={handleSaveChanges}
              disabled={!userData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors rounded-lg"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Reservas</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 mb-10">
            <Table
              columns={columns}
              dataSource={reservedPayments}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 5,
                className: "p-4"
              }}
              locale={{ emptyText: 'No hay reservas registradas' }}
              className="w-full"
            />
          </div>

          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Pagos</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table
              columns={columns}
              dataSource={paidPayments}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 5,
                className: "p-4"
              }}
              locale={{ emptyText: 'No hay pagos registrados' }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Modal
        title="Cambiar Contraseña"
        open={isPasswordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => setIsPasswordModalVisible(false)}
        className="rounded-lg"
      >
        <div className="space-y-4">
          <Input.Password
            placeholder="Contraseña Actual"
            value={passwordData.currentPassword}
            name="currentPassword"
            onChange={handlePasswordChange}
            className="rounded-lg"
          />
          <Input.Password
            placeholder="Nueva Contraseña"
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
