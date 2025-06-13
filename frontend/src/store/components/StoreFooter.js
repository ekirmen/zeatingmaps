import React from 'react';
import LinkWithRef from './LinkWithRef';
import { FaFacebook, FaTwitter, FaInstagram, FaSpotify, FaYoutube, FaWhatsapp, FaTiktok, FaTelegram } from 'react-icons/fa';
import { useFooter } from '../../contexts/FooterContext';

const icons = {
  facebookUrl: FaFacebook,
  twitterUrl: FaTwitter,
  instagramUrl: FaInstagram,
  spotifyUrl: FaSpotify,
  youtubeUrl: FaYoutube,
  whatsappUrl: FaWhatsapp,
  tiktokUrl: FaTiktok,
  telegramUrl: FaTelegram
};

const Footer = () => {
  const { footer } = useFooter();
  return (
    <footer className="bg-gray-900 text-white text-center py-4 mt-auto">
      <p className="text-sm">
        {footer.copyrightText || `© ${new Date().getFullYear()} TuEmpresa. Todos los derechos reservados.`}
      </p>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <LinkWithRef to="/store/perfil" className="hover:underline">Perfil</LinkWithRef>
        <LinkWithRef to="/companias" className="hover:underline">Compañías</LinkWithRef>
        <LinkWithRef to="/store/faq" className="hover:underline">Preguntas</LinkWithRef>
        <LinkWithRef to="/store/login-register" className="hover:underline">Login</LinkWithRef>
      </div>
      <div className="flex justify-center gap-4 mt-4">
        {Object.entries(icons).map(([key, Icon]) => (
          footer[key] ? (
            <a key={key} href={footer[key]} target="_blank" rel="noopener noreferrer" className="text-xl">
              <Icon />
            </a>
          ) : null
        ))}
      </div>
    </footer>
  );
};

export default Footer;
