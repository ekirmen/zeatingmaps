import React from 'react';
import { Link } from 'react-router-dom';  // Para navegar entre páginas

const Menu = () => {
  return (
    <div className="menu">
      <h2>Menú</h2>
      <ul>
        {/* Enlaces a las diferentes páginas */}
        <li><Link to="/recinto">Recinto</Link></li>
        <li><Link to="/dashboard/actividad">Actividad</Link></li>
        <li><Link to="/dashboard/recinto">Lista de Salas</Link></li>
        <li><Link to="/dashboard/usuarios">Usuarios</Link></li>
        <li><Link to="/dashboard/Referidos">Referidos</Link></li>
        <li><Link to="/dashboard/Plano">Plano</Link></li>
        <li><Link to="/dashboard/Evento">Evento</Link></li>
      </ul>
    </div>
  );
};

export default Menu;
