import React from 'react';
import { useLocation } from 'react-router-dom';
import StoreApp from './store/StoreApp';
import BackofficeApp from './backoffice/BackofficeApp';

function App() {
  const location = useLocation();
  const path = location.pathname;

  // Determina si la ruta actual pertenece al backoffice
  const isBackoffice = path.startsWith('/backoffice') || path.startsWith('/dashboard');

  return isBackoffice ? <BackofficeApp /> : <StoreApp />;
}

export default App;
