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
        <div className="tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesión
          </button>
          <button
            className={!isLogin ? 'active' : ''}
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