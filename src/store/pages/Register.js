import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, message } from '../../utils/antdComponents';
import { useTranslation } from 'react-i18next';
import { registerUser } from '../services/authService';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    phoneCode: '+58',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.email || !formData.password || !formData.phone) {
        throw new Error(t('errors.fields_required', 'Todos los campos son obligatorios'));
      }
      if (formData.password.length < 6) {
        throw new Error(t('errors.password_min_length', 'M\u00ednimo 6 caracteres'));
      }
      const { user, session } = await registerUser({
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: `${formData.phoneCode}${formData.phone}`,
      });
      
      // Si el registro fue exitoso y tenemos una sesi³n, iniciar sesi³n autom¡ticamente
      if (session && session.access_token) {
        const token = session.access_token;
        localStorage.setItem('token', token);
        message.success(t('register.success') + ' - ' + t('login.success'));
        navigate('/store');
      } else {
        message.success(t('register.success'));
        navigate('/store/login');
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error(error.message || t('errors.register', 'Error al registrar usuario'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">{t('header.signup')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          placeholder={t('header.email')}
          value={formData.email}
          onChange={handleChange}
        />
        <div className="flex">
          <select
            name="phoneCode"
            value={formData.phoneCode}
            onChange={handleChange}
            className="border rounded-l px-2"
          >
            <option value="+58">+58</option>
            <option value="+1">+1</option>
            <option value="+52">+52</option>
            <option value="+34">+34</option>
          </select>
          <Input
            name="phone"
            placeholder={t('profile.phone')}
            value={formData.phone}
            onChange={handleChange}
            className="flex-1 rounded-l-none"
          />
        </div>
        <Input.Password
          name="password"
          placeholder={t('password.new')}
          value={formData.password}
          onChange={handleChange}
        />
        <Button type="primary" htmlType="submit" loading={loading} className="w-full">
          {t('header.register')}
        </Button>
      </form>
      <div className="mt-4 text-sm">
        <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => navigate('/store/login')}>
          {t('header.login')}
        </span>
      </div>
    </div>
  );
};

export default Register;


