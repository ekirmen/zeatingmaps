import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white text-center py-4">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} TuEmpresa. Todos los derechos reservados.
      </p>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <a href="/store/perfil" className="hover:underline">Perfil</a>
        <a href="/companias" className="hover:underline">Compañías</a>
        <a href="/store/login-register" className="hover:underline">Login</a>
      </div>
    </footer>
  );
};

export default Footer;
