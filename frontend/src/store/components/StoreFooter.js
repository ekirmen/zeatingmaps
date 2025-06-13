import React from 'react';
import LinkWithRef from './LinkWithRef';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaSpotify,
  FaYoutube,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { useFooter } from '../../contexts/FooterContext';

// Default links shown when no value is provided via FooterContext
const defaultLinks = {
  facebookUrl: 'https://facebook.com/tuempresa',
  twitterUrl: 'https://twitter.com/tuempresa',
  instagramUrl: 'https://instagram.com/tuempresa',
  spotifyUrl: 'https://spotify.com',
  youtubeUrl: 'https://youtube.com/tuempresa',
  whatsappUrl: 'https://wa.me/0000000000',
  tiktokUrl: 'https://tiktok.com/@tuempresa',
  telegramUrl: 'https://t.me/tuempresa'
};

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
  const links = { ...defaultLinks, ...footer };
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
          links[key] ? (
            <a
              key={key}
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key.replace('Url', '')}
              className="text-xl"
            >
              <Icon />
            </a>
          ) : null
        ))}
      </div>
    </footer>
  );
};

export default Footer;
