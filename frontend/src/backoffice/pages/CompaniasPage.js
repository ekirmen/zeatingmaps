// pages/CompaniasPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CompaniasPage = () => {
  const [companias, setCompanias] = useState([]);

  useEffect(() => {
    const fetchCompanias = async () => {
      try {
        const response = await fetch('/api/companias'); // Ruta para obtener compañías
        const data = await response.json();
        setCompanias(data);
      } catch (error) {
        console.error('Error al obtener las compañías', error);
      }
    };
    
    fetchCompanias();
  }, []);

  return (
    <div>
      <h1>Compañías</h1>
      <ul>
        {companias.map(empresa => (
          <li key={empresa._id}>
            <Link to={`/companias/${empresa._id}/eventos`}>{empresa.nombre}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompaniasPage;
