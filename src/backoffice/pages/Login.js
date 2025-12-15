import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from '../../utils/antdComponents';
import { supabase } from '../../supabaseClient';
import { createAuthError, getAuthMessage } from '../../utils/authErrorMessages';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.login || !formData.password) {
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.login,
        password: formData.password,
      });

      if (error || !data.session) {
        throw await createAuthError({
          error: error || new Error('Respuesta de inicio de sesi³n inv¡lida'),
          email: formData.login,
          supabaseClient: supabase,
        });
      }

      const token = data.session.access_token;
      localStorage.setItem('token', token);

      onLogin?.({ token, user: data.user });

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const feedbackMessage = getAuthMessage(error);
      const messageType =
        error?.type && typeof message[error.type] === 'function' ? error.type : 'error';
      setError(feedbackMessage);
      message[messageType](feedbackMessage);
      localStorage.removeItem('token');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesi³n</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Usuario"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contrase±a"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors duration-200"
          >
            Iniciar Sesi³n
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
