import React from 'react';
import LinkWithRef from './LinkWithRef';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white text-center py-4">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} TuEmpresa. Todos los derechos reservados.
      </p>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <LinkWithRef to="/store/perfil" className="hover:underline">Perfil</LinkWithRef>
        <LinkWithRef to="/companias" className="hover:underline">Compañías</LinkWithRef>
        <LinkWithRef to="/store/login-register" className="hover:underline">Login</LinkWithRef>
      </div>
    </footer>
  );
};

export default Footer;
