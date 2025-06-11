import React, { useState } from 'react';
import Login from './Login';
import CreateUserForm from './../../backoffice/components/CreateUserForm'; 

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true); // Estado para alternar entre login y registro

  const handleCreateUser = (newUser) => {
    console.log('Usuario creado:', newUser);
    setIsLogin(true); // Cambia a la vista de login después de crear un usuario
  };

  return (
    <div className="login-register-container">
      <div className="login-register-box">
        <div className="tabs flex gap-2 mb-4">
          <button
            className={`px-4 py-2 border-b-2 ${isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesión
          </button>
          <button
            className={`px-4 py-2 border-b-2 ${!isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            onClick={() => setIsLogin(false)}
          >
            Registrarse
          </button>
        </div>

        {isLogin ? (
          <Login />
        ) : (
          <CreateUserForm
            onCreateUser={handleCreateUser}
            onCancel={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default LoginRegister;