// src/pages/CrearMapaPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import CrearMapa from '../components/CrearMapa';

const CrearMapaPage = () => {
  const { salaId } = useParams();
  
  return <CrearMapa salaId={salaId} />;
};

export default CrearMapaPage;
